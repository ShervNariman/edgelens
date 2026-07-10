# EdgeLens launch assets

## Product name

EdgeLens

## Tagline

Pre-flight checks for the UI states AI-generated React/shadcn components often skip.

## One-line positioning

EdgeLens is a local deterministic pre-flight checker for generated React/shadcn UI. It helps catch missing loading, empty, error, disabled, focus, active, selected states and common shadcn/Radix accessibility gotchas before components ship.

## Demo story

The component looked done on the happy path until EdgeLens forced the states AI forgot.

## Core problem

AI-generated UI often looks complete in the happy path, but it can skip the states and composition details that matter in production:

- missing loading, empty, error, and disabled states
- weak or missing focus-visible, hover, active, and selected-style states
- icon-only buttons without accessible names
- Dialog/DialogTitle/DialogDescription gaps
- suspicious Radix/shadcn composition patterns

EdgeLens gives developers a quick deterministic pre-flight pass over pasted JSX/TSX so those gaps are visible before review, QA, or users find them.

## Target audience

- Frontend developers using Cursor, Claude Code, v0, ChatGPT, or other AI coding tools to generate React/shadcn UI.
- Indie hackers and solo builders who ship shadcn-style interfaces quickly and want a state-completeness sanity check.
- Design engineers who want a lightweight pre-ship pass for interaction states and common shadcn/Radix risks.
- Maintainers of small React apps who want examples of common UI omissions without adding a backend service or API key.

## How EdgeLens differs from SlopCheck

SlopCheck is positioned around spotting broad AI-generated product or website slop: vague copy, visual genericness, placeholder patterns, and overall launch-readiness signals.

EdgeLens is narrower and more code-adjacent:

- It reviews pasted React/shadcn component code, not an entire product or marketing page.
- It focuses on **state completeness** first, with supporting static JSX/shadcn and preview DOM risk checks.
- It is deterministic and rule-based; it does not call an LLM or send code to an API.
- It pairs static JSX/TSX heuristics with preview-DOM checks from `axe-core` where possible.
- It is meant to sit in a frontend development loop: paste component, analyze, force states, apply fixes.

Short version: SlopCheck asks, “Does this product feel AI-sloppy?” EdgeLens asks, “Did this generated React component forget the UI states users depend on?”

## Launch video script, second-by-second

Target length: 45 seconds.

| Time | Visual | Voiceover / caption |
| --- | --- | --- |
| 0–3s | Show a polished-looking shadcn login form or list in the default state. | “AI-generated UI can look done on the happy path.” |
| 3–7s | Cursor-style component code appears beside the preview. | “Until you force the states the model forgot.” |
| 7–11s | Load the login-form or project-list example. | “EdgeLens is a local deterministic pre-flight checker for React and shadcn.” |
| 11–15s | Click **Analyze**. | “Paste JSX or TSX, then run a client-side rule-based pass.” |
| 15–21s | States tab highlights missing loading, empty, error, disabled. | “State completeness is the hero: loading, empty, error, disabled, focus.” |
| 21–27s | Switch Static → Preview → Fixes. | “Supporting layers: static JSX/shadcn checks, preview DOM risks, copyable fixes.” |
| 27–33s | Force preview states: loading, error, empty, disabled, focus. | “The component looked done — until EdgeLens forced the states AI forgot.” |
| 33–38s | Show preview DOM checks completing. | “Preview checks run in the browser. Your component is not sent to a backend.” |
| 38–43s | Show a before/after fix snippet. | “Not a WCAG certifier. A fast pre-flight guardrail before ship.” |
| 43–45s | End card: EdgeLens — pre-flight for UI states AI skips. | “EdgeLens: catch the states before they ship.” |

## Main X launch post

AI-generated React/shadcn UI usually nails the happy path.

It often skips the states users actually hit:

- loading / empty / error
- disabled
- focus-visible
- hover / active / selected
- icon button names
- Dialog title/description gaps

I built EdgeLens as a local deterministic pre-flight checker for those gaps.

Paste JSX/TSX → Analyze → force states → review Static, Preview, and Fixes.

Rule-based. Client-side. No LLM/API.

Not a broad accessibility auditor. A sanity check for the states AI-generated components often forget.

## First reply with links/install/dev command

Try it / run locally:

GitHub: `<repo link>`
Demo: `<demo link>`

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`, paste a React/shadcn component, and click **Analyze**.

EdgeLens is intentionally narrow: state completeness, static JSX/shadcn heuristics, preview state controls, and browser-side axe-core checks on the simulated preview DOM.

## Follow-up educational code post

Small example of the kind of issue EdgeLens is built to catch:

```tsx
export function ProjectsCard({ projects }: { projects: { id: string; name: string }[] }) {
  return (
    <Card>
      <CardContent>
        {projects.map((project) => (
          <div key={project.id}>{project.name}</div>
        ))}
      </CardContent>
    </Card>
  )
}
```

Looks fine when `projects` has items. No loading, empty, or error branch.

EdgeLens forces those states in preview and flags the missing paths — the happy path looked done until the non-default states showed up.

## Maintainer/outreach message

Hi `<name>` — I built a small tool called EdgeLens that might be useful for people generating shadcn/React components with AI coding tools.

It is a deterministic, client-side pre-flight checker focused on **state completeness** (loading, empty, error, disabled, focus, and related interaction states), with supporting checks for common shadcn/Radix accessibility risks.

It does not use a backend or product-side LLM/API calls. It is not a broad accessibility auditor, WCAG checker, Storybook replacement, or axe alternative — just a local sanity check before components ship.

If it seems relevant to your audience or examples, I would appreciate any feedback. No pressure to share.

Link: `<repo or demo link>`

## Short README blurb

EdgeLens is a local deterministic pre-flight checker for generated React/shadcn UI. It helps catch missing loading, empty, error, disabled, focus, and related states — plus common shadcn/Radix accessibility gotchas — before components ship. Forced state preview, static JSX checks, preview DOM signals, and copyable rule-based fixes. No backend, no LLM/API calls.

## nariman.dev page outline

### Hero

- Brand: **EdgeLens** (hero-level)
- Headline: “Pre-flight checks for the UI states AI skips.”
- Subheadline: Launch framing one-liner (state completeness + common shadcn/Radix gotchas).
- Primary CTA: “Try EdgeLens”
- Secondary CTA: “View on GitHub”
- Trust/constraint line: “Rule-based · client-side · no backend · no LLM/API calls”

### Why it exists

- AI tools can generate attractive UI quickly.
- Generated components often stop at the default state.
- Real users encounter loading, empty, error, disabled, and focus paths.
- EdgeLens makes those omissions visible during development.

### What it checks

1. State completeness (hero)
2. Static JSX / shadcn checks
3. Preview DOM accessibility risks (supporting)
4. Rule-based fix suggestions

### How it works

1. Paste a React/shadcn component or load an example.
2. Click **Analyze**.
3. Review States, then Static, Preview, and Fixes.
4. Force preview states to inspect non-happy paths.
5. Apply fixes in your editor.

### What it is not

- Not a broad accessibility auditor
- Not a WCAG checker
- Not a Storybook replacement
- Not an axe alternative
- Not a generic React analyzer
- Not an AI code-review tool
- Not an LLM wrapper or backend service

### Example section

- Show a list/card that looks done on the happy path.
- Force empty/loading/error in EdgeLens.
- Show the finding and a copyable fix template.

### CTA

- “Force the states before you ship.”
- Links to demo, GitHub, and local dev instructions.

## What not to say / overclaiming guardrails

Avoid (forbidden / misleading):

- “first”
- “only”
- “guarantees accessibility”
- “WCAG compliant”
- “accessibility auditor”
- “axe alternative”
- “Storybook replacement”
- “catches everything”
- “Fully accessible”
- “Catches every issue”
- “Production-ready audit”
- “AI-powered” or “LLM-powered”
- “Game changer” / “Revolutionary”
- Unverified traction claims
- “Replaces QA” / “Replaces design review” / “Replaces manual keyboard or screen reader testing”

Use instead:

- “deterministic”
- “rule-based”
- “client-side”
- “pre-flight checker”
- “state completeness”
- “common accessibility risks” (supporting)
- “missing interaction states”
- “preview-DOM checks with axe-core”
- “does not certify WCAG compliance”
- “helps catch issues before they ship”

## Assumptions to verify before publishing

- Replace `<repo link>` and `<demo link>` with final public URLs.
- Confirm the launch video uses examples that exist in the app at launch.
- Confirm any screenshots or videos show States / Static / Preview / Fixes separation and limitation copy.
- Keep claims aligned with the current implementation: static JSX/TSX heuristics plus client-side preview checks, not whole-app crawling or full accessibility certification.
