# Changelog / Decision Log

## 2026-05-11
- Pilih Layer-1 positioning (bukan aggregator end-user)
- Pilih Telegram untuk Phase 1 karena paling feasible
- Data store pakai JSON di Git
- Cron pakai GitHub Actions

## 2026-05-14
- Dashboard dual-tab dipastikan berjalan
- Hasil checker dan build tervalidasi

## 2026-05-17
- Dokumentasi dikonsolidasi ke `docs/`
- Kontribusi dipusatkan ke `docs/CONTRIBUTING.md`
- Konvensi docs ditetapkan di `docs/README.md`

## 2026-06-04
- Final Track B decision: `GO WITH GUARDRAILS`
- Group-level fallback tetap menjadi baseline produksi
- Live dashboard tetap menampilkan 5-topic Track B sample agar spike tetap terlihat
- Bulk-promote 77 mapped topics ke `data/sources.json` ditolak untuk saat ini
- Promosi topic dari Track B ke registry utama wajib lewat review eksplisit
