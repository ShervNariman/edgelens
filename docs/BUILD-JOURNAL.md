# EdgeLens build journal

Decisions, failures, workarounds, and milestones. Keep entries short and dated.

## 2026-07 — MVP construction

### Milestones

- **Parser + rules** — `@babel/parser` static pass for state completeness, a11y heuristics, and shadcn/Radix patterns.
- **Preview + axe** — simulated preview DOM with optional axe-core merge; trust labels separate Static vs Preview.
- **Recording route (SHE-8)** — `/record/edgelens` chrome-stripped capture surface.
- **Positioning (SHE-19)** — state completeness hero; a11y supporting; in-app limitation copy.
- **Command center** — `COMMAND_CENTER.md` + `/internal/command-center` for sprint ops.
- **Analytics** — optional PostHog; `/record/*` excluded from activation events.
- **Marketing evidence (SHE-64)** — `/record/release-room` with seeded READY/BLOCKED scenarios, Playwright stills, ARM, this journal, `marketing/*`.

### Decisions

| Decision | Why | Tradeoff |
| --- | --- | --- |
| Client-side only | Privacy for pasted source; no backend ops | No multi-user sync or server CI yet |
| Rule-based, not LLM | Deterministic demos and trust | Narrower “smart” fix quality |
| Light mode forced | Clean launch recordings | No dark theme in MVP |
| Seeded fixtures for capture | Reproducible marketing without customer data | Examples are synthetic, not production apps |
| READY/BLOCKED metaphor on record routes | Clear go/no-go frames for launch video | EdgeLens scores components, not full releases |

### Failures / workarounds

- **Dialog preview badge overlap (SHE-13)** — badges collided with Dialog trigger; stacked above trigger.
- **State legend wording (SHE-23)** — “Sky” confused with color token; renamed to Blue.
- **axe false confidence** — preview DOM checks looked like certification; fixed with explicit Preview DOM labeling and limitation copy.
- **EBADENGINE on `@babel/*@8`** — wants Node ≥22.18; Node 22.x works; warning ignored for MVP.
- **READY fixture still flags hover/empty edge cases** — acceptable; score contrast (READY ~80 vs BLOCKED ~27) is enough for capture.

### Capture notes

- Automate: `npm run capture:screenshots` (dev server must be up).
- Manual video: `marketing/video/SHOT-LIST.md` + `NARRATION.md`.
- Never commit `.env` secrets, customer source, or raw credentials.

### Open follow-ups

- Human approve final stills/recording for public launch.
- Replace `<repo link>` / `<demo link>` placeholders in posts.
- Optional: deepen READY fixture to clear remaining hover/empty heuristics.
