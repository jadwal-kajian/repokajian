# Data Model

## Entity: Source
Representasi master source pada `data/sources.json`.

Minimal field:
- `id`
- `name`
- `platform` (`tg`/`yt`/`ig`/`web`/`wa`)
- `source_type`
- `url`
- `handle`
- `region`
- `priority`
- `added_at`

Jika `source_type = topic`, wajib ada:
- `parent_id`
- `topic_id`

## Entity: Contribution Intake
Representasi usulan contributor pada `data/contributions/pending/*.json`.

Minimal field:
- `name`
- `platform`
- `source_type`
- `url`
- `handle`
- `region`
- `evidence_url`
- `submitted_by`

Jika intake berupa topic, wajib ada:
- `parent_id`
- `topic_id` numerik

## Entity: Snapshot
Field utama:
- `source_id`
- `last_checked_at`
- `platform`
- `status`
- `confidence_score`
- `metrics` (subscriber/last_post)

## Konvensi Naming
- File docs UI pakai prefix urutan: `00-...md` dst.
- Source ID konsisten lintas snapshot

## Promotion Rule
- `data/spikes/*` dan `data/contributions/pending/*.json` tidak otomatis masuk API.
- Candidate harus direview, lalu dipromosikan ke `data/sources.json`.
