# Desain: Ikan Legendaris Emas (1 Peserta Terpilih per Hari)

Tanggal: 2026-09-24
Status: Disetujui untuk implementasi (menunggu review spec)
Membangun di atas: fitur communal fish + streak/leaderboard (mode Supabase).

## 1. Tujuan

Setiap hari, **satu peserta** (dari communal fish hari itu) dipilih secara acak-namun-
deterministik menjadi **Ikan Legendaris**. Ikan peserta itu di-render sebagai **Koi
emas mewah** yang bersinar (glow berdenyut + partikel kilau + jejak berkilau), dan
sebuah **banner megah** di Zen mode mengumumkan pemenangnya. Semua pengunjung melihat
pemenang yang sama pada hari yang sama. Fitur **hanya aktif di mode Supabase**.

## 2. Pemilihan Pemenang (deterministik per hari)

Fungsi murni di `streakCalculations.ts`:

```ts
export function pickLegendaryName(names: string[], dateStr: string): string | null
```

- Input: daftar nama peserta unik hari itu (sudah ternormalisasi) + tanggal `YYYY-MM-DD`.
- Urutkan `names` secara stabil (alfabetis) agar indeks konsisten lintas klien.
- Seed = hash sederhana deterministik dari `dateStr` (mis. djb2/FNV). Indeks =
  `seed % names.length`. Kembalikan nama pada indeks itu.
- `names` kosong → `null` (tidak ada legendaris hari itu).
- Karena input (tanggal + daftar peserta) sama untuk semua klien, hasilnya identik —
  tanpa perlu menyimpan pilihan di DB.

Catatan: bila daftar peserta bertambah di tengah hari (ada kiriman baru), indeks bisa
bergeser. Untuk stabilitas, pemenang dihitung dari **snapshot peserta saat load** dan
di-recompute saat roster berubah; ini dapat diterima (pemenang bisa berubah bila peserta
baru masuk). Alternatif "kunci di peserta paling awal" ada di Di Luar Lingkup.

## 3. Menandai Ikan Legendaris

- Tipe `FishParticle` mendapat `isLegendary?: boolean`.
- Saat communal fish disinkronkan ke canvas (`applyCommunalFishesToSchool` /
  `spawnFish` communal), tandai partikel yang namanya == pemenang sebagai
  `isLegendary = true`; sisanya false.
- Pemenang saat ini disimpan di modul kecil `legendaryService.ts`:
  - `computeLegendaryFromLeaderboard()` — ambil daftar nama dari leaderboard/attendance,
    panggil `pickLegendaryName`, simpan `legendaryName`.
  - `getLegendaryName(): string | null`.
  - Recompute saat streak/roster berubah (pakai `onStreakUpdated` yang sudah ada).
- Canvas menandai/menghapus flag `isLegendary` tiap kali roster berubah, mencocokkan
  `normalizeName(fish.name) === normalizeName(legendaryName)`.

## 4. Wujud: Koi Legendaris (render canvas)

Blok render baru di `AquascapeCanvas` untuk `fish.isLegendary` (menimpa render jenis
aslinya), digambar via path (bukan bitmap):

- **Badan koi** emas anggun: elips memanjang dengan gradasi emas (highlight `#fff3b0`,
  badan `#f5c542`, bayang `#b8860b`).
- **Sirip & ekor mengalir**: ekor lebar berlipat + sirip punggung/perut, berayun
  (pakai `tailWag`/phase) — kesan anggun & mewah.
- **Bercak koi** (opsional aksen): beberapa bercak oranye/putih lembut di badan.
- Mata kecil.
- Ukuran sedikit lebih besar dari ikan biasa (mis. `size * 1.15`) agar menonjol.

## 5. Efek Mewah & Bersinar

Digambar di render loop untuk ikan legendaris (world coords, di belakang & sekitar):

1. **Glow emas berdenyut**: radial gradient emas di belakang ikan, radius/opacity
   berosilasi (`Math.sin(timeSec * k)`).
2. **Partikel kilau (sparkle)**: beberapa titik/bintang kecil emas muncul-hilang pada
   posisi acak-stabil di sekitar ikan (fase per-indeks), berkedip.
3. **Jejak berkilau (trail)**: simpan beberapa posisi terakhir ikan; gambar titik emas
   memudar di sepanjang jejak. Disimpan di ref lokal per partikel legendaris
   (mis. `Map<id, {x,y}[]>` di canvas, dibatasi ~12 titik).

Semua efek murni visual, tidak memengaruhi fisika/gerak.

## 6. Nametag Legendaris

`drawFishNametag` diperluas (atau cabang khusus): bila `fish.isLegendary`, gambar
nametag **emas** (latar gelap, tepi/teks emas) dengan ikon **bintang/mahkota** (path,
tanpa emoji) di kiri nama. Selalu tampil untuk legendaris (tidak tergantung showNametags),
kecuali di clean mode (ikut disembunyikan seperti nametag lain).

## 7. Banner Zen (pengumuman)

Di `ZenAquariumModal`, banner megah muncul bila mode Supabase & ada `legendaryName`:

- Posisi: atas-tengah (di bawah header), pointer-events none agar tak menghalangi.
- Isi: teks utama **"{Name} — Shining Gold, Chosen Today"** + sub-teks kecil
  **"Aquascape Legend"**. Ikon bintang/mahkota SVG. Warna emas (`#f5c542`) dengan
  latar gelap semi-transparan + sedikit glow.
- Disembunyikan saat **clean mode** (ikut aturan UI Zen lain).
- Update reaktif saat `legendaryName` berubah (via `onStreakUpdated`/event).

## 8. Aktivasi

- Aktif hanya bila `isSupabaseModeActive()`.
- Init: `legendaryService` di-init bersama streak (di cabang sukses Supabase), subscribe
  ke `onStreakUpdated` untuk recompute pemenang.
- Mode lokal: tidak ada pemenang, tidak ada banner, tidak ada koi emas.

## 9. Arsitektur & Berkas

- **Ubah:** `src/services/streakCalculations.ts` — tambah `pickLegendaryName(names, dateStr)` (murni) + `+ test`.
- **Buat:** `src/services/legendaryService.ts` — hitung & simpan pemenang, subscribe event, getter.
- **Ubah:** `src/types.ts` — `FishParticle.isLegendary?: boolean`.
- **Ubah:** `src/components/AquascapeCanvas.tsx` — tandai `isLegendary` saat sync roster;
  render Koi emas + glow/sparkle/trail; nametag emas.
- **Ubah:** `src/components/fishRenderer.ts` — cabang nametag legendaris (emas + ikon).
- **Ubah:** `src/components/ZenAquariumModal.tsx` — banner legendaris (Supabase-only,
  hidden saat clean mode).
- **Ubah:** `src/data/fishCatalog.ts` — init `legendaryService` di cabang Supabase.

## 10. Edge Case

- 0 peserta hari itu → tidak ada legendaris (banner & koi tidak muncul).
- Pemenang belum ter-spawn sebagai partikel (mis. ikan belum sync) → tidak error;
  koi/efek muncul begitu partikelnya ada.
- Nama pemenang punya varian spasi → cocokkan via `normalizeName`.
- Clean mode → banner & nametag legendaris ikut tersembunyi; koi emas + glow tetap
  (bagian dari kanvas, bukan UI).
- Pergantian hari saat halaman terbuka → recompute berikutnya memakai tanggal baru,
  pemenang berganti.
- Ganti wujud: karena legendaris di-render sebagai koi, jenis asli peserta diabaikan
  untuk render (tapi flag `isCommunal` tetap; streak/kuaci tak terpengaruh).

## 11. Testing

- `pickLegendaryName` (murni):
  - deterministik: input sama → output sama (dipanggil 2×).
  - tanggal berbeda → (umumnya) pemenang berbeda; hasil selalu anggota `names`.
  - `names` kosong → null.
  - urutan input berbeda (belum tersortir) → hasil sama (karena disortir internal).
- Verifikasi manual (browser): koi emas + glow/sparkle/trail tampil pada pemenang;
  banner Zen menampilkan nama; hilang di clean mode; nonaktif di mode lokal.

## 12. Di Luar Lingkup (YAGNI)

- Menyimpan pemenang historis di DB / arsip legenda.
- Mengunci pemenang ke peserta paling awal (agar tak bergeser saat ada kiriman baru).
- Hadiah/kuaci bonus untuk pemenang.
- Animasi transisi khusus saat seseorang "menjadi" legendaris.
- Suara/audio khusus legendaris.
