# Architecture

## High-Level
1. `data/sources.json` sebagai registry resmi dan source of truth static API
2. `data/spikes/*` sebagai discovery layer untuk eksperimen/machine-discovered candidates
3. `data/contributions/pending/*.json` sebagai intake layer untuk crowd-source PR
4. `scripts/check-telegram.ts` melakukan fetch + scoring untuk registry resmi
5. Output ke `data/latest.json` dan `data/health/YYYY-MM-DD.json`
6. Next.js app membaca data statis saat build/runtime

## Tiga Jalur Data

### Registry Resmi
- File: `data/sources.json`
- Konsumen: dashboard, static API, health checker
- Mutasi: maintainer atau promotion script

### Discovery / Spike
- File: `data/spikes/*`
- Konsumen: maintainer dan panel discovery
- Mutasi: workflow/script spike

### Contribution Intake
- File: `data/contributions/pending/*.json`
- Konsumen: CI validator dan maintainer review
- Mutasi: contributor GitHub via PR

## Komponen Utama
- Loader: `src/app/lib/data.ts`
- Dashboard: `src/app/components/AppTab.tsx`
- Docs view: `src/app/components/DocsTab.tsx` + `DocsDrawer.tsx`
- Cron: `.github/workflows/health-check.yml`
- Contribution validator: `scripts/validate-contributions.mjs`
- Source validator: `scripts/validate-sources.mjs`

## Decision Utama
- Simpan data di Git (tanpa DB) untuk simplicity + versioning
- Cron via GitHub Actions untuk operasi harian murah
- Docs app dirender dari `docs/in-app/`
- Crowd-source PR masuk lewat intake file, bukan edit registry langsung
