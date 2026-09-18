import { ReposData } from '../types';

export const reposData: ReposData = {
  generated_at: "2026-09-18T08:52:38.533Z",
  org: "aquascapedotorg",
  repos: [
    {
      name: "rotomate",
      description: "Deterministic, non-LLM test script generator. Business-rule DSL to Playwright, Cypress, Selenium & Robot Framework via 6-tier heuristic DOM matching.",
      language: "TypeScript",
      visibility: "private",
      created_at: "2026-09-07T00:15:33Z",
      updated_at: "2026-09-18T08:51:56Z",
      topics: ["test-automation", "playwright", "cypress", "selenium", "heuristic", "dsl"],
      html_url: "https://github.com/aquascapedotorg/rotomate",
      readme: `# Tester Lab: Non-LLM Automated Test Script Generator

![License: Proprietary](https://img.shields.io/badge/License-Proprietary-red.svg)
![Node](https://img.shields.io/badge/Node-20.19%2B-brightgreen.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6.svg)

**Sistem Generator Script Testing Otomatis Berbasis Rule & Heuristic DOM Matching (Deterministik, Tanpa LLM)**

\`tester-lab\` adalah engine otomatisasi pengujian *end-to-end* yang menghasilkan script test secara otomatis berdasarkan file skenario aturan bisnis (**JSON / YAML DSL**), tanpa bergantung pada Large Language Model (LLM). Engine ini secara bawaan mendukung berbagai framework industri terkemuka: **Playwright (TypeScript & JavaScript), Cypress, Selenium (Python), dan Robot Framework**.

Selain generasi, Tester Lab juga mengimpor test yang sudah ada (spec Playwright, JSON, atau YAML) kembali menjadi langkah scenario, sehingga test lama dipakai ulang tanpa menyusun ulang dari nol.

---

## Mengapa Tanpa LLM?

1. **Deterministik & 100% Konsisten:** Hasil generasi script selalu identik untuk input bisnis yang sama. Tidak ada risiko halusinasi selector, kesalahan sintaks, atau perubahan perilaku acak.
2. **Kepatuhan Privasi & Keamanan Data (Zero Data Leakage):** Struktur DOM internal, atribut halaman, dan data rahasia tidak pernah dikirim ke API kecerdasan buatan pihak ketiga.
3. **Tanpa Latensi Inferensi:** Pencocokan heuristik berjalan lokal dalam hitungan milidetik. Waktu generasi total didominasi crawl browser ke situs target, yang bisa memakan puluhan detik, bukan oleh pencocokan.
4. **Biaya Operasional Nol (Zero Token/API Cost):** Tanpa langganan API berulang, tanpa kuota token bulanan.

---

## Fitur Utama

- **Deterministic 6-Tier Scoring Matrix:** Pencocokan label ke elemen DOM interaktif dengan bobot prioritas teruji (*Test ID -> Associated Label -> ARIA Role & Accessible Name -> InnerText -> Placeholder/Aria-Label -> Fuzzy Levenshtein*).
- **Multi-Framework Code Transpiler:** Transpilasi otomatis ke **Playwright (TS/JS)**, **Cypress**, **Selenium Python**, dan **Robot Framework** terformat rapi via Prettier AST. Output non-Playwright dijaga agar tidak dieksekusi langsung di server (hanya diunduh).
- **Dry-Run & Self-Healing Engine:** Validasi headless langsung pasca-generasi dengan kemampuan *auto-healing* ke kandidat Rank-2 jika selector pertama gagal.
- **Interaction Recorder (Point-and-Click DSL Capture):** Rekam interaksi langsung pada situs target yang dimuat melalui *reverse-proxy* ber-guard SSRF. Agen perekam yang diinjeksi menangkap aksi \`click\`/\`fill\` pengguna, menggabungkan langkah \`fill\` beruntun pada field yang sama, dan mengubahnya menjadi step DSL siap-generate — tanpa perlu menulis skenario manual.
- **Web Workspace & Interactive Admin Portal:** UI modern responsif dengan Scenario Builder, Interaction Recorder, Runs & laporan run dengan video playback, Feedback Reporting, API Key Management, dan Admin Control Center.
- **Enterprise-Grade Security:**
  - **API Key Masking & SHA-256 Hashing:** Penyimpanan hash kriptografis aman, raw key hanya ditampilkan sekali saat pembuatan, dan prefix di-mask (\`tl_live_xxxx...yyyy\`).
  - **Dual Authentication Middleware:** Mendukung JWT Bearer Token dan \`X-API-Key\` dengan Role-Based Access Control (Admin / User) & User Status Approval (\`pending\`, \`approved\`, \`rejected\`).
  - **AST/Regex Code Sanitizer:** Memblokir eksekusi kode berbahaya (\`fs\`, \`child_process\`, \`eval\`, \`process.env\`) sebelum dieksekusi — berlaku pada jalur \`/run-test\` maupun dry-run.
  - **SSRF Outbound Guard:** Setiap target *reverse-proxy* recorder divalidasi via \`assertSafeProxyUrl()\` yang menolak URL non-http(s), hostname internal, serta rentang IP privat/reserved.
  - **PostgreSQL Row Level Security (RLS):** Seluruh tabel database diamankan dan diisolasi dengan hak akses \`TO service_role\`.

---

## Matriks Skoring Heuristik

Pencocokan elemen dilakukan menggunakan matriks bobot deterministik untuk memilih *locator strategy* paling stabil:

| Prioritas | Kriteria / Rule | Skor | Strategi Locator | Deskripsi & Stabilitas |
| :---: | :--- | :---: | :--- | :--- |
| **1** | **Direct Test ID Match** | **100** | \`page.getByTestId(...)\` | Match exact \`data-testid\`, \`data-test\`, \`id-test\`. Paling kebal perubahan UI. |
| **2** | **Associated Label Match** | **85 – 90** | \`page.getByLabel(...)\` | Match \`<label for="...">\` atau wrapper label langsung. Standar aksesibilitas tinggi. |
| **3** | **ARIA Role & Name Match** | **75 – 88** | \`page.getByRole(...)\` | Match semantik ARIA role (\`button\`, \`textbox\`, \`combobox\`) + accessible name. |
| **4** | **Visual Text / Value Match** | **60 – 85** | \`page.getByText(...)\` | Match teks visual yang terlihat di layar (\`innerText\`). |
| **5** | **Placeholder / Aria-Label** | **65 – 80** | \`page.getByPlaceholder(...)\` | Match atribut \`placeholder\` atau \`aria-label\` pada elemen input. |
| **6** | **Fuzzy Levenshtein Match** | **30 – 50** | \`page.locator('text=...')\` | Toleransi perbedaan ejaan ringan / dynamic prefix. |

---

## Lisensi

**Proprietary — All rights reserved.**
Hak cipta milik internal tim AQUASCAPE. Kontak: \`imam.fahrudin.work@gmail.com\`.
`
    },
    {
      name: "landing_aquascape",
      description: "Halaman landing page interaktif untuk organisasi open source AQUASCAPE, dilengkapi ekosistem simulasi aquascape hidup.",
      language: "CSS",
      visibility: "public",
      created_at: "2026-09-15T06:40:16Z",
      updated_at: "2026-09-18T08:52:33Z",
      topics: ["landing-page", "aquascape", "interactive-canvas", "design-system", "tailwind"],
      html_url: "https://github.com/aquascapedotorg/landing_aquascape",
      readme: `# AQUASCAPE — Projects & Showcase Portal

Landing page resmi organisasi **AQUASCAPE** (\`aquascapedotorg\`). Menampilkan seluruh repository, dokumentasi terpusat, dan simulasi visual bertema ekosistem aquascape yang hidup.

## Fitur
- **Interactive Aquascape Canvas:** Simulasi visual air jernih, tanaman aquascape bergoyang (*Vallisneria*, *Rotala*, lumut karang), gelembung diffuser CO2, dan ikan origami maskot.
- **Project Catalog & README Viewer:** Eksplorasi langsung repositori tim dan baca dokumentasi Markdown tanpa meninggalkan halaman.
- **Interaksi Zen:** Beri makan ikan, ubah pencahayaan (*Daylight, Moonlight, Golden Hour*), dan dengarkan gemericik air alami.
`
    },
    {
      name: "axentra",
      description: "Platform core services & internal microservice infrastructure untuk ekosistem aplikasi AQUASCAPE.",
      language: "TypeScript",
      visibility: "private",
      created_at: "2026-09-16T03:54:37Z",
      updated_at: "2026-09-16T03:54:39Z",
      topics: ["backend", "microservices", "infrastructure", "internal"],
      html_url: "https://github.com/aquascapedotorg/axentra",
      readme: `# Axentra — Core Service Engine

Repositori privat untuk arsitektur *backend microservices* dan middleware internal organisasi **AQUASCAPE**.

## Karakteristik
- Arsitektur terdistribusi berperforma tinggi.
- Otentikasi terpusat dan perutean API terisolasi.
- Terintegrasi dengan pipeline otomatisasi \`rotomate\`.
`
    }
  ]
};
