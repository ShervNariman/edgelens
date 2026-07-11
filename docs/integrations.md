# Release Room integrations (SHE-60)

Adapter boundaries for GitHub, Linear, Vercel, and generic signed webhook evidence ingestion.

## Behavior

- **No credentials** → fixture/demo adapters return seeded evidence immediately.
- **Credentials present** → live providers activate through environment variables with **no application code changes**.
- **Webhook secret missing** → ingestion endpoint fails closed (`503`).
- **Invalid signature** → rejected (`401`) without leaking secrets.
- **Duplicate `eventId`** → idempotent replay returns the prior accepted evidence.

## Environment variables

Copy into `.env.local` as needed:

```bash
# Force fixtures even when live tokens exist (useful for demos/tests)
RELEASE_ROOM_FORCE_FIXTURES=false

# GitHub — repository / PR / changed files / checks / reviews
GITHUB_TOKEN=
GITHUB_OWNER=
GITHUB_REPO=
# GH_TOKEN is accepted as an alias for GITHUB_TOKEN

# Linear — issue intent + acceptance-criteria checkboxes in the description
LINEAR_API_KEY=
LINEAR_TEAM_ID=

# Vercel — deployment / preview evidence
VERCEL_TOKEN=
VERCEL_TEAM_ID=
VERCEL_PROJECT_ID=

# Generic signed webhook ingestion
RELEASE_ROOM_WEBHOOK_SECRET=
```

## HTTP endpoints

### `GET|POST /api/integrations/refresh`

Refreshes evidence for a release candidate.

- `GET` refreshes the seeded ready release from fixtures (or live providers when configured).
- `POST` accepts an optional body:

```json
{
  "seed": "ready",
  "release": {
    "id": "rc-demo-ready",
    "repository": "acme/release-room",
    "prNumber": 42,
    "linearIssueId": "SHE-60",
    "vercelProjectId": "prj_fixture"
  }
}
```

Response includes normalized evidence plus `decisionEvidence` and `uiEvidence` mappings for the decision engine (SHE-59) and product UI (SHE-61).

### `POST /api/integrations/webhook`

Signed evidence ingestion.

Headers:

- `content-type: application/json`
- `x-release-room-signature: sha256=<hmac-sha256-hex-of-raw-body>`

Body (minimal):

```json
{
  "eventId": "evt_123",
  "provider": "webhook",
  "releaseId": "rc-demo-ready",
  "title": "Manual QA passed",
  "summary": "Founder signed off on preview.",
  "category": "approval",
  "outcome": "pass",
  "externalId": "qa-1",
  "sourceLinks": [{ "label": "Notes", "url": "https://example.com/qa" }]
}
```

Or provide `evidence: NormalizedEvidenceItem[]`.

## Programmatic API

```ts
import {
  refreshReleaseEvidence,
  SEEDED_RELEASE,
  ingestSignedWebhook,
  signPayload,
} from "@/lib/release-room/integrations";

const refreshed = await refreshReleaseEvidence({ release: SEEDED_RELEASE });
```

## Tests

```bash
npm run test:integrations
```

## Acceptance mapping

| Requirement | Implementation |
| --- | --- |
| GitHub adapter | `adapters/github.ts` |
| Linear adapter | `adapters/linear.ts` |
| Vercel adapter | `adapters/vercel.ts` |
| Signed webhook endpoint | `app/api/integrations/webhook/route.ts` |
| Fixture adapters | default when credentials absent; `FixtureAdapter` |
| Idempotent events + source links | `idempotency.ts`, fixture/live evidence `sourceLinks` |
| Secret validation / secure failure | `secrets.ts`, fail-closed live adapters |
| Env activation without code changes | `config.ts` + `createAdaptersForEnv()` |
