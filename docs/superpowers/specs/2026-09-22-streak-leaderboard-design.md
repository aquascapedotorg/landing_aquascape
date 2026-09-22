# Desain: Mekanisme Streak & Leaderboard Kuaci

Tanggal: 2026-09-22
Status: Disetujui untuk implementasi (menunggu review spec)

## 1. Tujuan

Menambahkan mekanisme **streak kehadiran per peserta** dan **akumulasi kuaci harian**
pada AQUASCAPE Live Tank, lengkap dengan ranking/leaderboard. Fitur **hanya aktif di
mode Supabase** (`VITE_FISH_DATA_SOURCE=supabase`), karena membutuhkan data kehadiran
nyata dari tabel `communal_fishes`.

### Definisi

- **Peserta** = nilai `name` unik pada tabel `communal_fishes`.
- **Hadir pada satu hari** = ada minimal satu baris `communal_fishes` dengan `name`
  tersebut dan `entry_date` = hari itu.
- **current_streak** = jumlah hari berturut-turut peserta hadir, dihitung mundur dari
  hari ini (atau kemarin bila hari ini belum hadir).
- **best_streak** = rentang hadir berturut-turut terpanjang yang pernah dicapai peserta.
- **kuaci_in_streak** = total kuaci yang dimakan ikan peserta, dijumlahkan hanya untuk
  tanggal-tanggal yang termasuk dalam `current_streak` yang sedang berjalan.

### Aturan streak (disetujui)

1. Streak putus bila ada **satu hari bolong** (tidak hadir). Setelah bolong, hadir lagi
   menghasilkan `current_streak = 1` (reset ke 1). Definisi standar (GitHub/Duolingo).
2. Streak **tetap hidup** selama **kemarin** hadir, meski hari ini belum hadir (masih ada
   waktu hingga pergantian hari). Hadir hari ini → streak bertambah. Lewat pergantian
   hari tanpa hadir → baru putus.
3. `best_streak` selalu disimpan (dihitung) terpisah untuk keperluan ranking/tie-break.

### Aturan kuaci (disetujui)

- Kuaci **ikut streak**: diakumulasi sepanjang hari-hari dalam `current_streak`. Saat
  streak putus (bolong), `kuaci_in_streak` otomatis ikut "reset" karena tanggal di luar
  streak tidak dijumlahkan.
- Sumber kuaci: **akumulasi global** dari semua pengunjung. Kuaci yang dimakan ikan
  seorang peserta (oleh pengunjung mana pun) menambah total peserta itu untuk hari ini.
- Hanya ikan **communal** (punya nama peserta dari Supabase) yang dicatat. Maskot & ikan
  lokal (`fish-names.json`) diabaikan.

## 2. Model Data & Skema Supabase

Streak **tidak disimpan** — dihitung on-the-fly dari `communal_fishes.entry_date` yang
sudah ada. Hanya kuaci yang butuh penyimpanan baru, disimpan **per hari** agar reset
otomatis mengikuti streak.

### Tabel baru

```sql
create table if not exists public.fish_daily_kuaci (
  name        text not null,
  entry_date  date not null default current_date,
  kuaci_count integer not null default 0,
  updated_at  timestamptz not null default now(),
  primary key (name, entry_date)
);

create index if not exists idx_fish_daily_kuaci_entry_date
  on public.fish_daily_kuaci (entry_date desc);

alter table public.fish_daily_kuaci enable row level security;

create policy "Allow public read access"
  on public.fish_daily_kuaci for select using (true);

create policy "Allow public upsert access"
  on public.fish_daily_kuaci for insert with check (true);

create policy "Allow public update access"
  on public.fish_daily_kuaci for update using (true) with check (true);

alter publication supabase_realtime add table public.fish_daily_kuaci;
```

### Fungsi RPC (increment atomik, hindari race antar pengunjung)

```sql
create or replace function public.increment_kuaci(p_name text, p_amount int)
returns void
language plpgsql
security definer
as $$
begin
  insert into public.fish_daily_kuaci (name, entry_date, kuaci_count, updated_at)
  values (p_name, current_date, greatest(p_amount, 0), now())
  on conflict (name, entry_date)
  do update set
    kuaci_count = public.fish_daily_kuaci.kuaci_count + greatest(excluded.kuaci_count, 0),
    updated_at = now();
end;
$$;

grant execute on function public.increment_kuaci(text, int) to anon;
```

## 3. Perhitungan (client-side)

Semua perhitungan di client, dari data Supabase:

1. Ambil `(name, entry_date)` distinct dari `communal_fishes`.
2. Ambil `(name, entry_date, kuaci_count)` dari `fish_daily_kuaci`.
3. Untuk tiap `name`:
   - Susun himpunan tanggal hadir.
   - `current_streak`: mulai dari hari ini bila hadir, else dari kemarin bila hadir,
     lalu mundur selama tiap tanggal-1 juga hadir. Jika hari ini & kemarin sama-sama
     tidak hadir → `current_streak = 0`.
   - `best_streak`: rentang berturut terpanjang di seluruh riwayat tanggal hadir.
   - `kuaci_in_streak`: jumlah `kuaci_count` untuk tanggal-tanggal dalam current_streak.
4. Leaderboard: urutkan `current_streak` desc, tie-break `kuaci_in_streak` desc, lalu
   `best_streak` desc, lalu `name` asc (stabil). `rank` = indeks (1-based).

## 4. Arsitektur & Komponen

### Modul baru: `src/services/streakService.ts`

Tanggung jawab tunggal: baca data, hitung streak/leaderboard, buffer tulis kuaci, emit
event. Tidak menyentuh rendering.

API publik:

- `initStreakService()` — panggil saat mode Supabase aktif. Fetch awal, hitung, subscribe
  realtime (`communal_fishes` INSERT + `fish_daily_kuaci` changes → recompute + emit).
- `recordKuaciEaten(name: string, amount = 1)` — tambah ke buffer memori (Map). Tidak
  langsung ke DB.
- `getStreakFor(name: string): { streak: number; rank: number } | undefined` — lookup
  O(1) untuk nametag (dari Map hasil hitung terakhir).
- `getLeaderboard(): LeaderboardEntry[]` — array terurut untuk drawer.
- `isStreakActive(): boolean` — true hanya bila mode Supabase & service ter-init.

Internal:

- **Buffer flush**: timer tiap **5 detik** → untuk tiap nama di buffer, panggil RPC
  `increment_kuaci(name, amount)`; kosongkan buffer hanya bila sukses. Flush juga di
  `beforeunload` (best-effort). Bila gagal: buffer dipertahankan, log warn, tidak
  mengganggu animasi.
- Recompute dipicu oleh: fetch awal, event realtime, dan setelah flush kuaci sukses.

### Event: `src/components/aquascapeEvents.ts`

Tambah pola listener baru (mengikuti `onFishRosterChanged`):
- `onStreakUpdated(listener)` / `notifyStreakUpdated()`.

### Canvas: `src/components/fishRenderer.ts` + `AquascapeCanvas.tsx`

- `AquascapeCanvas`: saat ikan **communal** makan kuaci (di blok `feedFishKuaci`), panggil
  `streakService.recordKuaciEaten(fish.name, 1)`.
- `drawFishNametag(ctx, fish, isHovered, streakInfo?)` diperluas:
  - Untuk ikan communal dengan data streak: gambar `nama · <streak>` (angka, **tanpa
    emoji**).
  - Rank 1–3: gambar **mahkota** via canvas path (emas/perak/perunggu). Rank lain: hanya
    angka streak.
  - Non-communal: tidak menampilkan streak/mahkota.
- Data streak per fish diambil dari `getStreakFor(fish.name)` yang dibaca dari Map
  (bukan hitung ulang per frame). Map di-refresh saat `onStreakUpdated`.

### Komponen baru: `src/components/StreakLeaderboardDrawer.tsx`

- Panel slide-in (dari kanan). Props: `isOpen`, `onClose`.
- Baris: rank (mahkota 1–3 / angka) · nama · streak (hari) · kuaci_in_streak · best_streak.
- Subscribe `onStreakUpdated` → refresh realtime tanpa reload.
- Empty state ramah bila belum ada data hari ini.
- Hanya dirender saat mode Supabase.

### Integrasi Zen: `src/components/ZenAquariumModal.tsx`

- Tambah tombol **"Ranking"** (ikon piala/medali) di kontrol Zen — **hanya** saat mode
  Supabase. Klik → buka `StreakLeaderboardDrawer`.
- ESC menutup drawer dulu (sebelum menutup Zen), mengikuti pola `isFaunaModalOpen`.

## 5. Aktivasi

- Fitur aktif **hanya** bila `isSupabaseModeActive()` true.
- `initStreakService()` dipanggil dari `loadFishNamesCatalog()` pada cabang sukses
  Supabase (setelah `setSupabaseModeActive(true)`).
- Di mode lokal: tidak ada tombol Ranking, nametag tidak menampilkan streak/mahkota.

## 6. Penanganan Error & Edge Case

- Flush kuaci gagal → buffer dipertahankan (tidak ada kuaci hilang), warn log.
- Nama dengan panjang > 25 tetap dipotong di nametag (perilaku eksisting); pencocokan
  streak memakai `name` penuh dari DB.
- Pergantian hari saat halaman terbuka: recompute berikutnya (via realtime/interval)
  akan memakai tanggal baru; streak dihitung ulang benar.
- Zona waktu: gunakan tanggal lokal (`getTodayDateString`) yang konsisten dengan util
  `isDateToday` eksisting; `entry_date` di DB memakai `current_date` server.
- Nama duplikat berbeda-kasus (mis. "budi" vs "Budi"): diperlakukan sebagai peserta
  berbeda (case-sensitive), mengikuti data mentah DB. (Tidak dinormalisasi.)

## 7. Testing

- `streakService` (unit, tanpa jaringan — fungsi hitung murni diekstrak agar testable):
  - streak dasar (hadir berturut) → nilai benar.
  - bolong 1 hari → reset ke 1; best_streak tetap.
  - hari ini belum hadir tapi kemarin hadir → streak tetap hidup.
  - hari ini & kemarin tidak hadir → streak 0.
  - kuaci_in_streak menjumlahkan hanya tanggal dalam streak (tanggal luar diabaikan).
  - leaderboard: urutan & tie-break benar; rank 1-based.
- Buffer flush: recordKuaciEaten menambah buffer; flush memanggil RPC dengan agregat
  benar; gagal → buffer dipertahankan (mock RPC).
- Regresi: mode lokal tidak mengaktifkan fitur; tombol Ranking hanya di Supabase.

## 8. Berkas yang Disentuh

- Baru: `src/services/streakService.ts`, `src/components/StreakLeaderboardDrawer.tsx`,
  `supabase/streak.sql` (skema tambahan), `src/services/streakService.test.ts`.
- Ubah: `src/components/aquascapeEvents.ts`, `src/components/fishRenderer.ts`,
  `src/components/AquascapeCanvas.tsx`, `src/components/ZenAquariumModal.tsx`,
  `src/data/fishCatalog.ts` (init service), `docs/WEBHOOK.md` (opsional: catat tabel baru).

## 9. Di Luar Lingkup (YAGNI)

- Autentikasi peserta / klaim identitas.
- Notifikasi/badge historis lintas minggu-bulan.
- Anti-cheat kuaci (rate-limit per pengunjung) — cukup throttle flush.
- Leaderboard di header utama / landing (hanya Zen sesuai keputusan).
