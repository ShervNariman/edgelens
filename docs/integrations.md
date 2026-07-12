# Release Room integrations (SHE-60 + SHE-69 + SHE-94)

Adapter boundaries for GitHub, Linear, Vercel, editor/agent, and authenticated
webhook evidence ingestion.

> Loop 1 architecture findings and residual limits:
> [`docs/loop1-architecture.md`](./loop1-architecture.md)

## Behavior

- **No credentials** → fixture/demo adapters return seeded evidence immediately (recovery/backfill still works via refresh).
- **Credentials present** → live read providers activate through environment variables with **no application code changes**.
- **Provider webhook secret missing** → that provider's webhook route fails closed (`503`).
- **Invalid signature** → rejected (`401`) without leaking secrets.
- **Duplicate delivery id** → idempotent replay returns the prior accepted evidence.
- **Stale event** → rejected (`409`) when the provider timestamp is outside the replay window.
- **Oversized payload** → rejected (`413`) when the body exceeds the configured byte limit.
- **Unmatched / ambiguous release** → rejected (`422`); evidence is never silently attached to the wrong candidate.
- **GitHub check-run publishing** → gated behind `GitHubCheckRunPublisher` and requires GitHub App installation credentials (non-self-validating).

## Setup UX

1. Open [`/setup/integrations`](/setup/integrations) for required permissions per provider.
2. Copy env vars from `.env.example` into `.env.local`.
3. Run `GET /api/integrations/test` (or `?provider=github`) for connection probes.
4. Confirm `GET /api/integrations/health` shows truthful `configured` / `connected` / `stale` / `degraded` / `failed` states.
5. Register release candidates in the release registry before enabling live webhooks.

## Environment variables

```bash
RELEASE_ROOM_FORCE_FIXTURES=false

GITHUB_TOKEN=
GITHUB_OWNER=
GITHUB_REPO=
GITHUB_WEBHOOK_SECRET=
GITHUB_APP_ID=
GITHUB_APP_INSTALLATION_ID=
GITHUB_APP_PRIVATE_KEY=

LINEAR_API_KEY=
LINEAR_TEAM_ID=
LINEAR_WEBHOOK_SECRET=

VERCEL_TOKEN=
VERCEL_TEAM_ID=
VERCEL_PROJECT_ID=
VERCEL_WEBHOOK_SECRET=

RELEASE_ROOM_WEBHOOK_SECRET=
RELEASE_ROOM_EVIDENCE_SECRET=
RELEASE_ROOM_URL=http://localhost:3000
RELEASE_ROOM_RELEASE_ID=

RELEASE_ROOM_WEBHOOK_MAX_BODY_BYTES=1048576
RELEASE_ROOM_WEBHOOK_MAX_AGE_SECONDS=300
```

## HTTP endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| GET/POST | `/api/integrations/refresh` | Manual read/backfill |
| POST | `/api/integrations/github` | GitHub signed webhook |
| POST | `/api/integrations/linear` | Linear signed webhook |
| POST | `/api/integrations/vercel` | Vercel signed webhook |
| POST | `/api/integrations/webhook` | Generic / editor signed evidence |
| GET | `/api/integrations/health` | Connection + audit + modes |
| GET/POST | `/api/integrations/test` | Connection probes |
| GET | `/api/integrations/setup` | Permissions + setup guides |

## Editor / agent CLI

```bash
npm run release-room -- report \
  --release-id rc-demo-ready \
  --task "SHE-94" \
  --check lint --check typecheck \
  --dry-run
```

Retries on HTTP 5xx/429. Idempotent on `editor:{runId}:{kind}`.

## Evidence semantics

Backfill adapters and webhook normalizers share canonical ids via
`lib/release-room/integrations/evidence-keys.ts` (see Loop 1 doc).

## Tests

```bash
npm run test:integrations
```

Covers happy, invalid signature, duplicate, stale, unmatched, oversized,
provider-down, editor contract, and health vocabulary paths.
