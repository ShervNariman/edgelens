# MotionGuard SHE-116 handoff

This branch packages MotionGuard Milestone 2 (SHE-116) for review because the cloud agent
token cannot push to `ShervNariman/MotionGuard` (HTTP 403).

- Intended repository: https://github.com/ShervNariman/MotionGuard
- Intended base: `agent/foundation-governance` (PR #1) or `main` after foundation merges
- Do not merge this branch into EdgeLens `main`

To publish upstream:

```bash
git remote add motionguard git@github.com:ShervNariman/MotionGuard.git
git push motionguard HEAD:cursor/she-116-motion-scenarios-18bf
```
