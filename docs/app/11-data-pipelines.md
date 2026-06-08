# Data Pipelines: Registry, Discovery, Contribution

Project ini memakai tiga jalur data agar registry resmi tetap stabil sekaligus tetap bisa menerima discovery otomatis dan crowd-source PR.

## 1. Registry Resmi

- File: `data/sources.json`
- Dipakai oleh: dashboard, static API, health checker
- Mutasi oleh: maintainer atau script promotion
- Validasi: `npm run validate:sources`

Jalur ini adalah source of truth. Contributor publik tidak diarahkan mengedit file ini langsung karena rawan konflik dan sulit direview.

## 2. Discovery / Spike

- File: `data/spikes/*`
- Dipakai oleh: maintainer dan panel discovery
- Mutasi oleh: workflow/script spike
- Contoh: Track B Telegram topic discovery untuk `@sijadwalkajian`

Output discovery bukan data resmi. Candidate harus melewati draft, review, lalu apply sebelum masuk registry.

Alur Track B:

```txt
telegram-topic-freshness.json
  -> telegram-topic-freshness-mapped.json
  -> telegram-topic-freshness-evaluated.json
  -> topic-promotion-candidates.json
  -> topic-promotion-review.json
  -> data/sources.json
```

## 3. Contribution Intake

- File: `data/contributions/pending/*.json`
- Dipakai oleh: CI validator dan maintainer review
- Mutasi oleh: contributor GitHub via PR
- Validasi: `npm run validate:contributions`

Contributor menambahkan satu file kecil per usulan source. Maintainer kemudian mempromosikan usulan yang disetujui ke registry resmi.

Alur crowd-source:

```txt
Contributor PR
  -> data/contributions/pending/<slug>.json
  -> validate:contributions
  -> maintainer review
  -> promote to data/sources.json
  -> validate:sources
  -> health snapshot
```

## Rule of Thumb

- Source resmi dan public API: `data/sources.json`
- Candidate otomatis/internal: `data/spikes/*`
- Usulan manusia dari GitHub: `data/contributions/pending/*.json`
