# Desain: Ikon Spesies di Leaderboard + Sorot Ikan dari Klik/Hover

Tanggal: 2026-09-23
Status: Disetujui untuk implementasi (menunggu review spec)
Membangun di atas: fitur streak/leaderboard (`fish_streaks`, drawer di Zen).

## 1. Tujuan

Memudahkan memantau nama peserta di papan peringkat streak:
1. Tampilkan **ikon spesies** (kepala ikan, SVG) di kiri tiap nama, berwarna sesuai
   jenis ikannya, agar mudah mencocokkan nama dengan ikan di kolam.
2. **Hover** sebuah baris → ikan terkait langsung **menyala (glow)** di canvas
   (preview), lepas hover → normal.
3. **Klik** sebuah baris → ikan disorot lebih kuat & lebih lama di posisinya
   (glow kuat + lingkaran penanda berdenyut + nametag dipaksa tampil ~4 detik),
   tanpa memindahkan kamera atau ikan.

Fitur hanya relevan di Zen (tempat drawer berada) dan mode Supabase.

## 2. Sumber Spesies

`computeLeaderboard` belum menyimpan spesies. Ambil dari `communal_fishes.species`
milik peserta itu, memakai entry dengan `created_at` TERBARU (agar mencerminkan
ikan terkini bila peserta pernah pakai spesies berbeda). Normalisasi via
`normalizeFishSpecies` (default `neonTetra` bila kosong/tak dikenal).

## 3. Perubahan Interface (kalkulasi murni)

```ts
interface AttendanceRow {
  name: string;
  entry_date: string;
  created_at?: string;
  species?: string | null; // BARU
}

interface LeaderboardEntry {
  name: string;
  currentStreak: number;
  bestStreak: number;
  kuaciInStreak: number;
  firstSeen: string;
  species: FishSpeciesType; // BARU (default 'neonTetra')
  rank: number;
}
```

Saat grouping attendance per nama (setelah normalisasi nama), lacak species dari
baris ber-`created_at` terbesar. Impor `normalizeFishSpecies` dari
`supabaseFishService` untuk memetakan ke `FishSpeciesType`.

Catatan: `streakCalculations.ts` saat ini murni (tanpa I/O). `normalizeFishSpecies`
juga fungsi murni (pemetaan string), jadi mengimpornya tidak melanggar kemurnian.

## 4. Ikon Spesies (komponen React)

Komponen baru `src/components/FishSpeciesIcon.tsx`:

```ts
function FishSpeciesIcon(props: {
  species: FishSpeciesType;
  size?: number;      // default 22
  className?: string;
}): JSX.Element
```

- Mengembalikan `<svg>` inline dengan bentuk khas per spesies (silhouette
  sederhana: hiu bersirip punggung, paus gemuk, orca dengan bercak, lumba-lumba,
  pari lebar, buntal bulat, udang melengkung, angelfish tinggi, guppy berekor
  kipas, rasbora/tetra ramping, penyu bercangkang, maskot origami; default tetra).
- Warna isi diambil dari peta warna spesies (samakan dengan warna di canvas /
  `spawnBabyFish` getSpeciesColor) agar konsisten dengan ikan sungguhan.
- Tanpa emoji. Murni path SVG. Ringan (dipakai 40+ baris).
- Ukuran kecil (~22px), `viewBox` konsisten, `aria-hidden` (dekoratif).

## 5. Jembatan Highlight (aquascapeEvents)

Tambah ke `AquascapeCanvasProvider` dan manager:

```ts
highlightFish?: (name: string, opts: { hover?: boolean; focus?: boolean }) => void;
clearFishHighlight?: (name?: string) => void;
```

Manager meneruskan ke SEMUA provider (agar Hero & Zen konsisten), mengikuti pola
`syncCommunalFish`. Pencocokan nama memakai `normalizeName` agar varian spasi tetap
cocok.

- `hover: true`  → set `fish.hovered = true` pada partikel yang namanya cocok.
- `focus: true`  → set `fish.highlightUntil = Date.now() + 4000` (glow kuat + marker).
- `clearFishHighlight(name)` → `fish.hovered = false` untuk nama itu (atau semua bila
  tanpa argumen). Tidak menghapus `highlightUntil` (klik meluruh sendiri by waktu).

## 6. Render Highlight (canvas)

`FishParticle` + `hovered?: boolean`, `highlightUntil?: number` (di `types.ts`).

Di render loop, sebelum/à saat menggambar tiap ikan:
- `isHover = fish.hovered === true`
- `isFocus = fish.highlightUntil && fish.highlightUntil > now`
- Bila `isHover` atau `isFocus`:
  - Gambar **glow**: lingkaran radial lembut di belakang ikan (warna teal/cyan),
    lebih kuat untuk focus.
  - Bila `isFocus`: gambar **lingkaran penanda berdenyut** (radius berosilasi) di
    sekeliling ikan + paksa nametag tampil (lewat kondisi `showNametags || isHovered
    || isHighlighted`).
- Glow digambar di koordinat dunia ikan (sebelum transform flip), tidak mengganggu
  gambar ikan itu sendiri.

Peluruhan: `highlightUntil` otomatis kadaluarsa (perbandingan waktu tiap frame),
tak perlu timer terpisah. `hovered` dibersihkan oleh `clearFishHighlight`.

## 7. Perubahan Drawer

`StreakLeaderboardDrawer.tsx`:
- Impor `FishSpeciesIcon` dan `aquascapeEvents`.
- Tiap `<li>`:
  - Render `<FishSpeciesIcon species={e.species} />` di kiri (setelah kolom rank).
  - `onMouseEnter` → `aquascapeEvents.highlightFish(e.name, { hover: true })`.
  - `onMouseLeave` → `aquascapeEvents.clearFishHighlight(e.name)`.
  - `onClick` → `aquascapeEvents.highlightFish(e.name, { focus: true })`; set state
    `selectedName` untuk memberi ring menyala pada baris (DOM) selama beberapa detik.
  - Baris jadi `button`/`role` yang bisa diklik (kursor pointer, aksesибel).
- Saat drawer ditutup / unmount → `clearFishHighlight()` (bersihkan semua hover).

## 8. Edge Case

- Nama tanpa partikel di canvas (ikan belum ter-spawn) → highlight no-op, tidak error.
- Hover cepat antar baris → selalu clear baris sebelumnya sebelum set baru (drawer
  memanggil clear di onMouseLeave; canvas juga hanya menandai nama yang cocok).
- Dua ikan bernama sama (kasus langka) → keduanya menyala (dapat diterima).
- Species kosong/tak dikenal → `neonTetra` (ikon tetra), konsisten dgn normalizeFishSpecies.
- Hover di Hero canvas (bukan Zen) → provider Hero juga menerima; aman (glow di Hero
  juga). Drawer hanya ada di Zen, jadi praktis efek di Zen.

## 9. Testing

- `computeLeaderboard` (murni): entry mengembalikan `species` dari baris created_at
  terbaru; default `neonTetra` bila tak ada; varian nama tergabung tetap ambil
  species terbaru.
- `FishSpeciesIcon`: render tanpa crash untuk semua 13 spesies + default (uji ringan
  opsional; komponen presentational).
- Highlight: uji unit sulit (canvas imperatif) — verifikasi manual di browser:
  hover baris → ikan glow; klik → glow kuat + marker; tutup drawer → glow hilang.

## 10. Berkas

- Ubah: `src/services/streakCalculations.ts` (+species di AttendanceRow &
  LeaderboardEntry, ambil species terbaru), `+ test`.
- Ubah: `src/services/streakService.ts` (select species).
- Baru: `src/components/FishSpeciesIcon.tsx`.
- Ubah: `src/components/aquascapeEvents.ts` (highlightFish/clearFishHighlight +
  provider interface).
- Ubah: `src/components/AquascapeCanvas.tsx` (implement provider fns + render glow/
  marker).
- Ubah: `src/types.ts` (FishParticle: hovered?, highlightUntil?).
- Ubah: `src/components/StreakLeaderboardDrawer.tsx` (ikon + hover/click handlers).

## 11. Di Luar Lingkup (YAGNI)

- Memindahkan/zoom kamera ke ikan.
- Menggiring ikan ke tengah.
- Thumbnail mini-canvas kepala ikan (pakai SVG saja).
- Highlight lintas — mengklik ikan di canvas untuk menyorot baris (arah sebaliknya).
