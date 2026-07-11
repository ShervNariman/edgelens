# Editor/agent evidence bridge

Provider-neutral bridge for **approved work evidence** from any code editor or
coding agent (Cursor, Codex, Claude Code, local scripts). This is **not** a deep
Cursor telemetry integration.

## What it captures

Signed payloads may include:

| Field | Purpose |
| --- | --- |
| `editorAgent` | `cursor` \| `codex` \| `claude-code` \| `script` \| `other` |
| `model` | Optional model id |
| `task` | Task / issue summary |
| `branch` / `commit` | Git context |
| `filesChanged` | Bounded file list |
| `checksRun` | Checks the agent ran |
| `outcome` | `started` \| `completed` \| `failed` \| `reported` |
| `elapsedMs` | Wall time |
| `capacity` | Optional tokens / cost / note |

Secrets are redacted client-side and again on ingest. Metadata is bounded.

## Commands

```bash
npm run release-room -- help

# One-shot report (dry-run)
npm run release-room -- report \
  --release-id rc_ready_001 \
  --task "SHE-70 editor bridge" \
  --check lint --check typecheck \
  --dry-run

# Lifecycle
npm run release-room -- start --release-id rc_ready_001 --task "SHE-70"
npm run release-room -- complete --release-id rc_ready_001 --check test
# or
npm run release-room -- fail --release-id rc_ready_001
```

Offline / machine-readable JSON (no network):

```bash
npm run release-room -- report --release-id rc_ready_001 --offline
npm run release-room -- report --release-id rc_ready_001 --json
```

## Endpoint

`POST /api/evidence`

Headers:

- `content-type: application/json`
- `x-release-room-signature: sha256=<hmac-sha256-hex>`

The signature covers the exact request body bytes. Use the shared secret
`RELEASE_ROOM_EVIDENCE_SECRET` (see `.env.example`).

Successful ingest:

1. Appends an `editor` evidence item (engineering evidence)
2. Appends an `editor.<kind>` audit timeline entry
3. Recomputes the release decision

## Environment

| Variable | Role |
| --- | --- |
| `RELEASE_ROOM_EVIDENCE_SECRET` | HMAC shared secret (server + CLI) |
| `RELEASE_ROOM_URL` | CLI base URL (default `http://localhost:3000`) |
| `RELEASE_ROOM_RELEASE_ID` | Optional default release id for CLI |

## Examples

- Cursor: [`examples/editor-bridge/cursor.md`](../examples/editor-bridge/cursor.md)
- Codex: [`examples/editor-bridge/codex.md`](../examples/editor-bridge/codex.md)
- Claude Code: [`examples/editor-bridge/claude-code.md`](../examples/editor-bridge/claude-code.md)
