# EdgeLens launch assets

## Product name

EdgeLens

## Tagline

Audit the UI details AI misses.

## One-line positioning

EdgeLens is a deterministic, client-side UI auditor for AI-generated shadcn/React components that catches missing interaction states, accessibility risks, and polish gaps before they reach users.

## Core problem

AI-generated UI often looks complete in the happy path, but it can skip the details that make an interface usable in production:

- icon-only buttons without accessible names
- inputs without labels
- dialogs without titles or descriptions
- missing hover, focus-visible, disabled, loading, empty, and error states
- clickable `div` or `span` elements without keyboard support
- visual polish gaps that are easy to miss during a fast Cursor/shadcn workflow

EdgeLens gives developers a quick deterministic pass over pasted JSX/TSX so these issues are visible before review, QA, or users find them.

## Target audience

- Frontend developers using Cursor, Claude Code, v0, ChatGPT, or other AI coding tools to generate React UI.
- Indie hackers and solo builders who ship shadcn-style interfaces quickly but still want basic state and accessibility checks.
- Design engineers who want a lightweight review pass for component polish.
- Maintainers of small React apps who want examples of common UI omissions without adding a backend service or API key.

## How EdgeLens differs from SlopCheck

SlopCheck is positioned around spotting broad AI-generated product or website slop: vague copy, visual genericness, placeholder patterns, and overall launch-readiness signals.

EdgeLens is narrower and more code-adjacent:

- It audits pasted React/shadcn component code, not an entire product or marketing page.
- It focuses on interaction states, accessibility risks, and component-level polish gaps.
- It is deterministic and rule-based; it does not call an LLM or send code to an API.
- It pairs static JSX/TSX heuristics with preview-DOM checks from `axe-core` where possible.
- It is meant to sit in a frontend development loop: paste component, analyze, inspect states, apply fixes.

Short version: SlopCheck asks, “Does this product feel AI-sloppy?” EdgeLens asks, “Did this generated React component forget the UI details users depend on?”

## Launch video script, second-by-second

Target length: 45 seconds.

| Time | Visual | Voiceover / caption |
| --- | --- | --- |
| 0–3s | Show a polished-looking shadcn icon button or login form in the app. | “AI-generated UI can look done before it is done.” |
| 3–7s | Cursor-style component code appears beside the preview. | “The happy path is there, but the small interaction details are often missing.” |
| 7–11s | Paste or load the built-in icon-button example. | “EdgeLens is a tiny deterministic auditor for React and shadcn components.” |
| 11–15s | Click **Analyze**. | “Paste JSX or TSX, then run a local rule-based pass.” |
| 15–21s | Results panel highlights missing accessible name, focus, loading, and disabled handling. | “It looks for missing states, accessibility risks, and polish gaps AI tools commonly skip.” |
| 21–27s | Switch between Overview, States, Accessibility, and Fixes tabs. | “You get a focused report: what is missing, why it matters, and a practical fix direction.” |
| 27–33s | Use the preview state controls: default, hover, focus, disabled, loading, error, empty. | “You can force common UI states in the preview instead of only checking the default view.” |
| 33–38s | Show `axe-core` preview DOM checks completing. | “Preview checks run in the browser with axe-core. Your component is not sent to a backend.” |
| 38–43s | Show a small before/after snippet or fix suggestion for an icon button with `aria-label`. | “It is not a full accessibility audit. It is a fast guardrail for the details worth checking before users do.” |
| 43–45s | End card: EdgeLens — Audit the UI details AI misses. | “EdgeLens: audit the UI details AI misses.” |

## Main X launch post

AI-generated UI usually nails the happy path.

It often misses the details users actually feel:

- focus states
- disabled/loading states
- empty/error states
- icon button labels
- dialog titles/descriptions
- keyboard accessibility basics

I built EdgeLens to audit those details in shadcn/React components.

Paste JSX/TSX → Analyze → review States, Accessibility, and Fixes.

It is deterministic, rule-based, client-side, and does not call an LLM/API.

Not a full accessibility audit. Just a small guardrail for the UI details AI often skips before they reach users.

## First reply with links/install/dev command

Try it / run locally:

GitHub: `<repo link>`
Demo: `<demo link>`

```bash
npm install
npm run dev
```

Then open `http://localhost:3000`, paste a React/shadcn component, and click **Analyze**.

EdgeLens is intentionally small: static JSX/TSX rules, preview state controls, and browser-side axe-core checks for the rendered preview DOM.

## Follow-up educational code post

Small example of the kind of issue EdgeLens is built to catch:

```tsx
<Button size="icon" onClick={onSave}>
  <Save className="h-4 w-4" />
</Button>
```

This can look fine visually, but the button has no accessible name. A screen reader user may only hear “button.”

A better version:

```tsx
<Button aria-label="Save changes" size="icon" onClick={onSave}>
  <Save aria-hidden="true" className="h-4 w-4" />
</Button>
```

The broader pattern: generated UI often optimizes for what is visible in the screenshot. Before shipping, check the states and semantics that are not obvious from the default view.

## Maintainer/outreach message

Hi `<name>` — I built a small tool called EdgeLens that might be useful for people generating shadcn/React components with AI coding tools.

It is a deterministic, client-side auditor for missing UI states and common accessibility risks: focus, disabled/loading/error/empty states, icon button labels, dialog metadata, and similar polish gaps.

It does not use a backend or product-side LLM/API calls. The goal is not to replace a real accessibility review; it is a quick guardrail for the details AI-generated UI often skips.

If it seems relevant to your audience or examples, I would appreciate any feedback. No pressure to share — I mainly want to make sure the framing and checks are useful to frontend developers.

Link: `<repo or demo link>`

## Short README blurb

EdgeLens audits the UI details AI often misses in shadcn/React components. Paste JSX/TSX and get a deterministic, client-side report for missing interaction states, accessibility risks, and polish gaps, with preview state controls and browser-side axe-core checks. No backend, no database, and no product-side LLM/API calls.

## nariman.dev page outline

### Hero

- Headline: “Audit the UI details AI misses.”
- Subheadline: “EdgeLens is a deterministic UI auditor for AI-generated shadcn/React components. It catches missing states, accessibility risks, and polish gaps before they reach users.”
- Primary CTA: “Try EdgeLens”
- Secondary CTA: “View on GitHub”
- Trust/constraint line: “Rule-based · client-side · no backend · no LLM/API calls”

### Why it exists

- AI tools can generate attractive UI quickly.
- Generated components often stop at the default state.
- Real users encounter focus, loading, disabled, empty, error, and assistive-tech paths.
- EdgeLens makes those omissions visible during development.

### What it checks

- Missing hover and focus-visible affordances.
- Disabled and loading state handling for actions.
- Empty and error branches for cards/forms/lists.
- Icon-only buttons without accessible names.
- Inputs without labels.
- Dialogs missing title or description metadata.
- Clickable non-interactive elements.
- Preview DOM accessibility issues surfaced by axe-core.

### How it works

1. Paste a React/shadcn component or load an example.
2. Click **Analyze**.
3. Review Overview, States, Accessibility, and Fixes.
4. Force preview states to inspect non-happy paths.
5. Apply fixes in your editor.

### What it is not

- Not a full WCAG audit.
- Not a replacement for manual keyboard and screen reader testing.
- Not a visual regression tool.
- Not an LLM wrapper.
- Not a backend service.

### Example section

- Show an icon-only button without `aria-label`.
- Show the EdgeLens finding.
- Show the corrected version.

### CTA

- “Paste a component and check the details before you ship.”
- Links to demo, GitHub, and local dev instructions.

## What not to say / overclaiming guardrails

Avoid:

- “Fully accessible”
- “WCAG compliant”
- “Guarantees accessibility”
- “Catches every issue”
- “Production-ready audit”
- “AI-powered” or “LLM-powered”
- “Game changer”
- “Revolutionary”
- “Used by thousands” or any traction claim that is not verifiable
- “Replaces QA”
- “Replaces design review”
- “Replaces manual keyboard or screen reader testing”

Use instead:

- “deterministic”
- “rule-based”
- “client-side”
- “quick guardrail”
- “common accessibility risks”
- “missing interaction states”
- “polish gaps”
- “preview-DOM checks with axe-core”
- “not a full accessibility audit”
- “helps catch issues before review or users find them”

## Assumptions to verify before publishing

- Replace `<repo link>` and `<demo link>` with final public URLs.
- Confirm the launch video uses examples that exist in the app at launch.
- Confirm any screenshots or videos show the current UI, including the Overview, States, Accessibility, and Fixes tabs.
- Keep claims aligned with the current implementation: static JSX/TSX heuristics plus client-side preview checks, not whole-app crawling or full accessibility certification.
