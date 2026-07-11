# Cursor — editor/agent evidence bridge

Add a short rule so Cursor agents submit approved work evidence through the
generic Release Room bridge (not private session telemetry).

## Repository rule snippet

Copy into `AGENTS.md` or `.cursor/rules`:

```md
## Release Room evidence

When finishing a scoped coding task for a release candidate:

1. Run checks: `npm run lint`, `npm run typecheck`, `npm run test` (as applicable).
2. Submit evidence with the Release Room CLI:

\`\`\`bash
npm run release-room -- start \
  --release-id "$RELEASE_ROOM_RELEASE_ID" \
  --editor cursor \
  --model "$CURSOR_MODEL" \
  --task "<linear-id + short summary>"

# ... do the work ...

npm run release-room -- complete \
  --release-id "$RELEASE_ROOM_RELEASE_ID" \
  --check lint --check typecheck --check test
\`\`\`

Use `--dry-run` while validating. Never paste secrets into `--task` or metadata.
```

## One-shot terminal example

```bash
export RELEASE_ROOM_URL=http://localhost:3000
export RELEASE_ROOM_RELEASE_ID=rc_ready_001
export RELEASE_ROOM_EVIDENCE_SECRET=dev-only-evidence-secret-change-me

npm run release-room -- report \
  --editor cursor \
  --task "SHE-70 editor bridge" \
  --check lint \
  --check typecheck \
  --dry-run
```
