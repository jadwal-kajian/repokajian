# Business Requirements Document (BRD)

## Masalah

Sumber kajian Sunnah Indonesia tersebar di Telegram, WhatsApp, YouTube, Instagram, dan website — tanpa registry terpusat. Setiap aplikasi yang ingin mengakses data ini harus membangun data sourcing sendiri dari nol.

Layer-1 (registry + monitoring) tidak ada. Proyek ini mengisinya.

## Tujuan Bisnis

- Menyediakan registry sumber kajian yang terpusat dan terstandar
- Memastikan keandalan data via monitoring kesehatan otomatis
- Mempublikasikan static API yang bisa dikonsumsi aplikasi hilir
- Mendorong kontribusi komunitas melalui alur terstruktur
- Mendukung ekspansi ke platform baru tanpa rewrite arsitektur

## Stakeholder

| Peran | Kebutuhan |
|-------|-----------|
| Pengguna Umum | Filter sumber aktif, status jelas |
| Developer / Aggregator | API stabil, skema terdokumentasi |
| Kontributor Komunitas | Alur kontribusi sederhana |
| Maintainer | Tools validasi, workflow promosi |

## Platform Roadmap

| Platform | Status |
|----------|--------|
| Telegram (channel, grup, topik) | ✅ Aktif |
| Website (HTTP + content parse) | 🔜 Q3 2026 |
| WhatsApp | 🔜 Q4 2026 |
| YouTube, Instagram | 📋 Backlog |

Prinsip: setiap platform punya adapter sendiri (`fetch-<platform>.ts`). Output distandarkan ke interface `Snapshot` yang sama — tidak ada rewrite saat ekspansi.

## KPI

- Sumber terdaftar: ≥ 50 (3 bulan), ≥ 150 (12 bulan)
- Sumber aktif: ≥ 80%
- Uptime health check harian: ≥ 99%
- Downstream apps yang consume API: ≥ 2 (6 bulan)

## Out of Scope

- Aplikasi konsumen (jadwal, notifikasi) — tanggung jawab L3
- Moderasi konten kajian secara syar'i
- Auth / user accounts
- Real-time push notification
