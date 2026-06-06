# Track B Gate Report — 2026-06-02

## Summary
- Window: Day 1, Day 2, and Day 3 valid observations complete
- Workflow: `check-telegram-auth-spike.yml`
- Expected branch: `phase-1.5-auth-spike`
- Run branch/SHA:
  - Day 1: `main` / `1ff1c261ad6ab3f4621d90ff0d4ba233fac93d5b`
  - Day 2: `main` / `a9f9e237af9a2df1b16159d937dd44d005bc2166`
  - Day 3: `main` / `ae0511438eff8a9f912b7e0c3a999ea01f5de2d4`
- Verdict: `GO WITH GUARDRAILS`

## 1) Run Reliability
- Total GitHub workflow runs verified: 3
- Successful GitHub workflow runs verified: 3
- Success rate: 100%
- Timeout count: 0
- Retry-triggered runs: 0
- Notes: Runs `26795370347`, `26845616904`, and `26910969856` completed successfully. All freshness steps succeeded on attempt 1/2.

## 2) Auth Stability
- `needs_setup` count: 0 across verified GitHub runs
- `error` count: 0 across verified GitHub runs
- Session re-bootstrap needed? no
- Notes: GitHub Secrets are present and the regenerated MTProto session connected successfully on all three verified days.

## 3) Artifact Integrity
- freshness artifact present for valid Day-1, Day-2, and Day-3 runs: yes
- mapped artifact present for valid Day-1, Day-2, and Day-3 runs: yes
- evaluated artifact present for valid Day-1, Day-2, and Day-3 runs: yes
- No message content leakage confirmed: yes
- Notes: Artifact `telegram-auth-topic-freshness` was downloaded from runs `26795370347`, `26845616904`, and `26910969856`. Downloaded artifact inspection found no raw `text` keys, no raw Telegram message payload keys, and no secret literal values.

## 4) Mapping Quality
- Day 1: total/mapped/ignored/unmapped = 79/77/2/0
- Day 2: total/mapped/ignored/unmapped = 79/77/2/0
- Day 3: total/mapped/ignored/unmapped = 79/77/2/0
- Ignored topic titles:
  1. Dapur Satu Data Kajian
  2. General
- Mapping update required? no for current Day-1/Day-3 topic set

## 5) Status Semantics Sanity
- Day 1 status summary: freshness `run.status = ok`; `last_post_at` resolved for 79/79 topics. Evaluator summary: `total_topics = 79`, `active = 34`, `stale = 39`, `dead = 4`, `blocked = 0`, `ignored = 2`, `error = 0`
- Day 2 status summary: freshness `run.status = ok`; `last_post_at` resolved for 79/79 topics. Evaluator summary: `total_topics = 79`, `active = 30`, `stale = 43`, `dead = 4`, `blocked = 0`, `ignored = 2`, `error = 0`
- Day 3 status summary: freshness `run.status = ok`; `last_post_at` resolved for 79/79 topics. Evaluator summary: `total_topics = 79`, `active = 31`, `stale = 42`, `dead = 4`, `blocked = 0`, `ignored = 2`, `error = 0`
- Any abnormal spikes in `blocked`/`error`? no; intentional non-region topics are now counted as `ignored`.

## 6) Security & Compliance
- Secret exposed in logs: not observed locally
- Access anomaly detected: none observed locally
- Rate-limit/flood signals: none observed locally
- Actions taken: Inspected GitHub Actions runs and downloaded artifacts for runs `26795370347`, `26845616904`, and `26910969856`; secret values were masked as `***`.

## 7) Decision

### Recommendation
`GO WITH GUARDRAILS`

### Rationale
- The script chain is operational for the no-secret/bootstrap path.
- GitHub Secrets are present, the regenerated MTProto session works, and the workflow produced all required artifacts.
- Topic metadata is reachable, and the updated freshness implementation resolves `last_post_at` from Telegram forum topic dates.
- Remaining non-actionable topics are explicit ignores: `Dapur Satu Data Kajian` and `General`.
- The three-day observation window now has three consecutive fresh workflow artifacts with non-`needs_setup`, non-`error` status.
- The live dashboard limits visible promotion candidates to a 5-topic Track B sample, keeping the spike observable without promoting all mapped topics into the main registry.

### Guardrails
- Keep the auth spike workflow isolated.
- Keep group-level fallback as the production baseline.
- Keep only a 5-topic Track B sample visible in the live dashboard for now; do not bulk-promote all 77 mapped topics into `data/sources.json`.
- Require explicit review before any sampled topic is promoted from Track B into the main registry.
- Maintain secret rotation/re-bootstrap runbook before integrating authenticated freshness into the main checker path.

## 8) Follow-up Tasks
1. Watch for newly appearing unmapped topics and classify them as mapped region, `online`, or ignored.
2. Decide whether the current ignored-topic policy is sufficient before integration into the main checker.
3. Draft a secret rotation/re-bootstrap runbook before moving authenticated freshness into production.
