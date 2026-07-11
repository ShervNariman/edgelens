# Release Room integrations (SHE-60 + SHE-69)

Adapter boundaries for GitHub, Linear, Vercel, and authenticated webhook evidence ingestion.

## Behavior

- **No credentials** → fixture/demo adapters return seeded evidence immediately (recovery/backfill still works via refresh).
- **Credentials present** → live read providers activate through environment variables with **no application code changes**.
- **Provider webhook secret missing** → that provider's webhook route fails closed (`503`).
- **Invalid signature** → rejected (`401`) without leaking secrets.
- **Duplicate delivery id** → idempotent replay returns the prior accepted evidence.
- **Stale event** → rejected (`409`) when the provider timestamp is outside the replay window.
- **Oversized payload** → rejected (`413`) when the body exceeds the configured byte limit.
- **GitHub check-run publishing** → gated behind `GitHubCheckRunPublisher` and requires GitHub App installation credentials.

## Environment variables

Copy into `.env.local` as needed:

```bash
# Force fixtures even when live tokens exist (useful for demos/tests)
RELEASE_ROOM_FORCE_FIXTURES=false

# GitHub — repository / PR / changed files / checks / reviews (read / backfill)
GITHUB_TOKEN=
GITHUB_OWNER=
GITHUB_REPO=
# GH_TOKEN is accepted as an alias for GITHUB_TOKEN
GITHUB_WEBHOOK_SECRET=
# GitHub App — required only for check-run publishing writes
GITHUB_APP_ID=
GITHUB_APP_INSTALLATION_ID=
GITHUB_APP_PRIVATE_KEY=

# Linear — issue intent + acceptance-criteria checkboxes
LINEAR_API_KEY=
LINEAR_TEAM_ID=
LINEAR_WEBHOOK_SECRET=

# Vercel — deployment / preview evidence
VERCEL_TOKEN=
VERCEL_TEAM_ID=
VERCEL_PROJECT_ID=
VERCEL_WEBHOOK_SECRET=

# Generic signed webhook ingestion (manual evidence)
RELEASE_ROOM_WEBHOOK_SECRET=

# Optional limits
RELEASE_ROOM_WEBHOOK_MAX_BODY_BYTES=1048576
RELEASE_ROOM_WEBHOOK_MAX_AGE_SECONDS=300
```

## HTTP endpoints

### `GET|POST /api/integrations/refresh`

Manual read/backfill path. Refreshes evidence for a release candidate from GitHub/Linear/Vercel adapters (or fixtures).

### `POST /api/integrations/github`

GitHub App-ready webhook ingress.

Headers:

- `X-Hub-Signature-256: sha256=<hmac-sha256-hex>`
- `X-GitHub-Delivery: <uuid>` (idempotency key)
- `X-GitHub-Event: pull_request | check_suite | check_run | pull_request_review | push`

### `POST /api/integrations/linear`

Headers:

- `Linear-Signature: <hmac-sha256-hex>`
- Optional: `Linear-Delivery`, `Linear-Timestamp`

Normalizes Issue create/update payloads (including acceptance-criteria checkboxes).

### `POST /api/integrations/vercel`

Headers:

- `x-vercel-signature: <hmac-sha1-hex>`
- Optional: `x-vercel-id`

Normalizes deployment lifecycle events into deployment + preview evidence.

### `POST /api/integrations/webhook`

Generic signed evidence ingestion (SHE-60, retained).

Headers:

- `x-release-room-signature: sha256=<hmac-sha256-hex-of-raw-body>`

### `GET /api/integrations/health`

Connection freshness, last event, actionable error state, recent audit records, and provider modes.

## Common provider-event envelope

Successful provider ingest returns a `ProviderEventEnvelope`:

| Field | Meaning |
| --- | --- |
| `deliveryId` | Provider delivery / idempotency key |
| `provider` | `github` \| `linear` \| `vercel` |
| `eventType` | Native event name |
| `payloadHash` | SHA-256 of raw body (body not stored) |
| `evidence` | `NormalizedEvidenceItem[]` |
| `eventTimestamp` | Provider event time (replay protection) |

Audit records are appended for accepted, duplicate, rejected, stale, and oversized outcomes.

## Architecture boundary

GitHub **check-run publishing** stays behind `GitHubCheckRunPublisher`. Read adapters and webhook ingest do not write Checks. Publishing requires `GITHUB_APP_ID`, `GITHUB_APP_INSTALLATION_ID`, and `GITHUB_APP_PRIVATE_KEY`.

## Programmatic API

```ts
import {
  refreshReleaseEvidence,
  SEEDED_RELEASE,
  ingestProviderWebhook,
  signPayload,
  GitHubCheckRunPublisher,
} from "@/lib/release-room/integrations";

const refreshed = await refreshReleaseEvidence({ release: SEEDED_RELEASE });
```

## Tests

```bash
npm run test:integrations
```

## Acceptance mapping (SHE-69)

| Requirement | Implementation |
| --- | --- |
| GitHub webhook + `X-Hub-Signature-256` | `app/api/integrations/github/route.ts`, `validateGitHubSignature` |
| Delivery idempotency | `IdempotencyStore` keyed by `github:<X-GitHub-Delivery>` |
| PR / check suite / check run / review / push | `normalize/github.ts` |
| Linear webhook + signature + issue/update | `app/api/integrations/linear/route.ts`, `normalize/linear.ts` |
| Vercel webhook + signature + deployment lifecycle | `app/api/integrations/vercel/route.ts`, `normalize/vercel.ts` |
| Replay protection | `assertEventFreshness` |
| Oversized rejection | `assertBodyWithinLimit` |
| Provider-event envelope + audit | `ProviderEventEnvelope`, `IntegrationAuditStore` |
| Manual read adapters retained | `GitHubAdapter` / `LinearAdapter` / `VercelAdapter` + `/refresh` |
| Connection freshness / last event / errors | `ConnectionStateStore`, `/api/integrations/health` |
| Check-run publish behind adapter | `adapters/github-checks-publish.ts` |
