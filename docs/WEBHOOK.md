# Webhook — Menambahkan Ikan ke AQUASCAPE Live Tank

Dokumen ini menjelaskan cara mengirim **nama ikan baru** ke akuarium live AQUASCAPE
melalui webhook. Ikan yang dikirim akan langsung muncul di canvas (Hero maupun Zen
Mode) secara **realtime tanpa refresh**, selama tanggal kirimnya adalah **hari ini**.

Webhook ini pada dasarnya adalah **INSERT satu baris** ke tabel Supabase
`communal_fishes` lewat PostgREST (REST API bawaan Supabase).

---

## 1. Endpoint

```
POST https://<PROJECT_REF>.supabase.co/rest/v1/communal_fishes
```

Untuk proyek ini:

```
POST https://pxynnorwyyadbfrjvqoe.supabase.co/rest/v1/communal_fishes
```

> Nama tabel bisa berbeda bila `VITE_SUPABASE_FISH_TABLE` diubah. Default: `communal_fishes`.

---

## 2. Header wajib

| Header | Nilai | Keterangan |
|---|---|---|
| `apikey` | `<SUPABASE_ANON_KEY>` | Anon public key (aman dipakai di client) |
| `Authorization` | `Bearer <SUPABASE_ANON_KEY>` | Sama dengan anon key |
| `Content-Type` | `application/json` | Body dikirim sebagai JSON |
| `Prefer` | `return=representation` | *(opsional)* agar response mengembalikan baris yang dibuat |

---

## 3. Body (payload)

```json
{
  "name": "Budi Santoso",
  "species": "shark"
}
```

| Field | Tipe | Wajib | Default | Aturan |
|---|---|---|---|---|
| `name` | string | ✅ Ya | — | Tidak boleh kosong. Ditampilkan sebagai nametag. Otomatis dipotong maks. **25 karakter** di canvas. |
| `species` | string | ❌ Tidak | `neonTetra` | Salah satu ID/alias di bawah. Nilai tak dikenal / kosong → otomatis jadi `neonTetra`. |

Kolom `created_at` dan `entry_date` **diisi otomatis** oleh database (waktu & tanggal
sekarang) — **jangan** dikirim dari webhook agar filter "hari ini" bekerja benar.

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

### 4c. Fallback

- `species` **kosong** (`""`), **null**, atau **tidak ada di daftar** → otomatis menjadi **`neonTetra`**.
- Jadi webhook **tidak akan pernah gagal** hanya karena spesies salah ketik.

---

## 5. Contoh pemanggilan

### cURL

```bash
curl -X POST "https://pxynnorwyyadbfrjvqoe.supabase.co/rest/v1/communal_fishes" \
  -H "apikey: <SUPABASE_ANON_KEY>" \
  -H "Authorization: Bearer <SUPABASE_ANON_KEY>" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{ "name": "Budi Santoso", "species": "shark" }'
```

### JavaScript (fetch)

```js
await fetch("https://pxynnorwyyadbfrjvqoe.supabase.co/rest/v1/communal_fishes", {
  method: "POST",
  headers: {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  },
  body: JSON.stringify({ name: "Budi Santoso", species: "shark" }),
});
```

### Kirim banyak ikan sekaligus (batch)

Kirim **array** — semua akan muncul di canvas.

```json
[
  { "name": "Ali",   "species": "mantaRay" },
  { "name": "Sibal", "species": "hiu" },
  { "name": "Kuntul" }
]
```

---

## 6. Response

**Setiap request SELALU mendapat response.** Endpoint ini adalah REST API Supabase
(PostgREST), sehingga setiap POST dibalas dengan **HTTP status code** — baik sukses
maupun gagal. Tidak ada request yang "hening"/tanpa balasan. Pemanggil **wajib**
memeriksa status code untuk memastikan data tersimpan.

### 6a. Sukses

| Kondisi | Status | Body response |
|---|---|---|
| Insert + `Prefer: return=representation` | `201 Created` | Array berisi baris yang dibuat (lihat di bawah) |
| Insert **tanpa** `Prefer` | `201 Created` | **Kosong** (body `""`) — status tetap `201` |

> Agar response menyertakan data (id, entry_date, dll), **selalu kirim** header
> `Prefer: return=representation`. Tanpa header itu, insert tetap berhasil tetapi
> body-nya kosong — Anda hanya menerima status `201`.

Contoh body sukses (dengan `Prefer: return=representation`):

```json
[
  {
    "id": 14,
    "name": "Budi Santoso",
    "species": "shark",
    "created_at": "2026-09-22T05:11:15.201928+00:00",
    "entry_date": "2026-09-22"
  }
]
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

| Status | Penyebab | Solusi |
|---|---|---|
| `400` | `name` kosong / JSON tidak valid / melanggar check constraint | `name` wajib berisi minimal 1 karakter non-spasi; pastikan body JSON valid |
| `401` / `403` | `apikey`/`Authorization` salah atau RLS memblokir | Pastikan anon key benar & policy insert aktif |
| `404` | Nama tabel salah | Pastikan tabel `communal_fishes` ada |
| `5xx` | Gangguan sementara di Supabase | Coba ulang (retry) beberapa saat kemudian |

### 6c. Cara memeriksa response di sisi pemanggil

**cURL** — tampilkan status code dan body:

```bash
curl -X POST "https://pxynnorwyyadbfrjvqoe.supabase.co/rest/v1/communal_fishes" \
  -H "apikey: <SUPABASE_ANON_KEY>" \
  -H "Authorization: Bearer <SUPABASE_ANON_KEY>" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{ "name": "Budi Santoso", "species": "shark" }' \
  -w "\nHTTP %{http_code}\n"
```

**JavaScript (fetch)** — selalu cek `response.ok` / `response.status`:

```js
const res = await fetch(ENDPOINT, {
  method: "POST",
  headers: {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  },
  body: JSON.stringify({ name: "Budi Santoso", species: "shark" }),
});

if (res.ok) {
  const [fish] = await res.json();      // 201 → baris yang dibuat
  console.log("Ikan tersimpan:", fish.id, fish.name);
} else {
  const err = await res.json().catch(() => ({}));
  console.error(`Gagal (${res.status}):`, err.message || res.statusText);
}
```

> Jangan asumsikan sukses hanya karena request terkirim — periksa `res.ok`
> (status `2xx`). Response selalu tersedia untuk setiap request.

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

Tabel, index, RLS policy, dan Realtime harus sudah disiapkan. Lihat
[`supabase/schema.sql`](../supabase/schema.sql) — jalankan di **Supabase Dashboard → SQL Editor**.
Yang wajib aktif untuk webhook:

- Policy **insert** (`Allow public insert access`) agar anon key boleh menambah data.
- Tabel terdaftar di **`supabase_realtime`** agar ikan muncul live tanpa refresh.
