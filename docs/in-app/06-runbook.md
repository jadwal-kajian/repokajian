# Runbook / Troubleshooting

## Checker Gagal
1. Jalankan lokal: `npm run check:telegram`
2. Cek error parsing/fetch
3. Verifikasi channel publik dan format URL

## Data Tidak Tampil di Dashboard
1. Cek `data/latest.json`
2. Jalankan `npm run build`
3. Pastikan loader `loadLatest()` tidak return `null`

## Track B Manual Topic Promotion
1. Jalankan `npm run spike:topic-promote-draft`.
2. Jalankan `npm run spike:topic-promote-review-init`.
3. Edit `data/spikes/topic-promotion-review.json`:
   - Set hanya topic pilihan menjadi `"approved": true`.
   - Approve maksimal 5 topic sample untuk guardrail saat ini.
   - Sample awal: `tg-sijadwalkajian-yogyakarta`, `tg-sijadwalkajian-cimahi`, `tg-sijadwalkajian-bandung`, `tg-sijadwalkajian-kuningan`, `tg-sijadwalkajian-depok`.
   - Set `"confirm_promote": true`.
4. Jalankan `npm run spike:topic-promote-apply`.
5. Validasi dengan `npm run validate:sources`, `npm run check:telegram`, dan `npm run build`.

Jangan bulk-promote semua mapped topics; group-level fallback tetap baseline produksi.

## PR Validasi Gagal
1. Jalankan `npm run validate:sources`
2. Cek duplikasi `id`, `url`, `handle+platform`
3. Untuk topic, pastikan `topic_id` numerik; placeholder non-numeric akan gagal karena strict mode aktif
4. Pastikan `added_at` format `YYYY-MM-DD`

## Recovery Cepat
- Re-run workflow `health-check.yml` manual
- Commit perbaikan data
- Rebuild/deploy ulang
