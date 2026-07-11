# Live founder command center (SHE-71)

Production-polished live dashboard for the private Release Room MVP.

## Behavior

- **Snapshot endpoint:** `GET /api/internal/snapshot` returns a lightweight JSON board (KPIs, candidates, provider health, activity events).
- **Event ingest:** `POST /api/internal/events` appends webhook / editor / provider events (and optional evidence) so the activity rail updates without a page reload.
- **Visibility-aware polling:** the client polls every 5s while the tab is visible; pauses when hidden or when the founder presses Pause.
- **Freshness honesty:** last updated + next refresh are always shown. Client and server stale / degraded / provider-error states never imply fresh data.
- **Evidence-derived stages:** Intent → Engineering → Experience → Deployment → Decision come from evidence coverage, not hard-coded bars.
- **No decorative charts:** every KPI card names a decision or next action.

## Auth

Both internal routes require the same private-owner session cookie as `/app`.

## Demo

On `/app`, use **Simulate editor event** to ingest a signed-style editor evidence event. It appears on the live activity rail on the next poll (or immediately after Refresh now).

## Related v2 work

- SHE-60 / webhook agents can later replace `POST /api/internal/events` with signed provider webhooks while keeping the snapshot contract.
- SHE-72 editor bridge can POST into the same ingest shape (`kind: "editor"`).
