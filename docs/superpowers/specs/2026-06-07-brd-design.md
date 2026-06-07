# BRD — Business Requirements Document
## Source List Kajian Sunnah Indonesia

**Versi:** 1.0  
**Tanggal:** 7 Juni 2026  
**Status:** Draft  
**Penulis:** Tim Vibathon 2026

---

## 1. Ringkasan Eksekutif

Source List Kajian Sunnah Indonesia adalah **infrastruktur Layer-1** untuk ekosistem pendidikan Islam di Indonesia. Proyek ini bukan aplikasi konsumen akhir, melainkan **data layer yang menjadi fondasi** bagi aplikasi-aplikasi yang lebih tinggi — mulai dari penjadwal kajian, aggregator konten, hingga chatbot islami.

Masalah yang diselesaikan: tidak ada registry terpusat dan terstandar untuk sumber-sumber kajian Sunnah di Indonesia. Akibatnya, setiap aplikasi membangun data sourcingnya sendiri dari nol, dengan kualitas yang bervariasi dan tidak dapat diverifikasi.

Solusi: satu registry terbuka berbasis Git yang dapat dimonitor kesehatannya secara otomatis, diakses melalui static API, dan diperkaya oleh komunitas melalui alur kontribusi yang terstruktur.

---

## 2. Latar Belakang & Masalah

### Konteks Ekosistem

Ekosistem kajian Sunnah Indonesia tersebar di berbagai platform digital:
- **Telegram** — channel, grup, dan topik kajian
- **WhatsApp** — grup pengajian dan broadcast list
- **YouTube** — rekaman kajian, live streaming
- **Instagram** — konten dakwah visual
- **Website** — portal kajian institusional

Setiap platform memiliki karakteristik berbeda dalam hal aksesibilitas data, frekuensi posting, dan metode monitoring.

### Masalah Inti

| Masalah | Dampak |
|---------|--------|
| Tidak ada registry terpusat | Duplikasi kerja di setiap aplikasi |
| Kualitas data tidak terverifikasi | Aplikasi hilir tidak tahu sumber mana yang masih aktif |
| Tidak ada standar format data | Integrasi antar sistem sulit dan mahal |
| Tidak ada mekanisme health check | Sumber mati tidak terdeteksi, merusak pengalaman pengguna |
| Kontribusi komunitas tidak terstruktur | Data baru masuk tanpa validasi, berpotensi merusak registry |

### Kesenjangan Arsitektur

```
L0: Sumber (Telegram, WhatsApp, YouTube, Website, Instagram)
     ↕ [GAP — tidak ada layer standar]
L2: Aggregator Apps (Sijadwal, Kajian Finder, dst.)
L3: Aplikasi Konsumen
```

Layer-1 (registry + monitoring) yang seharusnya menjembatani L0 dan L2 tidak ada. Proyek ini mengisi gap tersebut.

---

## 3. Tujuan Bisnis

| ID | Tujuan | Metrik Sukses |
|----|--------|---------------|
| BO-1 | Menyediakan registry sumber kajian yang terpusat dan terstandar | ≥ 50 sumber terdaftar, skema JSON terdokumentasi |
| BO-2 | Memastikan keandalan data melalui monitoring kesehatan otomatis | ≥ 90% sumber dimonitor, cek harian berjalan tanpa error |
| BO-3 | Mempublikasikan static API yang dapat dikonsumsi oleh aplikasi hilir | 3 endpoint publik aktif, latency < 200ms (CDN) |
| BO-4 | Mendorong kontribusi komunitas melalui alur yang terstruktur | ≥ 5 kontribusi komunitas masuk dalam 3 bulan pertama |
| BO-5 | Mendukung ekspansi ke platform baru tanpa rewrite arsitektur | WhatsApp + website scraping aktif dalam 6 bulan |

---

## 4. Stakeholder

### Stakeholder Primer

| Peran | Deskripsi | Kebutuhan Utama |
|-------|-----------|-----------------|
| **Pengguna Umum** | Mencari sumber kajian terpercaya | Dashboard yang mudah difilter, status aktif/tidak aktif jelas |
| **Developer / Aggregator App** | Membangun aplikasi di atas data registry | Static API stabil, skema terdokumentasi, SLA monitoring |
| **Kontributor Komunitas** | Mengusulkan sumber kajian baru | Alur kontribusi sederhana, feedback jelas |
| **Maintainer** | Mengelola registry dan mereview kontribusi | Tools validasi, workflow promosi, dokumentasi internal |

### Stakeholder Sekunder

- **Lembaga Kajian / Ustadz** — berpotensi memanfaatkan visibilitas dari registry
- **Peneliti / Akademisi** — data terbuka untuk analisis ekosistem kajian Indonesia

---

## 5. Market & Peluang

### Ukuran Pasar

Indonesia memiliki populasi Muslim terbesar di dunia (~240 juta jiwa). Konsumsi konten kajian Islam digital tumbuh signifikan pasca-pandemi. Platform-platform kajian (Sijadwal, Kajian Finder, berbagai aplikasi jadwal pengajian) tumbuh namun berjalan silo.

### Posisi Unik

Source List bukan pesaing aplikasi-aplikasi tersebut. Proyek ini adalah **data supplier** yang membuat semua aplikasi tersebut lebih baik. Model ini mirip dengan npm registry untuk JavaScript atau CRAN untuk R — infrastruktur yang memungkinkan ekosistem.

### Peluang Strategis

1. **Menjadi standar de-facto** untuk identifikasi sumber kajian di Indonesia
2. **Partnership dengan aggregator** — Sijadwal, Kajian Finder bisa consume API langsung
3. **Data terbuka untuk penelitian** — Islamic studies, computational linguistics
4. **Verifikasi sumber** — potensi program partnership dengan lembaga kajian resmi

---

## 6. Business Requirements

### BR Saat Ini (Telegram)

| ID | Requirement | Prioritas |
|----|-------------|-----------|
| BR-1 | Sistem harus mampu menyimpan dan memvalidasi data sumber Telegram (channel, grup, topik) | Harus |
| BR-2 | Sistem harus memeriksa kesehatan sumber Telegram setiap 24 jam | Harus |
| BR-3 | Sistem harus mempublikasikan status kesehatan sumber dalam format JSON yang dapat diakses publik | Harus |
| BR-4 | Sistem harus menyediakan antarmuka untuk memfilter dan mencari sumber berdasarkan status, platform, dan region | Harus |
| BR-5 | Sistem harus mendukung alur kontribusi sumber baru dari komunitas | Harus |
| BR-6 | Sistem harus mempertahankan riwayat kesehatan 30 hari terakhir | Harus |

### BR Masa Depan — WhatsApp

| ID | Requirement | Prioritas |
|----|-------------|-----------|
| BR-W1 | Sistem harus mampu mendaftarkan sumber WhatsApp (grup, broadcast) | Tinggi |
| BR-W2 | Sistem harus mampu memeriksa keaktifan grup WhatsApp secara otomatis | Tinggi |
| BR-W3 | Monitoring WhatsApp harus menggunakan mekanisme yang comply dengan kebijakan platform | Harus |

### BR Masa Depan — Website Scraping

| ID | Requirement | Prioritas |
|----|-------------|-----------|
| BR-WS1 | Sistem harus mampu mendaftarkan sumber berbasis website (portal kajian) | Tinggi |
| BR-WS2 | Sistem harus mampu mengecek keaktifan website melalui HTTP health check dan content parsing | Tinggi |
| BR-WS3 | Sistem harus mampu mendeteksi tanggal konten terbaru dari website (last post freshness) | Sedang |

---

## 7. Platform Expansion Roadmap

| Platform | Status | Monitoring Method | Target |
|----------|--------|-------------------|--------|
| **Telegram** (channel, grup) | ✅ Aktif | HTML scraping via Cheerio | Deployed |
| **Telegram** (topik/thread) | ✅ Aktif | HTML scraping + topik mapping | Deployed |
| **Website** | 🔜 Planned | HTTP health check + content parsing | Q3 2026 |
| **WhatsApp** | 🔜 Planned | API resmi / partner integration | Q4 2026 |
| **YouTube** | 📋 Backlog | YouTube Data API | TBD |
| **Instagram** | 📋 Backlog | Public page scraping | TBD |

### Prinsip Extensibility

Arsitektur monitoring dirancang platform-agnostik:
- Setiap platform memiliki **adapter** sendiri di `/scripts/lib/fetch-<platform>.ts`
- Output adapter distandarkan ke interface `Snapshot` yang sama
- Penambahan platform baru tidak mengubah skema data inti atau UI dashboard

---

## 8. Success Metrics / KPI

### KPI Registry

| Metrik | Target 3 Bulan | Target 12 Bulan |
|--------|----------------|-----------------|
| Jumlah sumber terdaftar | ≥ 50 | ≥ 150 |
| Sumber dengan status aktif | ≥ 80% | ≥ 75% |
| Kontribusi komunitas masuk | ≥ 5 | ≥ 30 |
| Kontribusi disetujui | ≥ 60% dari masuk | ≥ 70% dari masuk |

### KPI Monitoring

| Metrik | Target |
|--------|--------|
| Uptime daily health check | ≥ 99% (manual recovery < 1 jam) |
| Lag monitoring (waktu cek - snapshot tersedia) | < 30 menit |
| False positive status "dead" | < 5% |

### KPI API & Integrasi

| Metrik | Target |
|--------|--------|
| Downstream apps yang consume API | ≥ 2 dalam 6 bulan |
| API availability (CDN) | ≥ 99.9% |
| Dokumentasi API tersedia | Ya (tersedia sejak hari pertama) |

---

## 9. Risiko & Asumsi

### Risiko

| ID | Risiko | Kemungkinan | Dampak | Mitigasi |
|----|--------|-------------|--------|----------|
| R-1 | Telegram mengubah kebijakan akses HTML publik | Sedang | Tinggi | Implementasi rate limiting, siapkan fallback (Telegram Bot API) |
| R-2 | WhatsApp tidak menyediakan API yang viable untuk monitoring | Tinggi | Sedang | Evaluasi alternatif: community-reported health check |
| R-3 | Sumber kajian berpindah platform atau URL berubah | Tinggi | Sedang | Validasi link periodik, alur update via kontribusi |
| R-4 | Maintainer tidak cukup untuk mereview kontribusi | Sedang | Tinggi | Otomasi validasi skema, proses promosi semi-otomatis |
| R-5 | Data sumber mengandung konten yang tidak sesuai | Rendah | Tinggi | Review manual sebelum promosi, kebijakan konten eksplisit |

### Asumsi

- GitHub Actions tersedia dan gratis untuk repository public
- Netlify tersedia sebagai hosting dengan CDN
- Sumber Telegram yang didaftarkan bersifat publik (dapat diakses tanpa login)
- Komunitas bersedia berkontribusi melalui alur berbasis GitHub PR

---

## 10. Out of Scope

Berikut hal-hal yang **bukan** tanggung jawab proyek ini:

| Item | Alasan |
|------|--------|
| Aplikasi konsumen untuk pengguna akhir (penjadwalan, notifikasi) | Tanggung jawab L3 apps |
| Moderasi konten kajian (penilaian benar/salah secara syar'i) | Di luar kompetensi teknis proyek |
| Authentication / login pengguna | Registry bersifat publik dan read-only |
| Penyimpanan rekaman atau transkrip kajian | Scope penyimpanan terlalu besar |
| Real-time notifications | Static architecture tidak mendukung push |
| Monetisasi atau paywall | Proyek open source / public good |
