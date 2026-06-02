# Contribution Intake

Contributor umum tidak perlu mengedit `data/sources.json` langsung.

Gunakan folder:

- `pending/` untuk usulan source baru atau update yang masuk lewat PR.

Maintainer akan mereview file pending, lalu mempromosikan usulan yang disetujui ke `data/sources.json`.

## Format Minimal

```json
{
  "name": "Kajian Kota Contoh",
  "platform": "tg",
  "source_type": "channel",
  "url": "https://t.me/kajiancontoh",
  "handle": "kajiancontoh",
  "region": "kota-contoh",
  "category": ["kajian", "jadwal"],
  "tags": ["kajian", "jadwal"],
  "evidence_url": "https://t.me/kajiancontoh",
  "submitted_by": "github-username",
  "notes": "Akun publik aktif."
}
```

Untuk topic Telegram, tambahkan:

```json
{
  "source_type": "topic",
  "parent_id": "tg-sijadwalkajian",
  "topic_id": "201"
}
```
