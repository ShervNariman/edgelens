# Marketing screenshots

Named stills for EdgeLens launch evidence. Prefer Playwright automation; fall back to manual capture from `/record/release-room`.

## Rules

- Use seeded fixtures only (`blocked`, `ready`, `demo`). Never paste customer code or secrets.
- Capture at **1440×900** (desktop) unless noted.
- Light theme only (MVP forced light mode).
- Do not include PostHog banners, browser chrome, or personal accounts in frame.
- Export PNG into `exported/` (gitignored raw intermediates may live in `raw/`).

## Checklist

| ID | Filename | Route | Notes | Status |
| --- | --- | --- | --- | --- |
| S1 | `01-hero-landing.png` | `/` | Brand-first hero, first viewport | captured |
| S2 | `02-analyzer-default.png` | `/analyzer` | Analyzer after Analyze click | captured |
| S3 | `03-blocked-overview.png` | `/record/release-room?scenario=blocked` | BLOCKED badge + findings | captured |
| S4 | `04-blocked-forced-loading.png` | same (loading forced in script) | Forced loading state in preview | captured |
| S5 | `05-ready-overview.png` | `/record/release-room?scenario=ready` | READY badge + high score | captured |
| S6 | `06-states-tab.png` | blocked scenario | State completeness layer visible | captured |
| S7 | `07-fixes-panel.png` | blocked scenario | Rule-based fix templates | captured |
| S8 | `08-demo-story.png` | `/record/release-room?scenario=demo` | Launch story frame | captured |

## Automate

```bash
npm run dev
# other terminal:
npm run capture:screenshots
```

Stills land in `marketing/screenshots/exported/`.

## Manual fallback

1. `npm run dev`
2. Open each route above in Chrome (light mode).
3. Hide bookmarks bar; use full-width window ~1440×900.
4. Wait for analysis to finish (score badge visible).
5. Save PNG with the checklist filename into `exported/`.
