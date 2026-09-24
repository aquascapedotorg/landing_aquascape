# Desain: 6 Spesies Ikan Baru (Marlin + Deep-Sea)

Tanggal: 2026-09-24
Status: Disetujui untuk implementasi (draft gambar sudah disetujui)

## 1. Tujuan

Menambahkan 6 spesies ikan baru yang ikut ekosistem biasa:

1. `marlin` — pelagis cepat, paruh panjang, sirip layar tinggi, ekor bercabang
2. `anglerfish` — badan bulat gelap, umpan bercahaya (cyan), mulut bergigi
3. `lanternfish` — kecil, mata besar, deretan photophore hijau
4. `viperfish` — ramping, gigi taring, umpan cahaya, photophore
5. `moray` — belut hijau berkelok, kepala bergigi kecil, berbintik
6. `electricEel` — belut gelap perut kuning, percikan & aura listrik biru

Kolom `species` di Supabase memakai **nama Inggris/id persis** (tanpa alias
Indonesia). Ikan ikut sekolah acak (local mode) dan komunal Supabase.

## 2. Titik Integrasi

### 2a. `src/types.ts`
Tambah 6 id ke union `FishSpeciesType`:
`marlin | anglerfish | lanternfish | viperfish | moray | electricEel`.

### 2b. `public/fish-names.json`
Tambah 6 objek `FishSpeciesDefinition` (id, name, scientificName, category,
description, defaultNames[]) ke array `species`. Nama default 4-5 per spesies.

### 2c. `src/components/fishRenderer.ts`
- Tambah 6 blok ke `buildRawFish` (if-else per spesies) dgn ukuran, warna,
  kecepatan awal yang sesuai (eel lebih lambat & panjang; marlin cepat).
- Tambah 6 fungsi ekspor: `drawMarlin`, `drawAnglerfish`, `drawLanternfish`,
  `drawViperfish`, `drawMoray`, `drawElectricEel` (ctx, fish, tailWag) — dari
  draft yang sudah disetujui, dipoles. Eel memakai tubuh berkelok (sinus)
  berbasis `fish.tailPhase` alih-alih tailWag ekor.

### 2d. `src/components/AquascapeCanvas.tsx`
- Import 6 fungsi draw.
- Tambah dispatch di blok render (`else if (fish.type === 'marlin') drawMarlin(...)`, dst).
- Tambah `maxSpeed` per spesies (marlin cepat ~3.0; eel lambat ~1.4; lainnya ~2.0).
- Tambah perilaku cruise ringan bila perlu (default cukup).
- Tambah 6 spesies ke daftar `activeSpecies` default (~baris 213-228).

### 2e. `src/components/FishSpeciesIcon.tsx`
Tambah 6 case ikon 24×24 (siluet sederhana + warna khas).

### 2f. `src/services/supabaseFishService.ts`
Tambah 6 id ke `VALID_FISH_SPECIES`. (Alias Indonesia: TIDAK.)

### 2g. `src/components/FishCustomizerModal.tsx` & `AquascapeControls.tsx`
Daftar pilihan spesies di modal sudah otomatis dari `FISH_CATALOG.species`, jadi
tak perlu diubah. Cek `currentSpecies` default (hardcoded list) — tambahkan 6 id
agar konsisten dengan default canvas. `AquascapeControls` presets (jika ada
daftar spesies) — tambah bila perlu.

### 2h. `.env.example`
Dokumentasikan 6 pilihan species baru.

## 3. Warna & Ukuran (ringkas)

| species | size | body | accent | glow |
|---|---|---|---|---|
| marlin | 40-46 | #2f6591 | belly #bfe0f2 | — |
| anglerfish | 34-40 | #241f2e | teeth #eef5f5 | cyan lure |
| lanternfish | 18-22 | #2b3a44 | eye #dff | green photophore |
| viperfish | 30-36 | #1d2933 | teeth #eef5fb | cyan lure |
| moray | 34-40 | #3a6b52 | belly #bfe6c8 | — |
| electricEel | 36-42 | #3a4a52 | belly #e8c65a | blue sparks |

## 4. Testing (TDD)

Karena render adalah canvas (efek samping visual), yang diuji adalah **logika
yang dapat diverifikasi**:

`src/components/fishRenderer.test.ts` (extend / baru):
- `createSingleFish('marlin', …)` → `type === 'marlin'`, `size > 0`, punya `name`.
- Sama untuk 6 spesies baru (parametrik).
- `createFishSchool` dengan `activeSpecies` berisi spesies baru menghasilkan
  ikan bertipe itu.
- Fungsi `draw*` baru: panggil dgn mock `CanvasRenderingContext2D` (spy) dan
  pastikan tidak error + memanggil `ctx.beginPath`/`ctx.fill` (smoke test).

`src/services/supabaseFishService.test.ts` (extend):
- `VALID_FISH_SPECIES` memuat 6 id baru.
- `normalizeFishSpecies('marlin')` → `'marlin'`, dst untuk id valid.

Verifikasi visual final di browser: buka Zen, pastikan spesies baru berenang &
tergambar benar; counter & interaksi normal; console bersih.

## 5. YAGNI
- Tanpa alias bahasa Indonesia.
- Tanpa perilaku AI khusus rumit (predator/prey) — cukup cruise + maxSpeed.
- Eel tidak perlu tabrakan/patah tubuh; cukup berkelok visual.
