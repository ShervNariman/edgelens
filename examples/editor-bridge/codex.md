# Codex — editor/agent evidence bridge

Compatible with the same signed `/api/evidence` contract as Cursor.

## Example

```bash
export RELEASE_ROOM_URL=http://localhost:3000
export RELEASE_ROOM_RELEASE_ID=rc_ready_001
export RELEASE_ROOM_EVIDENCE_SECRET=dev-only-evidence-secret-change-me

npm run release-room -- start \
  --editor codex \
  --model o3 \
  --task "SHE-70: wire evidence CLI"

# after checks
npm run release-room -- complete \
  --editor codex \
  --check lint \
  --check typecheck \
  --file cli/release-room.ts \
  --file app/api/evidence/route.ts
```

Offline JSON for review before posting:

```bash
npm run release-room -- report --editor codex --task "docs pass" --json
```
