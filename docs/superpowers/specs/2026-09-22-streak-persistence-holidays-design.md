# Desain: Persistensi Streak, Skip Weekend/Libur & Tie-break Stabil

Tanggal: 2026-09-22
Status: Disetujui untuk implementasi (menunggu review spec)
Membangun di atas: `2026-09-22-streak-leaderboard-design.md` (fitur streak dasar sudah ada).

## 1. Tujuan

Tiga peningkatan pada fitur streak yang sudah ada:

1. **Skip weekend & hari libur nasional** — weekend (Sabtu/Minggu) dan tanggal
   libur tidak memutus streak, tetapi juga tidak menambah hitungan (menjembatani).
   Absen di hari kerja biasa tetap memutus streak (reset ke 1).
2. **Tie-break ranking stabil** — saat streak sama, urutan ditentukan waktu
   bergabung pertama (`created_at` paling awal), agar ranking tidak berpindah-pindah.
3. **Persistensi streak ke database** — snapshot streak terhitung disimpan ke tabel
   baru `fish_streaks` (cache/histori), dengan `best_streak` yang tak pernah turun.

Fitur tetap **hanya aktif di mode Supabase**.

## 2. Aturan Skip Weekend & Libur

Definisi: `isSkipDay(dateStr, holidays)` = true bila tanggal itu Sabtu, Minggu,
ATAU ada di set `holidays`.

**Current streak** (mundur dari hari ini):
1. Tentukan anchor. Mulai dari hari ini; selama tanggal saat ini adalah skip-day,
   mundur satu hari (tanpa menghitung). Saat menemukan hari kerja:
   - Bila hari kerja itu hadir → jadi anchor.
   - Bila tidak hadir → periksa satu tingkat: bila hari ini sendiri hadir, anchor =
     hari ini; else streak = 0 (sudah bolong di hari kerja terakhir).
2. Dari anchor mundur: untuk tiap langkah, mundur satu hari; lewati skip-day tanpa
   menghitung; saat menemukan hari kerja:
   - Bila hadir → streak += 1, lanjut mundur.
   - Bila tidak hadir → berhenti (bolong).
3. Streak = jumlah **hari kerja yang dihadiri** dalam rentang berturut. Weekend/libur
   tidak menambah hitungan, hanya tidak memutus.

**Aturan operasional yang disederhanakan** (implementasi): berjalan mundur hari demi
hari dari hari ini. Lewati skip-day. Untuk tiap hari kerja: jika hadir, tambah ke
streak; jika tidak hadir, berhenti. Anchor khusus: jika hari ini sendiri skip-day dan
tidak hadir, itu tidak memutus — teruskan mundur mencari hari kerja pertama.

**Contoh (biner: H=hadir, -=absen):**
- Jum(H) Sab(libur) Min(libur) Sen(H) → streak Senin = 2.
- Sen(H) Sel(-, hari kerja) Rab(H) → streak Rabu = 1 (Selasa bolong).
- Jum(H) → Sen(-, hari kerja): saat Selasa dicek, Senin bolong → streak putus.
- Hari ini Sabtu, kemarin (Jumat) hadir → streak tetap hidup (Sabtu di-skip).

**best_streak**: rentang hari-kerja-hadir terpanjang di seluruh riwayat, dengan
skip-day menjembatani. Dihitung dengan aturan skip yang sama.

## 3. Sumber Data Libur

- File `public/holidays.txt`, satu tanggal `YYYY-MM-DD` per baris.
- Parser: ekstrak pola `\d{4}-\d{2}-\d{2}` dari tiap baris; abaikan baris tanpa pola
  (memungkinkan komentar seperti `2026-01-01 Tahun Baru`).
- Di-fetch sekali di `initStreakService()`; disimpan sebagai `Set<string>`.
- Fetch gagal → set kosong (weekend tetap di-skip; hanya libur nasional yang tidak).
- Isi awal (diberikan user):
  2026-02-16, 2026-02-17, 2026-03-19, 2026-03-20, 2026-03-21, 2026-03-22,
  2026-03-23, 2026-03-24, 2026-04-03, 2026-04-05, 2026-05-01, 2026-05-14,
  2026-05-15, 2026-05-27, 2026-05-31, 2026-06-01, 2026-06-16, 2026-07-17,
  2026-07-25, 2026-12-24, 2026-12-25.

## 4. Tie-break Ranking

`computeLeaderboard` menerima `created_at` per baris kehadiran. Untuk tiap nama,
hitung `firstSeen = MIN(created_at)`.

Urutan ranking:
1. `currentStreak` desc
2. `firstSeen` asc (yang bergabung lebih dulu di atas)
3. `name` asc (pengaman terakhir agar total-deterministik)

Catatan: `kuaciInStreak` dan `bestStreak` tidak lagi jadi tie-break utama; `firstSeen`
menggantikannya sebagai pembeda utama setelah streak. (kuaci tetap ditampilkan.)

## 5. Perubahan Interface Kalkulasi (fungsi murni)

```ts
interface AttendanceRow {
  name: string;
  entry_date: string;   // YYYY-MM-DD
  created_at?: string;  // BARU: untuk firstSeen (ISO string)
}

interface LeaderboardEntry {
  name: string;
  currentStreak: number;
  bestStreak: number;
  kuaciInStreak: number;
  firstSeen: string;    // BARU: MIN(created_at) atau '' bila tak ada
  rank: number;
}

function computeLeaderboard(
  attendance: AttendanceRow[],
  kuaci: KuaciRow[],
  today: string,
  holidays: Set<string>,   // BARU
): LeaderboardEntry[]
```

Helper baru (semua murni, testable):
- `isSkipDay(dateStr: string, holidays: Set<string>): boolean` — Sabtu/Minggu/libur.
- `isWeekend(dateStr: string): boolean` — internal.

`kuaciInStreak` tetap menjumlahkan kuaci hanya untuk tanggal **hari kerja yang
dihadiri** dalam current streak (skip-day tidak punya kuaci, jadi otomatis 0).

## 6. Persistensi ke Database

### Tabel baru (append ke `supabase/streak.sql`)

```sql
create table if not exists public.fish_streaks (
  name             text primary key,
  current_streak   integer not null default 0,
  best_streak      integer not null default 0,
  last_active_date date,
  updated_at       timestamptz not null default now()
);

alter table public.fish_streaks enable row level security;
create policy "Allow public read access" on public.fish_streaks for select using (true);
create policy "Allow public insert access" on public.fish_streaks for insert with check (true);
create policy "Allow public update access" on public.fish_streaks for update using (true) with check (true);
alter publication supabase_realtime add table public.fish_streaks;
```

### RPC upsert batch (atomik)

```sql
create or replace function public.upsert_streaks(p_rows jsonb)
returns void language plpgsql security definer as $$
declare r jsonb;
begin
  for r in select * from jsonb_array_elements(p_rows) loop
    insert into public.fish_streaks (name, current_streak, best_streak, last_active_date, updated_at)
    values (
      r->>'name',
      coalesce((r->>'current_streak')::int, 0),
      coalesce((r->>'best_streak')::int, 0),
      nullif(r->>'last_active_date','')::date,
      now()
    )
    on conflict (name) do update set
      current_streak   = excluded.current_streak,
      best_streak      = greatest(public.fish_streaks.best_streak, excluded.best_streak),
      last_active_date = excluded.last_active_date,
      updated_at       = now();
  end loop;
end;
$$;
grant execute on function public.upsert_streaks(jsonb) to anon;
```

`best_streak` pakai `GREATEST` → rekor tidak pernah turun.

### Alur tulis di streakService

- Setelah `refresh()` menghitung leaderboard, jadwalkan snapshot write dengan
  debounce ~10 detik (lebih jarang dari flush kuaci 5 detik).
- Payload: array `{name, current_streak, best_streak, last_active_date}` dari
  leaderboard terkini. `last_active_date` = tanggal hadir terbaru nama itu.
- Kirim via satu RPC `upsert_streaks(payload)`.
- Gagal → log warn, retry di siklus berikut. Tidak mengganggu UI.

### Pemakaian snapshot

- Leaderboard yang ditampilkan tetap dari perhitungan live (paling akurat).
- `best_streak` yang ditampilkan = `max(bestStreak_live, snapshot.best_streak)` agar
  rekor persisten tidak turun bila data lama terpangkas.
- Snapshot juga tersedia untuk histori / query eksternal.

## 7. Arsitektur & Berkas

- **Ubah:** `src/services/streakCalculations.ts` — tambah `isSkipDay`/`isWeekend`,
  ubah `computeCurrentStreak` & `computeBestStreak` untuk skip, tambah `firstSeen` +
  tie-break, ubah signature `computeLeaderboard` (+holidays param).
- **Ubah:** `src/services/streakService.ts` — fetch `holidays.txt`, ambil `created_at`
  di query attendance, oper holidays ke computeLeaderboard, tambah snapshot writer
  (debounce 10s) + merge best_streak dari snapshot.
- **Ubah:** `supabase/streak.sql` — append tabel `fish_streaks` + RPC `upsert_streaks`.
- **Buat:** `public/holidays.txt` — daftar tanggal libur.
- **Ubah tes:** `src/services/streakCalculations.test.ts` — kasus skip weekend/libur,
  firstSeen tie-break. `streakService.test.ts` — holidays fetch/parse (bila perlu).

Komponen UI (drawer, nametag) TIDAK berubah struktur — hanya membaca `LeaderboardEntry`
yang sekarang punya `firstSeen` (opsional dipakai). `bestStreak`/`currentStreak`/`rank`
tetap sama namanya.

## 8. Edge Case

- Tie-break `firstSeen`: bila `created_at` tak ada (data lama), `firstSeen=''`. Aturan
  perbandingan tegas: entri dengan firstSeen non-kosong selalu di atas entri dengan
  firstSeen kosong; bila keduanya non-kosong → bandingkan ISO string asc; bila keduanya
  kosong → jatuh ke tie-break `name` asc. (Implementasi: perlakukan '' sebagai nilai
  "tak-hingga" saat membandingkan, sehingga selalu kalah dari timestamp mana pun.)
- Zona waktu: tetap pakai tanggal lokal (`toDateString`) konsisten dgn util eksisting.
- holidays.txt kosong/gagal fetch: hanya weekend yang di-skip; tidak crash.
- Tanggal libur yang jatuh di weekend: tidak masalah (sudah skip via weekend).
- Snapshot write saat leaderboard kosong: kirim array kosong / skip (tidak menulis).

## 9. Testing

- `computeLeaderboard` (murni):
  - Jumat→(Sab/Min)→Senin = streak 2 (skip weekend, jembatani).
  - Hadir dgn hari libur di tengah (mis. 2026-05-01) = tidak putus.
  - Absen hari kerja biasa = reset ke 1.
  - Hari ini weekend, kemarin(Jumat) hadir = streak tetap hidup.
  - bestStreak dengan skip = rentang terpanjang benar.
  - Tie-break: streak sama → firstSeen lebih awal rank lebih tinggi; firstSeen sama →
    nama asc. Ranking stabil (dipanggil 2x hasil identik).
  - firstSeen kosong (tanpa created_at) → tetap deterministik.
- Parser holidays: ekstrak tanggal dari baris dgn/tanpa komentar; baris kosong diabaikan.

## 10. Di Luar Lingkup (YAGNI)

- Konfigurasi weekend berbeda (mis. Jumat-Sabtu) — hardcode Sabtu/Minggu.
- UI edit libur dari dalam app — cukup edit file.
- Histori streak time-series (hanya snapshot terkini per nama).
- Menampilkan firstSeen di UI drawer (data ada, tampilan opsional, tidak wajib).
