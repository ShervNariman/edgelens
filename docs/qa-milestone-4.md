# SHE-153 five-loop QA — SaaS-grade UX refinement

Milestone 4 acceptance evidence. Each loop lists defects found and fixed (not
pass-only statements).

## Loop 1 — Information architecture & copy

**Found**
- Analyzer intro repeated the hero tagline instead of describing the workflow.
- Source / preview / report headings were inconsistent (`h2`/`p`/`h3` mix).
- No default-mode progressive disclosure of Source → Preview → Findings → Fixes.
- Limitation copy duplicated under every report and in the page aside.
- Product strings scattered across panels.

**Fixed**
- Centralized `ANALYZER_COPY`, `WORKFLOW_STEPS`, `PREVIEW_STATE_GUIDANCE`, meta
  strings in `lib/product-copy.ts`.
- Workflow jump nav on the analyzer surface; semantic section landmarks with
  matching headings.
- Single page-level limitation aside (removed report duplicate).
- Recording mode kept separate (stripped chrome, auto-analyze, no footer).

## Loop 2 — Interaction quality

**Found**
- Preview DOM axe pass updated the report silently (no pending UI).
- Artificial fixed delay before analyze; large paste could block the main thread.
- No source-size guard.
- Clipboard copy had no failure path or live announcement.
- Sticky header Analyzer control lacked focus-visible styling.
- Smooth scroll ignored reduced motion.
- Layout jumped when the empty report shell (~240px) expanded.

**Fixed**
- `pendingAxe` badge + check-layer copy + polite live announcements.
- Yield-to-main before analysis; hard 80k / soft 40k source limits.
- Clipboard try/catch + legacy fallback + announcement + error alert.
- Focus-visible on header jump; reduced-motion-aware scroll helper.
- Taller empty/analyzing shells with skeleton stats to reduce CLS.
- Focus moves to report heading after Analyze completes.

## Loop 3 — Accessibility

**Found**
- No skip link; no `aria-live` for analyze / axe / copy.
- Example chips lacked `aria-pressed`.
- Simulated preview controls were in the page tab order.
- Fake dialog used `role="dialog"` without modal semantics.
- Report tabs lacked an accessible name.
- Error boundaries lacked `role="alert"`; preview retry was an unstyled button.
- Footer external links lacked “opens in new tab” names.
- No global reduced-motion policy.

**Fixed**
- Skip link in root layout; polite status region in `AnalyzerApp`.
- Example `aria-pressed`; tabs `aria-label="Analysis report layers"`.
- Preview canvas marked `inert` (axe still targets the preview root).
- Dialog preview demoted to `role="region"`.
- Error / preview boundaries announce with `role="alert"`; shared `Button`.
- Footer aria-labels; `prefers-reduced-motion` CSS kill-switch + preview class.

## Loop 4 — Responsive / zoom / visual

**Found**
- Mobile order buried preview/report under a tall source column.
- Badge/label contrast relied on dark-mode token branches on a light-only MVP.
- Placeholder GitHub URL in footer.

**Fixed**
- Mobile CSS order: Preview → Findings → Source; desktop sticky source preserved.
- Light-mode semantic text colors for state/preview badges.
- Footer points at `https://github.com/ShervNariman/edgelens`.
- Spot-check targets: 360/390, 768, 1280/1440; 200% zoom; reduced motion.

## Loop 5 — Performance, privacy, marketing proof

**Found**
- Dead runtime deps (`framer-motion`, unused Radix packages, CLI `shadcn`).
- Extra Geist Sans font load unused by body typography.
- No documented bundle/source budgets.
- `analysis_failed` / `state_forced` analytics events defined but unused.
- No milestone QA / shot-list artifacts.

**Fixed**
- Dependency trim + `optimizePackageImports` + perf budget doc.
- Emit `analysis_failed` on oversize/exception; `state_forced` on toggles.
- Recording route remains analytics-excluded; `ph-no-capture` on source textarea.
- This report + `docs/perf-budget.md` + `docs/marketing-proof-she-153.md`.
- Commands run: `npm run audit:public`, `npm run lint`, `npm run typecheck`,
  `npm run build`.

## Residual / follow-ups (non-blocking)

- Optional roving tabindex inside the force-state toolbar.
- Optional Web Worker for very large (still under-limit) parses.
- Human launch recording still captured from `/record/edgelens` after merge.
