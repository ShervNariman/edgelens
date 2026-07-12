# EdgeLens Cursor workspace

Open `edgelens.code-workspace` from this repository root.

This is intentionally a single-product, single-root workspace. Do not add Headroom, XProductInsights, sherv-website, or another sibling repository. User-pasted component source and generated reports must remain local to the browser and must never be copied into analytics, logs, prompts, screenshots, or another product repository.

Before a change is considered complete, run:

```bash
npm run audit:public
npm run typecheck
npm run lint
npm run build
```

Use Grok 4.5 Very Fast for normal tasks. Use Sonnet 5 only for difficult privacy or architecture work, unresolved defects, or final release QA.
