# Milestone 1 report — production baseline

**Issue:** SHE-148  
**Scope:** Trustworthy production baseline before expanding product scope  
**Repo:** `ShervNariman/edgelens` only  

## Outcome

EdgeLens now has a minimal Vitest harness, example smoke and five-repeat determinism commands, CI coverage for those checks, narrow CodeQL + Dependabot, MIT licensing, README truth fixes, and extended runtime isolation against MotionGuard / Release Room leakage.

## Delivered

| Item | Result |
| --- | --- |
| Test stack | Vitest 3 + focused `*.test.ts` for parser, state/a11y/pattern rules, fixes, scoring/grouping, invalid recovery, all built-in examples |
| Smoke command | `npm run smoke` → `tsx scripts/smoke-examples.mts` (no unpinned `npx`) |
| Determinism | `npm run test:determinism` → five repeats; compares stable fingerprints (strips `id` / `analyzedAt`) |
| CI | `audit:public`, typecheck, lint, `test`, `test:determinism`, `smoke`, `build` |
| CodeQL | Weekly + PR/push on `main`; JS/TS only; `security-extended`; read + `security-events: write` |
| Dependabot | Weekly npm + github-actions; grouped minor/patch; low PR limits |
| Isolation | Runtime scan adds MotionGuard / Release Room / XProductInsights / sherv-website forms; docs/history excluded |
| License | MIT `LICENSE` + README |
| README asset | `docs/assets/edgelens-analyzer.svg` (SVG product mock; photo follow-up noted) |
| Unused deps | Removed unused `@radix-ui/*`, `framer-motion`, and `shadcn` CLI after proving no app imports |

## Required validation commands

```bash
npm ci
npm run audit:public
npm run typecheck
npm run lint
npm test
npm run test:determinism
npm run build
```

## Residual risks / follow-ups

1. Replace the SVG product mock with an approved `/record/edgelens` screenshot when available.
2. Historical wrong-repo remote branches still exist; isolation now guards **runtime** paths only (by design).
3. CodeQL needs GitHub Advanced Security / default setup permissions on the org/repo to upload results.
4. `@babel/*@8` still warns `EBADENGINE` on Node `<22.18`; use Node 22.18+ locally when practical.
5. No browser E2E automation in this milestone — manual smoke of `/`, `/analyzer`, `/record/edgelens` remains a human/QA loop step.

## Product constraints preserved

- No backend, database, accounts, or product-side LLM/API calls
- Deterministic client-side analysis only
- State completeness remains the hero feature
- Accessibility is supporting risk evidence (no WCAG certification claims)
- Recording routes stay analytics-excluded; pasted source never enters analytics payloads
