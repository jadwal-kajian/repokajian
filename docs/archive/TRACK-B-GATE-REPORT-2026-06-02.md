# Track B Gate Report — 2026-06-02

## Summary
- Window: Day 1 attempt only
- Workflow: `check-telegram-auth-spike.yml`
- Expected branch: `phase-1.5-auth-spike`
- Run branch/SHA: `main` / `88b6e2b0d05504bedc6f9c3bcda9bb43f022500c`
- Verdict: `GO WITH GUARDRAILS` pending a valid 3-day observation window

## 1) Run Reliability
- Total GitHub workflow runs verified: 1
- Successful GitHub workflow runs verified: 1
- Success rate: 100%
- Timeout count: 0
- Retry-triggered runs: 0
- Notes: Run `26793883075` completed successfully. The freshness step succeeded on attempt 1/2.

## 2) Auth Stability
- `needs_setup` count: 0 in GitHub run
- `error` count: 0 in GitHub run
- Session re-bootstrap needed? no
- Notes: GitHub Secrets are present and the regenerated MTProto session connected successfully.

## 3) Artifact Integrity
- freshness artifact present for valid Day-1 run: yes
- mapped artifact present for valid Day-1 run: yes
- evaluated artifact present for valid Day-1 run: yes
- No message content leakage confirmed: yes
- Notes: Artifact `telegram-auth-topic-freshness` was downloaded from run `26793883075`. Downloaded artifact inspection found no raw `text` keys, no raw Telegram message payload keys, and no secret literal values.

## 4) Mapping Quality
- Day 1: total/mapped/unmapped = 79/17/62
- Day 2: total/mapped/unmapped = pending
- Day 3: total/mapped/unmapped = pending
- Top unmapped topic titles:
  1. Kajian Yogyakarta
  2. Kajian Bandung
  3. Kajian Depok
- Mapping update required? yes

## 5) Status Semantics Sanity
- Day 1 status summary: freshness `run.status = ok`; `last_post_at` resolved for 79/79 topics. Evaluator summary: `total_topics = 79`, `active = 12`, `stale = 5`, `dead = 0`, `blocked = 62`, `error = 0`
- Day 2 status summary: pending
- Day 3 status summary: pending
- Any abnormal spikes in `blocked`/`error`? `blocked = 62` is caused by unmapped topics, not timestamp resolution or auth failure.

## 6) Security & Compliance
- Secret exposed in logs: not observed locally
- Access anomaly detected: none observed locally
- Rate-limit/flood signals: none observed locally
- Actions taken: Inspected GitHub Actions run and downloaded artifacts for run `26793883075`; secret values were masked as `***`.

## 7) Decision

### Recommendation
`GO WITH GUARDRAILS`

### Rationale
- The script chain is operational for the no-secret/bootstrap path.
- GitHub Secrets are present, the regenerated MTProto session works, and the workflow produced all required artifacts.
- Topic metadata is reachable, and the updated freshness implementation resolves `last_post_at` from Telegram forum topic dates.
- Remaining `blocked` statuses are mapping-related: 62 topics are unmapped.
- Promotion to main checker should wait for three consecutive fresh workflow artifacts with non-`needs_setup`, non-`error` status.

### Guardrails
- Keep the auth spike workflow isolated.
- Do not replace group-level fallback until a valid 3-day observation window passes.
- Treat this report as Day-1 preflight, not Day-1 evidence.

## 8) Follow-up Tasks
1. Expand `topic-region-map.json` for high-priority unmapped topics.
2. Continue Day-2/Day-3 observation and compare active/stale distribution.
3. Decide whether mapping gaps require guardrails before integration into the main checker.
