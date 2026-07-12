# EdgeLens performance budgets (SHE-153)

Deterministic client-side analysis must stay responsive. Budgets below are
engineering targets for the production build — not marketing claims.

## Source input

| Limit | Value | Behavior |
| --- | --- | --- |
| Soft warning | 40,000 characters | Inline warning; Analyze still allowed |
| Hard limit | 80,000 characters | Analyze disabled; clear error + `analysis_failed` |

Constants live in `lib/source-limits.ts`.

## Main-thread analysis

- Analyze yields via `requestIdleCallback` / `setTimeout(0)` before running
  `analyzeComponent` (`lib/yield-main.ts`).
- axe-core is dynamically imported (`lib/axe-runner.ts`) and runs after the
  static pass; preview DOM pending state is visible and announced.
- Preview meta is memoized; forced-state toggles do not re-parse source on every
  unrelated render.

## Bundle / route budgets

Measured with `npm run build` (Next.js route First Load JS). Re-measure after
dependency changes.

**Baseline after SHE-153 (this branch):** `/`, `/analyzer`, and
`/record/edgelens` report **275 kB** First Load JS; shared JS **181 kB**.

| Route | Budget (First Load JS) | Notes |
| --- | --- | --- |
| `/` | ≤ 290 kB | Stay near the SHE-153 baseline; investigate regressions > +10% |
| `/analyzer` | ≤ 290 kB | Same client shell as home |
| `/record/edgelens` | ≤ 290 kB | Recording chrome only; analytics excluded |
| Lazy axe chunk | Loaded only after Analyze | Must not ship on the critical path |

### Hygiene already applied

- Removed unused runtime deps: `framer-motion`, unused `@radix-ui/*`, moved
  `shadcn` CLI to `devDependencies`.
- Dropped unused Geist Sans font load (IBM Plex Sans + Geist Mono remain).
- `experimental.optimizePackageImports: ["lucide-react"]` in `next.config.ts`.

## Acceptance checks

1. `npm run build` completes without warnings that imply accidental SSR of axe.
2. Analyzing a built-in example does not freeze scrolling/typing for > ~200ms
   of perceived jank on a mid-tier laptop.
3. Pasting > 80k characters refuses Analyze with an accessible error.
4. Recording route remains analytics-excluded (`/record/*`).
