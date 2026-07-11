# Claude Code — editor/agent evidence bridge

Same provider-neutral CLI and signed evidence endpoint.

## Example

```bash
export RELEASE_ROOM_URL=http://localhost:3000
export RELEASE_ROOM_RELEASE_ID=rc_ready_001
export RELEASE_ROOM_EVIDENCE_SECRET=dev-only-evidence-secret-change-me

npm run release-room -- start \
  --editor claude-code \
  --model claude-opus-4 \
  --task "SHE-70 fail-path evidence"

# if the run cannot finish cleanly:
npm run release-room -- fail \
  --task "blocked on missing secret" \
  --capacity-note "retry after rotating RELEASE_ROOM_EVIDENCE_SECRET"
```

Dry-run a successful report:

```bash
npm run release-room -- report \
  --editor claude-code \
  --check test \
  --elapsed-ms 42000 \
  --dry-run
```
