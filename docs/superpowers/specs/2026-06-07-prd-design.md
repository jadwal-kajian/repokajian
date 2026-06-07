# PRD — Product Requirements Document
## Source List Kajian Sunnah Indonesia

**Versi:** 1.0  
**Tanggal:** 7 Juni 2026  
**Status:** Draft  
**Penulis:** Tim Vibathon 2026

---

## 1. Overview Produk

### Deskripsi

Source List Kajian Sunnah Indonesia adalah **dashboard registry dan monitoring** berbasis web untuk mendokumentasikan, memantau, dan mempublikasikan data sumber-sumber kajian Islam Sunnah di Indonesia.

### Tech Stack

| Layer | Teknologi |
|-------|-----------|
| Framework | Next.js 16 (App Router, static generation) |
| UI Library | React 19 + TypeScript |
| Styling | Tailwind CSS 4 |
| Peta Interaktif | Leaflet + OpenStreetMap |
| Scraping | Cheerio (HTML parsing) |
| Hosting | Netlify (CDN + static files) |
| Automation | GitHub Actions (cron harian) |
| Data Storage | File JSON berbasis Git (tidak ada database) |

### Prinsip Produk

1. **Static-first** — semua data di-generate saat build, tidak ada server-side API
2. **Git sebagai database** — semua perubahan data bisa di-audit via git history
3. **Open by default** — registry dan API bersifat publik, tidak memerlukan autentikasi
4. **Komunitas-driven** — kontribusi melalui Pull Request, bukan form tertutup

---

## 2. User Personas

### Persona A — Pengguna Umum (Pencari Kajian)

- **Profil:** Muslim Indonesia yang ingin menemukan sumber kajian Sunnah yang terpercaya dan aktif
- **Kebutuhan:** Menemukan channel/sumber yang masih aktif, terfilter berdasarkan region atau platform
- **Pain Point:** Banyak channel Telegram kajian yang sudah tidak aktif namun masih tersebar di rekomendasinya
- **Success:** Menemukan ≥ 3 sumber aktif yang relevan dalam < 2 menit

### Persona B — Developer / Aggregator App

- **Profil:** Developer yang membangun aplikasi jadwal kajian, chatbot, atau portal konten Islam
- **Kebutuhan:** API yang stabil dan terdokumentasi, skema data yang konsisten, update rutin
- **Pain Point:** Harus membangun data sourcing dari nol setiap kali membuat aplikasi baru
- **Success:** Mengintegrasikan `/v1/sources.json` ke dalam aplikasi dalam < 1 hari kerja

### Persona C — Kontributor Komunitas

- **Profil:** Pengguna aktif Telegram kajian yang mengetahui sumber-sumber yang belum terdaftar
- **Kebutuhan:** Cara mudah untuk mengusulkan sumber baru tanpa harus paham Git secara mendalam
- **Pain Point:** Tidak tahu bagaimana cara berkontribusi ke database
- **Success:** Berhasil submit satu kontribusi dan mendapat feedback dalam < 7 hari

### Persona D — Maintainer Registry

- **Profil:** Anggota tim yang bertanggung jawab mengelola kualitas data registry
- **Kebutuhan:** Tools validasi otomatis, workflow review yang efisien, dokumentasi internal
- **Pain Point:** Review kontribusi manual memakan waktu jika tidak ada tooling
- **Success:** Mereview dan memproses satu kontribusi dalam < 30 menit kerja

---

## 3. Feature Requirements

### F-01: Tab Overview

| ID | Requirement | Prioritas |
|----|-------------|-----------|
| F01-1 | Menampilkan diagram arsitektur layer L0–L3 secara visual | Harus |
| F01-2 | Menampilkan preview tiga endpoint static API dengan contoh response | Harus |
| F01-3 | Menampilkan penjelasan pipeline data (registry, spikes, kontribusi) | Harus |
| F01-4 | Navigasi cepat ke tab lain melalui section cards | Harus |

### F-02: Tab Plan & Roadmap

| ID | Requirement | Prioritas |
|----|-------------|-----------|
| F02-1 | Menampilkan timeline roadmap 6 fase dengan status (selesai/berjalan/planned) | Harus |
| F02-2 | Setiap fase menampilkan milestone, deliverable, dan target timeline | Harus |
| F02-3 | Animasi entrance saat section masuk viewport | Harus |

**6 Fase Roadmap:**
- Fase 0: Konsolidasi — pembuatan registry awal
- Fase 1: Vibathon — dashboard publik dan API
- Fase 1.5: Parent-Child — relasi sumber induk-anak untuk Telegram topics
- Fase 2: Multi-Platform — ekspansi ke WhatsApp dan website
- Fase 3: Kontribusi — sistem kontribusi komunitas terbuka
- Fase 4: Public Dataset — penerbitan dataset terbuka untuk penelitian

### F-03: Tab Architecture

| ID | Requirement | Prioritas |
|----|-------------|-----------|
| F03-1 | Menampilkan dokumentasi teknis arsitektur data secara lengkap | Harus |
| F03-2 | Menampilkan diagram alur validasi, snapshot, dan versioning | Harus |
| F03-3 | Konten dapat di-render dari file markdown | Harus |

### F-04: Tab Live Dashboard (Fitur Utama)

#### F-04a: Source List dengan Filtering

| ID | Requirement | Prioritas |
|----|-------------|-----------|
| F04a-1 | Menampilkan daftar sumber dengan status kesehatan real-time (dari snapshot terbaru) | Harus |
| F04a-2 | Filter berdasarkan status: active / stale / dead / unmonitored | Harus |
| F04a-3 | Filter berdasarkan platform: tg / yt / ig / web / wa | Harus |
| F04a-4 | Filter berdasarkan region: nasional, yogyakarta, bandung, dst. | Harus |
| F04a-5 | Pencarian teks bebas berdasarkan nama dan handle | Harus |
| F04a-6 | Sorting berdasarkan: confidence score, nama, jumlah subscriber | Harus |
| F04a-7 | Badge count pada setiap opsi filter menampilkan jumlah sumber yang cocok | Tinggi |

#### F-04b: Score Ring & Sparkline

| ID | Requirement | Prioritas |
|----|-------------|-----------|
| F04b-1 | Setiap baris sumber menampilkan **ScoreRing** — visualisasi donut confidence score | Harus |
| F04b-2 | Setiap baris sumber menampilkan **Sparkline** — mini chart aktivitas 30 hari | Harus |
| F04b-3 | Sparkline menggunakan data seeded deterministik jika history tidak tersedia | Tinggi |
| F04b-4 | Warna status: active=jade, stale=amber, dead=rust, unmonitored=abu | Harus |

#### F-04c: Peta Regional

| ID | Requirement | Prioritas |
|----|-------------|-----------|
| F04c-1 | Peta interaktif Indonesia menampilkan bubble per region | Harus |
| F04c-2 | Ukuran bubble proporsional terhadap jumlah sumber di region | Harus |
| F04c-3 | Warna bubble mencerminkan kondisi kesehatan rata-rata region | Harus |
| F04c-4 | Hover pada bubble menampilkan statistik region (total, aktif, dead) | Harus |

#### F-04d: Trend Chart

| ID | Requirement | Prioritas |
|----|-------------|-----------|
| F04d-1 | Menampilkan grafik tren kesehatan ekosistem 30 hari terakhir | Harus |
| F04d-2 | Grafik menampilkan: avg score, active count, dead count | Harus |
| F04d-3 | Tooltip interaktif pada hover menampilkan nilai per hari | Tinggi |

#### F-04e: Topic Discovery Panel (Track B)

| ID | Requirement | Prioritas |
|----|-------------|-----------|
| F04e-1 | Menampilkan kandidat topik Telegram yang belum terdaftar | Tinggi |
| F04e-2 | Menampilkan status evaluasi per topik: mapped, ignored, candidate | Tinggi |
| F04e-3 | Filter berdasarkan freshness dan status evaluasi | Sedang |

### F-05: Tab Contribute

| ID | Requirement | Prioritas |
|----|-------------|-----------|
| F05-1 | Panduan langkah-langkah kontribusi yang jelas | Harus |
| F05-2 | Form intake dengan validasi real-time | Harus |
| F05-3 | Output JSON dari form yang bisa disalin | Harus |
| F05-4 | Pilihan delivery method: GitHub PR / Email / Netlify Form | Harus |
| F05-5 | Preview alur workflow GitHub Actions yang akan dijalankan | Tinggi |

**Field Form Kontribusi:**

| Field | Tipe | Wajib | Keterangan |
|-------|------|-------|------------|
| name | string | ✅ | Nama sumber |
| platform | enum | ✅ | tg/yt/ig/web/wa |
| source_type | enum | ✅ | channel/group/topic/site/profile |
| url | string | ✅ | URL lengkap |
| handle | string | ✅ | Username/handle |
| region | enum | ✅ | Region Indonesia |
| evidence_url | string | ✅ | Bukti keaktifan (screenshot/link) |
| submitted_by | string | ✅ | Nama/alias kontributor |
| category | string[] | — | Array kategori |
| tags | string[] | — | Tags tambahan |
| notes | string | — | Catatan bebas |
| parent_id | string | — | Untuk Telegram topic |
| topic_id | string | — | Untuk Telegram topic |

---

## 4. Health Monitoring Requirements

### Monitoring Telegram (Current)

| ID | Requirement |
|----|-------------|
| HM-1 | Script `check-telegram.ts` dijalankan via GitHub Actions setiap pukul 00:01 WIB |
| HM-2 | Setiap source Telegram di-scrape menggunakan public HTML endpoint |
| HM-3 | Informasi yang diekstrak: subscriber count, last post timestamp, metadata channel |
| HM-4 | Confidence score dihitung: `0.40 * http_fetch + 0.35 * content_parse + 0.25 * freshness` |
| HM-5 | Hasil snapshot disimpan ke `data/latest.json` dan `data/health/YYYY-MM-DD.json` |
| HM-6 | Jika snapshot berubah, script auto-commit ke repository |

### Monitoring Website (Future — Q3 2026)

| ID | Requirement |
|----|-------------|
| HM-W1 | Adapter `fetch-website.ts` harus mengikuti interface yang sama dengan `fetch-telegram.ts` |
| HM-W2 | Health check website mencakup: HTTP status, content freshness, last post detection |
| HM-W3 | Confidence score formula dapat dikustomisasi per platform |

### Monitoring WhatsApp (Future — Q4 2026)

| ID | Requirement |
|----|-------------|
| HM-WA1 | Metode monitoring WhatsApp harus comply dengan Terms of Service platform |
| HM-WA2 | Fallback: community-reported health check jika API tidak tersedia |

---

## 5. Contribution Intake Requirements

### Alur Kontribusi

```
1. Pengguna mengisi form di tab Contribute
2. Form menghasilkan JSON sesuai skema IntakeItem
3. Pengguna memilih delivery method:
   a. GitHub PR → pre-filled template dengan JSON content
   b. Email → mailto link dengan JSON di body
   c. Netlify Form → submit langsung ke endpoint
4. File masuk ke data/contributions/pending/<slug>.json
5. CI (validate-contributions.yml) otomatis validasi skema
6. Maintainer review + approve
7. Maintainer jalankan: npm run promote-contribution -- <slug>
8. Source masuk ke data/sources.json
```

### Validasi Otomatis

| Aturan Validasi | Implementasi |
|-----------------|--------------|
| Semua field wajib terisi | `validate-contributions.mjs` |
| Format URL valid | Regex validation |
| Platform value sesuai enum | Schema check |
| Jika ada parent_id, parent harus ada di registry | Relation check |
| Tidak duplikat dengan sumber yang sudah ada | ID uniqueness check |

---

## 6. Static API Requirements

### Endpoint Contracts

| Endpoint | Format | Update Frequency | Description |
|----------|--------|-----------------|-------------|
| `/v1/sources.json` | `Source[]` | Setiap ada perubahan registry | Seluruh registry sumber |
| `/v1/latest.json` | `LatestSummary` | Harian (cron 00:01 WIB) | Snapshot kesehatan terbaru |
| `/v1/active.json` | `Source[]` | Harian | Hanya sumber dengan status aktif |

### Persyaratan API

| ID | Requirement |
|----|-------------|
| API-1 | Semua endpoint bersifat publik (tidak memerlukan autentikasi) |
| API-2 | Semua endpoint mengembalikan Content-Type: application/json |
| API-3 | CORS headers memperbolehkan akses dari semua origin |
| API-4 | Endpoint tersedia via CDN Netlify dengan availability ≥ 99.9% |
| API-5 | Perubahan skema JSON mengikuti semantic versioning (v1, v2, dst.) |
| API-6 | Breaking changes harus diumumkan minimal 30 hari sebelumnya |

---

## 7. Non-Functional Requirements

### Performa

| Requirement | Target |
|-------------|--------|
| First Contentful Paint (FCP) | < 1.5 detik pada koneksi 4G |
| Time to Interactive (TTI) | < 3 detik |
| Ukuran bundle JavaScript | < 500KB gzipped |
| Static generation (build time) | < 2 menit |

### Aksesibilitas

| Requirement | Standard |
|-------------|----------|
| Kontras warna minimal | WCAG AA (4.5:1 untuk teks normal) |
| Navigasi keyboard | Semua fitur dapat diakses via keyboard |
| Screen reader support | Semua elemen interaktif memiliki aria-label |
| Reduced motion | Animasi dinonaktifkan jika `prefers-reduced-motion: reduce` |

### Responsivitas

| Breakpoint | Behavior |
|------------|----------|
| Mobile (< 768px) | Filter panel collapsible, single-column layout |
| Tablet (768px–1180px) | Two-column layout, filter sidebar tersembunyi |
| Desktop (> 1180px) | Full layout, semua panel visible |

### Dark Mode

| Requirement | Implementasi |
|-------------|--------------|
| Dark mode tersedia | Toggle di navbar |
| Preference disimpan | localStorage |
| Background dark | #1A1916 (warm brown, bukan pure black) |
| Warna tetap konsisten | Semua warna menggunakan CSS custom properties |

### Desain Tipografi

| Konteks | Font |
|---------|------|
| Display / Hero heading | Fraunces (serif) |
| UI / Body text | Plus Jakarta Sans |
| Kode / ID / Data | Geist Mono (tabular-nums) |
| Prosa / Dokumentasi | Source Serif 4 |

---

## 8. Acceptance Criteria

### AC-01: Filter Sumber Aktif

```
Given: Dashboard ditampilkan dengan daftar sumber
When:  Pengguna memilih filter "active"
Then:  Hanya sumber dengan status "active" yang ditampilkan
And:   Badge count pada filter menampilkan jumlah yang akurat
And:   Filter dapat digabungkan dengan filter lain (platform, region, search)
```

### AC-02: Health Check Harian

```
Given: Repository memiliki GitHub Actions aktif
When:  Jam menunjukkan 00:01 WIB (17:01 UTC)
Then:  Workflow health-check.yml berjalan otomatis
And:   data/latest.json diperbarui dengan snapshot baru
And:   data/health/YYYY-MM-DD.json dibuat untuk hari itu
And:   Perubahan di-commit ke repository secara otomatis
```

### AC-03: Kontribusi Sumber Baru

```
Given: Pengguna mengisi form Contribute dengan semua field wajib
When:  Pengguna memilih "Submit via GitHub PR"
Then:  Browser membuka halaman GitHub dengan template PR yang sudah terisi
And:   Template berisi JSON sesuai skema IntakeItem
And:   Label PR sudah ter-set: "source-intake"
```

### AC-04: Static API Accessibility

```
Given: Build telah selesai dan di-deploy ke Netlify
When:  Developer melakukan GET /v1/sources.json
Then:  Response adalah JSON array sumber yang valid
And:   Content-Type header adalah application/json
And:   Response diterima dalam < 500ms (dari CDN)
```

### AC-05: Confidence Score Display

```
Given: Sumber memiliki confidence score dari snapshot terbaru
When:  Sumber ditampilkan di dashboard
Then:  ScoreRing menampilkan persentase yang akurat
And:   Warna ScoreRing sesuai dengan status: jade/amber/rust/abu
And:   Hover pada ScoreRing menampilkan breakdown komponen score
```

---

## 9. Dependencies & Constraints

### Technical Dependencies

| Dependency | Versi | Keperluan |
|------------|-------|-----------|
| Next.js | 16.2.6 | Framework utama |
| React | 19.2.4 | UI rendering |
| Tailwind CSS | 4 | Styling |
| Leaflet | 1.9.4 | Peta interaktif |
| Cheerio | 1.0.0 | Telegram HTML scraping |
| GitHub Actions | — | CI/CD dan health check otomatis |
| Netlify | — | Hosting dan CDN |

### Constraints

| Constraint | Dampak |
|------------|--------|
| Tidak ada database — semua data adalah file JSON di Git | Tidak ada real-time updates; semua perubahan via build |
| Telegram scraping berbasis HTML publik | Jika Telegram mengubah struktur HTML, scraping bisa gagal |
| GitHub Actions gratis hanya untuk repository publik | Repository harus tetap publik |
| Static generation — tidak ada SSR | Data hanya fresh saat build; pengguna melihat data pada saat terakhir build/deploy |
| Next.js v16 breaking changes | Beberapa API berbeda dari dokumentasi umum — selalu cek `node_modules/next/dist/docs/` |
