# Desain: Realtime Viewer Counter ("N Views")

Tanggal: 2026-09-24
Status: Disetujui untuk implementasi (menunggu review spec)

## 1. Tujuan

Menampilkan **jumlah orang yang sedang membuka landing page secara realtime**.
Siapapun yang membuka situs terhitung; angka naik saat ada tab baru dan turun
otomatis saat tab ditutup. Badge tampil di header kanan dengan format
**"1 View"** (tunggal) dan **"3 Views"** (jamak).

Cakupan: **seluruh landing page** (bukan hanya Zen mode).
Metode: **Supabase Realtime Presence** — tanpa tabel DB baru, tanpa server baru.

## 2. Prinsip Keandalan

Kunci desain: presence bersifat **self-cleaning**. Setiap browser "track" dirinya
di satu channel presence global. Supabase menyiarkan `sync` berisi state semua
peserta. Saat WebSocket putus (tab ditutup / jaringan mati), Supabase otomatis
mengeluarkan peserta itu, sehingga angka turun tanpa perlu heartbeat/cleanup manual.

- Satu channel global: `aquascape-presence`.
- Setiap tab punya `presence key` acak sendiri → dua tab dari orang yang sama
  dihitung sebagai 2 (ini perilaku "views", sesuai nama fitur).
- Angka = jumlah entri unik pada `channel.presenceState()`.
- **Fallback aman**: jika kredensial Supabase kosong / gagal connect, badge
  **tidak muncul** dan situs tetap berjalan normal. Tidak pernah menampilkan angka palsu.

## 3. Konfigurasi

Menggunakan `getFishDataSourceConfig()` yang sudah ada (dari `supabaseFishService.ts`)
untuk membaca `supabaseUrl` dan `supabaseAnonKey` dari `.env` (`VITE_SUPABASE_URL`,
`VITE_SUPABASE_ANON_KEY`). Presence **tidak butuh RLS/tabel** — hanya butuh fitur
Realtime aktif di project Supabase, yang sudah aktif untuk fitur communal fish.

## 4. Komponen

### 4a. `src/services/presenceService.ts`

Service singleton (pola sama seperti `subscribeToSupabaseFish`) yang tahan terhadap
StrictMode/HMR — hanya ada satu channel presence per lifetime app.

Ekspor:

```ts
// Hitung jumlah viewer unik dari objek presenceState Supabase. Fungsi murni,
// mudah diuji tanpa jaringan.
export function countViewers(
  presenceState: Record<string, unknown[]>
): number;

// Buka channel presence, track diri sendiri, dengarkan 'sync', panggil
// onCountChange dengan angka terbaru. Mengembalikan fungsi cleanup.
// Idempoten: pemanggilan berulang dgn config sama hanya menukar callback.
export function subscribeToViewerCount(
  onCountChange: (count: number) => void
): () => void;
```

Perilaku `subscribeToViewerCount`:
1. Ambil config via `getFishDataSourceConfig()`. Jika url/key kosong →
   panggil `onCountChange(0)` dan kembalikan cleanup no-op (badge akan tersembunyi).
2. `createClient(url, key)`, buat `channel('aquascape-presence', { config: { presence: { key: <random> } } })`.
3. `.on('presence', { event: 'sync' }, () => onCountChange(countViewers(channel.presenceState())))`.
4. Saat `.subscribe(status)` == `'SUBSCRIBED'` → `channel.track({ online_at: Date.now() })`.
5. Cleanup: no-op saat re-render (channel process-global tetap hidup, mirip fish service);
   teardown nyata hanya saat unload.

### 4b. `src/components/ViewerCounter.tsx`

Komponen presentasi kecil:
- State `count` (mulai `0`).
- `useEffect` memanggil `subscribeToViewerCount(setCount)` sekali; cleanup saat unmount.
- Jika `count <= 0` → render `null` (tersembunyi saat belum connect / Supabase mati).
- Jika `count >= 1` → badge: titik hijau berdenyut + ikon `Eye` (lucide-react) +
  teks `` `${count} ${count === 1 ? 'View' : 'Views'}` ``.
- Gaya selaras header: `rounded-xl border`, warna teal/emerald konsisten dgn tombol lain.
- `aria-live="polite"` + `title="Sedang menonton sekarang"` untuk aksesibilitas.

### 4c. `src/components/Header.tsx`

Sisipkan `<ViewerCounter />` di dalam `<nav>`, sebagai anak pertama sebelum tombol
sound. Tidak ada prop baru — komponen self-contained.

## 5. Aliran Data

```
Browser buka situs
  → ViewerCounter mount → subscribeToViewerCount(setCount)
  → channel.subscribe() SUBSCRIBED → channel.track({...})
  → Supabase broadcast 'sync' ke SEMUA klien
  → tiap klien: countViewers(presenceState()) → setCount(n)
  → badge render "n View(s)"
Tab ditutup
  → WebSocket close → Supabase drop peserta → 'sync' ke sisa klien → angka turun
```

## 6. Error Handling

- Config kosong / `createClient` throw → tangkap, `onCountChange(0)`, badge tersembunyi.
- Error saat subscribe/track → log `console.warn`, badge tetap tersembunyi (count 0).
- Tidak melempar error ke atas; situs tidak boleh rusak karena fitur ini.

## 7. Testing

`src/services/presenceService.test.ts` (vitest, pola sama seperti test yang ada):
- `countViewers({})` → `0`.
- `countViewers` dengan 3 key berbeda → `3`.
- `countViewers` mengabaikan key kosong / dedup per key benar.
- (Jaringan/channel tidak diuji unit — di luar scope, mengikuti pola service lain.)

## 8. YAGNI (tidak dikerjakan)

- Tidak menyimpan riwayat / "peak viewers".
- Tidak menampilkan nama/lokasi/avatar viewer.
- Tidak menghitung Zen mode terpisah.
- Tidak ada persistensi DB.
