# Webhook — Menambahkan Ikan ke AQUASCAPE Live Tank

Dokumen ini menjelaskan cara mengirim **nama ikan baru** ke akuarium live AQUASCAPE
melalui webhook. Ikan yang dikirim akan langsung muncul di canvas (Hero maupun Zen
Mode) secara **realtime tanpa refresh**, selama tanggal kirimnya adalah **hari ini**.

Webhook ini memanggil **RPC `add_communal_fish`** di Supabase (via PostgREST).

> **PENTING (pembaruan keamanan):** INSERT langsung ke tabel `communal_fishes`
> **sudah ditutup** untuk anon key. Menambah ikan sekarang **wajib** lewat RPC
> `add_communal_fish`, yang memvalidasi nama, memfilter kata kasar, menormalkan
> species, dan menerapkan rate limit (maks 50 ikan/menit global; nama sama maks
> 3×/hari). Jalankan [`supabase/hardening.sql`](../supabase/hardening.sql) sekali
> di SQL Editor agar RPC ini tersedia. Endpoint REST `/communal_fishes` yang lama
> (INSERT langsung) tidak lagi berfungsi untuk menambah data.

---

## 1. Endpoint

```
POST https://<PROJECT_REF>.supabase.co/rest/v1/rpc/add_communal_fish
```

Untuk proyek ini:

```
POST https://pxynnorwyyadbfrjvqoe.supabase.co/rest/v1/rpc/add_communal_fish
```

---

## 2. Header wajib

| Header | Nilai | Keterangan |
|---|---|---|
| `apikey` | `<SUPABASE_ANON_KEY>` | Anon public key (aman dipakai di client) |
| `Authorization` | `Bearer <SUPABASE_ANON_KEY>` | Sama dengan anon key |
| `Content-Type` | `application/json` | Body dikirim sebagai JSON |

---

## 3. Body (payload)

Body adalah **parameter RPC**: `p_name` (wajib) dan `p_species` (opsional).

```json
{
  "p_name": "Budi Santoso",
  "p_species": "shark"
}
```

| Field | Tipe | Wajib | Default | Aturan |
|---|---|---|---|---|
| `p_name` | string | ✅ Ya | — | 1–100 karakter (setelah trim). Ditolak bila kosong/terlalu panjang atau mengandung kata kasar. Dipotong maks **25 karakter** saat digambar di nametag. |
| `p_species` | string | ❌ Tidak | `neonTetra` | Salah satu ID/alias di bawah. Nilai tak dikenal / kosong → otomatis jadi `neonTetra`. |

Kolom `created_at` dan `entry_date` **diisi otomatis** oleh database — jangan dikirim.

> **Rate limit** (ditegakkan server): maksimal **50 ikan / menit** secara global,
> dan **nama yang sama maksimal 3× / hari**. Melebihi batas → response `4xx`
> dengan pesan (`rate_limited_global` / `rate_limited_name`). Nama kasar →
> `name_rejected`. Nama tak valid → `invalid_name`.

---

## 4. Daftar `species` yang diterima

### 4a. ID resmi (disarankan)

| ID `species` | Ikan |
|---|---|
| `mascot` | Maskot origami AQUASCAPE |
| `neonTetra` | Neon / Cardinal Tetra (default) |
| `cherryShrimp` | Udang Cherry |
| `angelfish` | Manfish / Angelfish |
| `rasbora` | Harlequin Rasbora |
| `guppy` | Guppy |
| `shark` | Hiu |
| `whale` | Paus |
| `dolphin` | Lumba-lumba |
| `mantaRay` | Pari Manta |
| `pufferfish` | Ikan Buntal |
| `orca` | Paus Orca |
| `turtle` | Penyu |
| `marlin` | Marlin (paruh panjang, cepat) |
| `anglerfish` | Anglerfish (umpan bercahaya) |
| `lanternfish` | Lanternfish (laut dalam, photophore) |
| `viperfish` | Viperfish (gigi taring) |
| `moray` | Moray Eel (belut karang) |
| `electricEel` | Electric Eel (belut listrik) |

### 4b. Alias yang juga diterima (Indonesia / umum)

Pencocokan **tidak peka huruf besar/kecil** dan spasi di ujung diabaikan.

| Kirim salah satu dari… | Dipetakan ke |
|---|---|
| `tetra`, `neon` | `neonTetra` |
| `hiu` | `shark` |
| `paus` | `whale` |
| `lumba`, `lumba-lumba` | `dolphin` |
| `pari`, `manta` | `mantaRay` |
| `buntal`, `puffer` | `pufferfish` |
| `layang`, `manfish` | `angelfish` |
| `udang`, `shrimp` | `cherryShrimp` |
| `penyu` | `turtle` |
| `pembunuh`, `paus orca` | `orca` |
| `marlin`, `ikan pedang`, `pedang`, `todak` | `marlin` |
| `pemancing`, `ikan pemancing`, `sungut ganda` | `anglerfish` |
| `lentera`, `ikan lentera` | `lanternfish` |
| `viper`, `ikan viper`, `ular` | `viperfish` |
| `moray`, `belut moray`, `belut`, `sidat` | `moray` |
| `belut listrik`, `listrik` | `electricEel` |

### 4c. Fallback

- `species` **kosong** (`""`), **null**, atau **tidak ada di daftar** → otomatis menjadi **`neonTetra`**.
- Jadi webhook **tidak akan pernah gagal** hanya karena spesies salah ketik.

---

## 5. Contoh pemanggilan

### cURL

```bash
curl -X POST "https://pxynnorwyyadbfrjvqoe.supabase.co/rest/v1/rpc/add_communal_fish" \
  -H "apikey: <SUPABASE_ANON_KEY>" \
  -H "Authorization: Bearer <SUPABASE_ANON_KEY>" \
  -H "Content-Type: application/json" \
  -d '{ "p_name": "Budi Santoso", "p_species": "shark" }' \
  -w "\nHTTP %{http_code}\n"
```

### JavaScript (fetch)

```js
const res = await fetch(
  "https://pxynnorwyyadbfrjvqoe.supabase.co/rest/v1/rpc/add_communal_fish",
  {
    method: "POST",
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ p_name: "Budi Santoso", p_species: "shark" }),
  }
);
if (res.ok) {
  const fish = await res.json(); // baris yang dibuat (objek)
  console.log("Ikan tersimpan:", fish.id, fish.name);
} else {
  const err = await res.json().catch(() => ({}));
  console.error(`Gagal (${res.status}):`, err.message || err.hint || res.statusText);
}
```

### Kirim banyak ikan (batch)

RPC menambah **satu ikan per panggilan**. Untuk banyak ikan, panggil berkali-kali
(beri sedikit jeda agar tidak menembus rate limit 50/menit):

```js
const fishes = [
  { p_name: "Ali", p_species: "mantaRay" },
  { p_name: "Sibal", p_species: "hiu" },
  { p_name: "Kuntul" },
];
for (const f of fishes) {
  await fetch(
    "https://pxynnorwyyadbfrjvqoe.supabase.co/rest/v1/rpc/add_communal_fish",
    {
      method: "POST",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(f),
    }
  );
}
```

---

## 6. Response

**Setiap request SELALU mendapat response.** Endpoint ini adalah REST API Supabase
(PostgREST), sehingga setiap POST dibalas dengan **HTTP status code** — baik sukses
maupun gagal. Tidak ada request yang "hening"/tanpa balasan. Pemanggil **wajib**
memeriksa status code untuk memastikan data tersimpan.

### 6a. Sukses

RPC mengembalikan **objek** baris yang dibuat dengan status `200 OK`:

```json
{
  "id": 14,
  "name": "Budi Santoso",
  "species": "shark",
  "created_at": "2026-09-22T05:11:15.201928+00:00",
  "entry_date": "2026-09-22"
}
```

### 6b. Gagal

Response gagal berupa status `4xx` dengan body JSON berisi detail error dari PostgREST,
misalnya:

```json
{
  "code": "23514",
  "message": "new row for relation \"communal_fishes\" violates check constraint",
  "details": null,
  "hint": null
}
```

| Status | `message`/`hint` | Penyebab | Solusi |
|---|---|---|---|
| `400` | `invalid_name` | `p_name` kosong / >100 char | Kirim nama 1–100 karakter |
| `400` | `name_rejected` | Nama mengandung kata kasar | Ganti nama |
| `400` | `rate_limited_global` | >50 ikan dalam 60 detik terakhir | Tunggu lalu retry |
| `400` | `rate_limited_name` | Nama sama sudah 3× hari ini | Pakai nama lain / besok |
| `401` / `403` | — | `apikey`/`Authorization` salah | Pastikan anon key benar |
| `404` | — | RPC belum dibuat | Jalankan `supabase/hardening.sql` |
| `5xx` | — | Gangguan sementara Supabase | Retry beberapa saat kemudian |

### 6c. Cara memeriksa response di sisi pemanggil

Lihat contoh cURL (`-w "\nHTTP %{http_code}\n"`) dan `fetch` di **Bagian 5** —
keduanya sudah memeriksa status. Selalu cek `res.ok` (status `2xx`) dan baca
`err.message`/`err.hint` saat gagal untuk tahu alasannya (mis. `rate_limited_name`).

> Jangan asumsikan sukses hanya karena request terkirim — periksa `res.ok`.

---

## 7. Aturan tampil di canvas (penting)

1. **Hanya ikan hari ini** yang ditampilkan. Filter berdasarkan `created_at` / `entry_date`
   dibanding tanggal hari ini. Ikan kemarin tidak ikut tampil.
2. Ikan Supabase adalah **communal fish** — selalu tampil penuh di Hero **dan** Zen Mode,
   tidak dibatasi kepadatan (`fishDensity`) maupun filter jenis (`activeSpecies`).
3. Dalam mode Supabase, canvas menampilkan **semua ikan Supabase hari ini + 1 maskot**,
   tanpa ikan default dari `fish-names.json`.
4. Ikan communal **tidak mengalami siklus hidup** (tidak menua/lahir ulang), agar nama
   dari database tidak pernah tergantikan nama lokal.
5. `name` lebih dari 25 karakter akan dipotong saat digambar di nametag.

---

## 8. Prasyarat database (sekali saja)

Tabel, index, RLS policy, RPC, dan Realtime harus sudah disiapkan. Jalankan di
**Supabase Dashboard → SQL Editor**, berurutan:

1. [`supabase/schema.sql`](../supabase/schema.sql) — tabel `communal_fishes`, index,
   RLS (read publik), dan Realtime.
2. [`supabase/legendary.sql`](../supabase/legendary.sql) — fitur legendary.
   Jalankan **sebelum** `hardening.sql`, karena `add_communal_fish` memanggil
   `roll_legendary` saat INSERT. (Kalau dilewati, ikan tetap masuk normal, hanya
   tanpa roll legendary.)
3. [`supabase/streak.sql`](../supabase/streak.sql) — streak & papan peringkat kuaci
   (`fish_daily_kuaci` + `increment_kuaci`, `fish_streaks` + `upsert_streaks`).
4. **[`supabase/hardening.sql`](../supabase/hardening.sql) — WAJIB untuk webhook baru.**
   Menutup INSERT publik langsung dan membuat RPC **`add_communal_fish`** (validasi,
   filter kata kasar, normalisasi species, rate limit, **+ roll legendary otomatis
   server-side untuk setiap ikan**). Tanpa ini, endpoint webhook pada Bagian 1 akan
   mengembalikan `404` (RPC belum ada).

Catatan:
- Setelah `hardening.sql`, INSERT langsung ke `/rest/v1/communal_fishes` **ditolak**
  untuk anon (read-only). Gunakan RPC `add_communal_fish`.
- Daftar libur nasional ada di [`public/holidays.txt`](../public/holidays.txt).
