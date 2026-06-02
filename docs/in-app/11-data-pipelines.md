# Data Pipelines: Registry, Discovery, Contribution

Project ini memakai tiga jalur data:

## 1. Registry Resmi
- File: `data/sources.json`
- Dipakai dashboard, static API, dan health checker
- Diubah oleh maintainer atau promotion script

## 2. Discovery / Spike
- File: `data/spikes/*`
- Dipakai untuk kandidat internal dan machine-discovered topics
- Contoh: Track B `@sijadwalkajian`

## 3. Contribution Intake
- File: `data/contributions/pending/*.json`
- Dipakai untuk PR crowd-source dari contributor GitHub
- Validasi: `npm run validate:contributions`

Rule of thumb:
- Source resmi: `data/sources.json`
- Candidate otomatis: `data/spikes/*`
- Usulan manusia: `data/contributions/pending/*.json`
