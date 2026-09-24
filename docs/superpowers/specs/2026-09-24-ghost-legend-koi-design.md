# Desain: Koi Hantu "Legend" Berenang di Canvas

Tanggal: 2026-09-24
Status: Disetujui untuk implementasi

## 1. Tujuan

Ganti banner statis "Legend Incoming" dengan **koi hantu (siluet) yang benar-benar
berenang** di dalam aquarium Zen — sebagai isyarat bahwa legend belum lahir hari
ini. Koi hantu ini **TIDAK dihitung** ke dalam counter jumlah ikan, tidak bisa
diklik, dan tidak pernah menjadi legendary. Ada **label kecil "Legend?"** yang
mengikuti posisinya.

Aktif hanya bila: mode Supabase + belum ada legend hari ini
(`getTodayLegendaryList().length === 0`) + bukan clean mode.

## 2. Prinsip: tidak terhitung

Kunci: koi hantu **tidak masuk `fishRef.current`**. Ia hidup di `ghostRef`
terpisah, di-update & di-gambar di dalam loop animasi yang sama. Karena
`setFishCount` hanya membaca `fishRef.current.length`, ghost otomatis tak
terhitung — tanpa properti `isGhost` atau filter yang tersebar. Ia juga tak
tersentuh `tagLegendary`, handler klik, maupun spawn/baby.

## 3. Komponen

### 3a. `src/components/ghostKoi.ts` (baru)

```ts
export interface GhostKoi {
  x: number;
  y: number;
  vx: number;
  vy: number;
  tailPhase: number;
  size: number;
}

// Buat ghost dgn posisi & arah awal (acak dalam kanvas).
export function createGhostKoi(w: number, h: number): GhostKoi;

// Update posisi (melayang pelan), pantul di tepi, majukan tailPhase.
// Memutasi g. dt dalam detik.
export function updateGhostKoi(g: GhostKoi, dt: number, w: number, h: number): void;
```

Perilaku `updateGhostKoi`:
- `x += vx * dt * 60`, `y += vy * dt * 60` (skala agar terasa seperti ikan lain).
- Sedikit gerak vertikal alami (sinus lembut ditambah ke vy) opsional; cukup
  pantul di tepi: jika `x < margin` → `vx = |vx|`; jika `x > w-margin` → `vx = -|vx|`;
  sama untuk y dengan margin.
- `tailPhase += dt * kecepatan` untuk animasi kibas ekor.
- Clamp posisi di dalam `[margin, w-margin] × [margin, h-margin]`.

### 3b. `src/components/AquascapeCanvas.tsx` (modifikasi)

- `ghostRef = useRef<GhostKoi | null>(null)`.
- `ghostActiveRef = useRef(false)` — di-set dari `getTodayLegendaryList()` via
  langganan `aquascapeEvents.onLegendaryUpdated` (dan sekali saat mount), memakai
  `shouldTeaseLegend()` yang sudah ada + cek `isSupabaseModeActive()`.
- Di loop animasi, SETELAH loop ikan & SEBELUM/ sesudah ripples:
  - Jika `ghostActiveRef.current && !cleanModeRef.current`:
    - Bila `ghostRef.current === null` → `createGhostKoi(w, h)`.
    - `updateGhostKoi(ghostRef.current, dt, w, h)`.
    - Gambar koi hantu (path koi legendary yang sama, tapi alpha rendah/redup:
      badan gradien emas transparan, ekor kipas dgn tail wag dari `tailPhase`,
      sirip). Lalu `ctx.fillText('Legend?', ...)` kecil di atas koi.
  - Else → `ghostRef.current = null`.
- TIDAK menyentuh `fishRef`, `setFishCount`, `tagLegendary`, handler klik.

### 3c. `src/components/ZenAquariumModal.tsx` (modifikasi)

- Hapus banner teaser "Legend Incoming" + state `teaseLegend` + effect-nya +
  import `LegendaryKoiSilhouette`. (Logika pindah ke canvas.)

### 3d. Berkas yang jadi tak terpakai

- `src/components/LegendaryKoiSilhouette.tsx` → hapus (tak lagi dipakai).
- `src/services/legendaryPresence.ts` (`shouldTeaseLegend`) → TETAP dipakai oleh
  canvas untuk menentukan aktif/tidak; test-nya tetap.

## 4. Aliran

```
Zen render loop tiap frame:
  update & draw semua fishRef (counter = fishRef.length, ghost tak termasuk)
  if ghostActive && !clean:
     ensure ghostRef, updateGhostKoi(dt), draw koi hantu + label "Legend?"
  else: ghostRef = null
onLegendaryUpdated → ghostActiveRef = supabase && shouldTeaseLegend(list)
```

## 5. Testing

`src/components/ghostKoi.test.ts` (vitest):
- `createGhostKoi` menghasilkan posisi di dalam kanvas & kecepatan tak nol.
- `updateGhostKoi` menggerakkan posisi sesuai vx/vy·dt.
- `updateGhostKoi` memantulkan arah di tepi kiri/kanan/atas/bawah.
- `updateGhostKoi` menjaga posisi tetap dalam batas (clamp).
- `tailPhase` bertambah setiap update.

## 6. YAGNI

- Hanya SATU koi hantu.
- Tidak interaktif (tak bisa diklik/di-feed).
- Tidak ada aura kilau/partikel penuh seperti legendary asli (cukup redup + glow tipis).
