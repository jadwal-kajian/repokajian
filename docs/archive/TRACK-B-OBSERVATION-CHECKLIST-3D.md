# Track B — 3-Day Observation Checklist (B7/B8)

## Tujuan
Memvalidasi kelayakan implementasi authenticated topic freshness sebelum integrasi ke checker utama.

## Periode
- Hari 1
- Hari 2
- Hari 3

## Prasyarat (sekali sebelum Hari 1)
- [ ] Secrets terpasang di GitHub repo:
  - [ ] `TG_API_ID`
  - [ ] `TG_API_HASH`
  - [ ] `TG_SESSION_STRING`
- [ ] Workflow tersedia: `check-telegram-auth-spike.yml`
- [ ] Branch uji: `phase-1.5-auth-spike`

---

## Checklist Harian

### A. Workflow execution
- [ ] Workflow ter-trigger (schedule/manual)
- [ ] Job selesai tanpa timeout
- [ ] Retry tidak melebihi batas

### B. Artifact checks
- [ ] `telegram-topic-freshness.json` ada
- [ ] `telegram-topic-freshness-mapped.json` ada
- [ ] `telegram-topic-freshness-evaluated.json` ada
- [ ] Tidak ada content message mentah di artifact

### C. Semantic checks
- [ ] `run.status` bukan `needs_setup`
- [ ] `run.status` bukan `error`
- [ ] Distribusi status masuk akal (`blocked/error` tidak melonjak abnormal)

### D. Mapping checks
- [ ] `mapped_topics` > 0 (target saat data real sudah masuk)
- [ ] `unmapped_topics` dicatat untuk update rule map

### E. Security checks
- [ ] Log tidak menampilkan secret mentah
- [ ] Tidak ada token/session leakage di output

---

## Gate Decision After Day 3

### GO jika semua terpenuhi:
- [ ] Success rate run >= 95%
- [ ] Secrets stabil (tidak perlu re-bootstrap berulang)
- [ ] Artifact valid 3 hari beruntun
- [ ] Mapping bisa ditingkatkan tanpa ubah arsitektur

### NO-GO jika salah satu terjadi:
- [ ] Auth sering invalid/revoked
- [ ] Run sering `needs_setup` / `error`
- [ ] Data tidak konsisten untuk pengambilan keputusan freshness
- [ ] Risiko operasional/security terlalu tinggi

---

## Output yang wajib disiapkan
- [x] Gate report: `TRACK-B-GATE-REPORT-2026-06-02.md`
- [x] Keputusan final: `GO WITH GUARDRAILS`
- [x] Next step yang jelas: keep 5-topic Track B dashboard sample, maintain group-level fallback, and draft secret rotation/re-bootstrap runbook before main-checker integration.

---

## Observation Log

### 2026-06-02 — Day-1 attempt

Findings:
- GitHub Secrets verified present in repo: `TG_API_ID`, `TG_API_HASH`, `TG_SESSION_STRING`.
- Workflow manually dispatched on GitHub Actions: <https://github.com/t-onluring/vibathon-2026/actions/runs/26795370347>
- Run branch/SHA: `main` / `1ff1c261ad6ab3f4621d90ff0d4ba233fac93d5b`.
- Job conclusion: success.
- Freshness step connected to Telegram MTProto and fetched 79 forum topics.
- Freshness `run.status = ok`; `last_post_at` was resolved for 79/79 topics.
- Retry usage: attempt 1/2 succeeded; no retry needed.
- Artifact uploaded successfully:
  - name: `telegram-auth-topic-freshness`
  - run: <https://github.com/t-onluring/vibathon-2026/actions/runs/26793883075>
- Mapping/evaluator results:
  - mapping: `total_topics = 79`, `mapped_topics = 77`, `ignored_topics = 2`, `unmapped_topics = 0`
  - evaluator: `total_topics = 79`, `active = 34`, `stale = 39`, `dead = 4`, `blocked = 0`, `ignored = 2`, `error = 0`
- Secrets were masked as `***` in logs.
- Downloaded artifact inspection found no raw `text` keys, no raw Telegram message payload keys, and no secret literal values.

Day-1 checklist status:
- Workflow execution: completed successfully without timeout or retry.
- Artifact checks: completed; all three expected JSON artifacts were present.
- Semantic checks: completed; `run.status = ok`, not `needs_setup` or `error`.
- Mapping checks: completed; `mapped_topics = 77`, `ignored_topics = 2`, `unmapped_topics = 0`.
- Security checks: no raw secret values or raw message text observed in inspected logs/artifacts.

Required next action:
- Continue Day-2/Day-3 observation with `Dapur Satu Data Kajian` and `General` counted as intentional ignores.

### 2026-06-03 — Day-2 scheduled run

Findings:
- Workflow triggered by schedule on GitHub Actions: <https://github.com/t-onluring/vibathon-2026/actions/runs/26845616904>
- Run branch/SHA: `main` / `a9f9e237af9a2df1b16159d937dd44d005bc2166`.
- Job conclusion: success.
- Freshness step connected to Telegram MTProto and fetched 79 forum topics.
- Freshness `run.status = ok`; `last_post_at` was resolved for 79/79 topics.
- Retry usage: attempt 1/2 succeeded; no retry needed.
- Artifact uploaded successfully:
  - name: `telegram-auth-topic-freshness`
  - run: <https://github.com/t-onluring/vibathon-2026/actions/runs/26845616904>
  - artifact id: `7368832672`
  - digest: `sha256:e8406b15453a686828eae6d0364421b9c106d9dde173d5621639b0632c4333e0`
- Mapping/evaluator results:
  - mapping: `total_topics = 79`, `mapped_topics = 77`, `ignored_topics = 2`, `unmapped_topics = 0`
  - evaluator: `total_topics = 79`, `active = 30`, `stale = 43`, `dead = 4`, `blocked = 0`, `ignored = 2`, `error = 0`
- Secrets were masked as `***` in logs.
- Downloaded artifact inspection found no suspicious raw-message keys.

Day-2 checklist status:
- Workflow execution: completed successfully without timeout or retry.
- Artifact checks: completed; all three expected JSON artifacts were present.
- Semantic checks: completed; `run.status = ok`, not `needs_setup` or `error`.
- Mapping checks: completed; `mapped_topics = 77`, `ignored_topics = 2`, `unmapped_topics = 0`.
- Security checks: no raw secret values or raw message text observed in inspected logs/artifacts.

Required next action:
- Continue Day-3 observation with `Dapur Satu Data Kajian` and `General` counted as intentional ignores.

### 2026-06-04 — Day-3 scheduled run

Findings:
- Workflow triggered by schedule on GitHub Actions: <https://github.com/t-onluring/vibathon-2026/actions/runs/26910969856>
- Run branch/SHA: `main` / `ae0511438eff8a9f912b7e0c3a999ea01f5de2d4`.
- Job conclusion: success.
- Freshness step connected to Telegram MTProto and fetched 79 forum topics.
- Freshness `run.status = ok`; `last_post_at` was resolved for 79/79 topics.
- Retry usage: attempt 1/2 succeeded; no retry needed.
- Artifact uploaded successfully:
  - name: `telegram-auth-topic-freshness`
  - run: <https://github.com/t-onluring/vibathon-2026/actions/runs/26910969856>
  - artifact id: `7395889749`
  - digest: `sha256:03f79a10428cf7d9c26bee8d4bece53c862071cac716c015c5a2c29cb94cffd4`
- Mapping/evaluator results:
  - mapping: `total_topics = 79`, `mapped_topics = 77`, `ignored_topics = 2`, `unmapped_topics = 0`
  - evaluator: `total_topics = 79`, `active = 31`, `stale = 42`, `dead = 4`, `blocked = 0`, `ignored = 2`, `error = 0`
- Secrets were masked as `***` in logs.
- Downloaded artifact inspection found all three expected JSON files and no suspicious raw-message/secret keys beyond the sanitized run `message` summary.

Day-3 checklist status:
- Workflow execution: completed successfully without timeout or retry.
- Artifact checks: completed; all three expected JSON artifacts were present.
- Semantic checks: completed; `run.status = ok`, not `needs_setup` or `error`.
- Mapping checks: completed; `mapped_topics = 77`, `ignored_topics = 2`, `unmapped_topics = 0`.
- Security checks: no raw secret values or raw message text observed in inspected logs/artifacts.

Required next action:
- Continue with guardrail follow-up: keep the 5-topic dashboard sample visible, maintain group-level fallback, and draft secret rotation/re-bootstrap policy before main-checker integration.
