# Architecture & Rationale Memorandum (ARM)

**Product:** EdgeLens  
**Status:** Private MVP / launch evidence  
**Related:** SHE-64 marketing capture system

## 1. Purpose

EdgeLens is a **rule-based, client-side** pre-flight checker for AI-generated React/shadcn components. It exists to make missing interaction states visible before ship — not to certify accessibility or replace Storybook, axe, or full QA.

## 2. Product wedge

| Priority | Layer | Role |
| --- | --- | --- |
| Hero | State completeness | loading, empty, error, disabled, focus, hover/active/selected |
| Supporting | Static JSX / shadcn | icon-only names, Dialog title/description, composition risks |
| Supporting | Preview DOM | browser-side checks (axe-core where available) on simulated preview |
| Supporting | Rule-based fixes | deterministic templates, not LLM diffs |

## 3. Architecture

```
Browser (Next.js 15 / React 19)
├── Paste / example source
├── @babel/parser → static rules (states, a11y, patterns)
├── Preview surface → optional axe-core on preview DOM
└── Report: States · Static · Preview · Fixes
```

Constraints:

- **No backend, database, or product-side LLM**
- **No secrets required** for core analysis (optional PostHog via public env only)
- Deterministic fixtures for demos and marketing (`lib/recording-scenarios.ts`)

## 4. Capture / release room

Marketing evidence must be reproducible without private customer data:

| Route | Role |
| --- | --- |
| `/record/release-room?scenario=blocked` | High-finding BLOCKED stills / video |
| `/record/release-room?scenario=ready` | Complete-states READY contrast |
| `/record/release-room?scenario=demo` | Default launch story |
| `/record/edgelens` | Legacy SHE-8 continuity |

`/record/*` suppresses product activation analytics.

## 5. Rationale — key decisions

1. **Client-side only** — trust and privacy for pasted component source; zero ops surface for MVP.
2. **State completeness as hero** — clearest differentiator vs broad a11y auditors and SlopCheck-style marketing checkers.
3. **Honest limitation copy** — avoid WCAG / “auditor” overclaims; keep launch credible.
4. **Seeded READY/BLOCKED scenarios** — marketers get deterministic go/no-go style frames without inventing product data.
5. **Playwright stills** — checklist filenames + automation so evidence regenerates from the repo.

## 6. Non-goals (MVP)

- Full WCAG certification
- Storybook / CI / VS Code integrations (roadmap later)
- Executing arbitrary pasted JSX as application code
- LLM-generated fix diffs

## 7. References

- Positioning: `lib/product-copy.ts`, `docs/launch.md`
- Build history: `docs/BUILD-JOURNAL.md`
- Capture ops: `marketing/screenshots/`, `marketing/video/`
- Operating loop: `docs/manager-loop.md`, `COMMAND_CENTER.md`
