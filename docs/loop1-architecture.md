# Loop 1 — Integration completeness & architecture (SHE-94)

Architecture findings, fixes, tests, and residual limits for Release Room
GitHub / Linear / Vercel / editor-agent integration flows.

## Verdict

Loop 1 is **complete enough to proceed to Loop 2** on the integration spine
branched from SHE-69, with the following delivered:

| Requirement | Status |
| --- | --- |
| Setup UX with explicit permissions + connection tests | Done — `/setup/integrations`, `/api/integrations/setup`, `/api/integrations/test` |
| Signed webhooks + replay + bounds + actionable failures | Done — provider + generic webhook parity |
| Backfill and live adapters agree on evidence semantics | Done — shared `evidence-keys.ts` |
| Release matching cannot silently attach wrong candidate | Done — unmatched/ambiguous → HTTP 422 |
| Provider health vocabulary | Done — `not_configured \| configured \| connected \| stale \| degraded \| failed` |
| Retry-safe editor CLI + generic evidence contract | Done — `npm run release-room`, `editor.ts` |
| GitHub readiness check publishing non-self-validating | Done — remains behind `GitHubCheckRunPublisher` only |
| Integration tests (happy/invalid/dup/stale/unmatched/down) | Done — `loop1.test.ts` + existing suites; CI gated |

## Architecture

```
┌──────────────┐  signed POST   ┌─────────────────────────┐
│ GitHub /     │───────────────▶│ /api/integrations/{p}   │
│ Linear /     │                │ signature → normalize   │
│ Vercel       │                │ freshness → match       │
└──────────────┘                │ idempotency → audit     │
                                └───────────┬─────────────┘
┌──────────────┐  signed POST               │
│ Editor CLI   │───────────────▶ /webhook ──┤
└──────────────┘                            ▼
┌──────────────┐                   ┌────────────────────┐
│ /refresh     │── read adapters ─▶│ NormalizedEvidence │
│ (backfill)   │                   │ + ReleaseRegistry  │
└──────────────┘                   └────────────────────┘
```

### Key modules

| Module | Role |
| --- | --- |
| `evidence-keys.ts` | Canonical ids shared by adapters + normalizers |
| `release-registry.ts` | Known release candidates |
| `release-matching.ts` | Exact / strong match; reject unmatched & ambiguous |
| `connection-state.ts` | Truthful health states |
| `connection-test.ts` | Live probes for setup UX |
| `permissions.ts` | Explicit required permission matrix |
| `editor.ts` + `cli/release-room.ts` | Retry-safe editor evidence contract |
| `provider-ingest.ts` / `webhook.ts` | Signed ingress with bounds, freshness, matching |

### Evidence id contract (backfill ≡ live)

| Kind | Canonical id |
| --- | --- |
| GitHub PR | `github:pr:{n}` |
| GitHub checks | `github:checks:{n}` (when PR resolvable) |
| Linear issue | `linear:issue:{id}` |
| Linear acceptance | `linear:ac:{id}` |
| Vercel deployment | `vercel:deployment:{id}` |
| Vercel visual | `vercel:visual:{id}` |
| Editor run | `editor:{runId}:{kind}` |

## Fixes landed in this loop

1. **Semantic drift** — Linear `linear:acceptance:` → `linear:ac:`; Vercel `preview` → `visual`; GitHub check events aggregate to `github:checks:{pr}` when PR is known.
2. **Silent mis-attachment** — provider ingest resolves against `ReleaseRegistry`; unmatched/ambiguous rejected with `release_match_unmatched` / `release_match_ambiguous`.
3. **Health honesty** — replaced `healthy/error/never` with SHE-94 vocabulary; refresh failures mark `degraded`.
4. **Generic webhook parity** — bounds, freshness, matching, audit, connection updates.
5. **Setup UX** — permissions guides + connection test API + `/setup/integrations` page.
6. **Editor CLI** — signed, idempotent, retries on 5xx/429; maps to `NormalizedEvidenceItem`.
7. **CI** — `npm run test:integrations` in GitHub Actions.

## Residual limits (explicit)

These are **accepted boundaries** entering Loop 2, not silent gaps:

1. **In-memory stores** — idempotency, audit, connection, and release registry are process-local. Restarts lose state; multi-instance deployments will diverge until durable persistence lands (Loop 2/4).
2. **No durable per-release evidence DB** — accepted webhook evidence is returned and audited, but not written to a tenant-scoped store yet.
3. **Single-tenant env config** — credentials are process env vars, not per-workspace OAuth installs.
4. **GitHub App JWT exchange deferred** — `GitHubCheckRunPublisher` enforces the install boundary and refuses PAT writes; production installation-token exchange remains incomplete and must not be treated as a readiness proof.
5. **Check publishing is non-self-validating** — publishing a check-run does not prove evidence completeness; do not use it as the sole gate.
6. **Branch topology** — SHE-58 Release Room app shell, SHE-70 editor DB ingest, SHE-71 live dashboard, and SHE-72 polish remain on divergent branches. This Loop 1 PR hardens the **integration spine** (SHE-69 lineage) and portable editor contract; full UI consolidation is a follow-up merge.
7. **Health for webhook-only providers** — `configured` means secret present; `connected` requires a successful event or probe. Read-token probes are separate from webhook liveness.
8. **Linear issue outcome nuance** — live read adapter still treats “title present” as intent pass; webhook uses issue state. Ids agree; outcome heuristics may still differ until a shared outcome helper is adopted in Loop 2.

## Validation

```bash
npm run test:integrations
npm run lint
npm run typecheck
npm run build
```

Manual:

- `/setup/integrations` — permissions + test links
- `GET /api/integrations/health` — modes + connections
- `GET /api/integrations/test` — connection probes
- `npm run release-room -- report --release-id rc-demo-ready --dry-run`

## Recommendation

**Proceed to Loop 2 (security & data-integrity)** focusing on durable stores, secret handling hardening, tenant boundaries, and App JWT token exchange — without weakening the matching / health / evidence contracts established here.
