# EdgeLens

Audit the UI details AI misses — interaction states and accessibility risks for React, shadcn/ui, and Cursor-generated components.

EdgeLens is a deterministic, client-side MVP for reviewing component code before it ships. Paste or load a React example, run the analyzer, inspect the preview, and review rule-based findings without sending product code to a backend or LLM.

**MVP status:** EdgeLens is useful for local design and engineering review, but it is not a replacement for manual QA, assistive technology testing, or a formal accessibility audit.

## Screenshot placeholder

![EdgeLens screenshot placeholder](docs/screenshot-placeholder.svg)

## Why EdgeLens exists

Modern UI teams can generate component code quickly, but small interaction and accessibility details are easy to miss: disabled states, loading states, focus visibility, keyboard affordances, labels, and dialog or popover semantics. EdgeLens gives teams a fast local pass for those details so they can catch obvious risks earlier.

The project is intentionally modest: it combines static source heuristics, preview DOM checks where available, and fix templates that explain likely remediations. It aims to make review easier, not to claim complete correctness.

## What it checks

EdgeLens currently focuses on five categories:

- **Missing UI states:** Looks for common gaps around disabled, loading, empty, error, hover, focus, and active states.
- **Accessibility risks:** Flags likely labeling, role, keyboard, focus, and semantic issues using static rules and preview checks.
- **shadcn/Radix pattern issues:** Highlights suspicious usage patterns around common shadcn/ui and Radix-style primitives.
- **Preview DOM checks:** Runs browser-side checks against the rendered preview DOM where EdgeLens can safely inspect it.
- **Rule-based fixes:** Provides deterministic fix guidance and templates for common findings instead of promising perfect automated patches.

## What it does not do

EdgeLens does not overclaim its coverage:

- It **does not execute arbitrary pasted JSX** as application code.
- It **does not provide WCAG certification** or replace expert accessibility review.
- It **does not use product-side LLM/API calls**; the MVP runs locally in the browser.
- It **does not generate perfect source diffs**; fixes are rule-based suggestions and templates.
- It **does not replace manual QA** across real devices, browsers, assistive technologies, or product states.

## Quickstart

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Local development commands

```bash
npm run dev       # Start the Next.js dev server with Turbopack
npm run lint      # Run ESLint
npm run typecheck # Run TypeScript without emitting files
npm run build     # Build the production app with Turbopack
npm run start     # Serve a completed production build
```

A manual smoke script also exists for the built-in examples:

```bash
npx tsx scripts/smoke-examples.mts
```

## Typical workflow

1. Paste a React/shadcn component or load a built-in example.
2. Run the analyzer.
3. Review the Overview, States, Accessibility, and Fixes tabs.
4. Inspect the preview and force supported interaction states.
5. Apply the relevant fix guidance manually in your source code.

## Tech stack

- Next.js 15 and React 19
- TypeScript
- Tailwind CSS v4
- shadcn/ui and Radix-style primitives
- `@babel/parser` for static source parsing
- `axe-core` for preview DOM accessibility checks where available

## Architecture

EdgeLens is a single-service, client-side web app. There is no backend, database, server-side analysis service, or product-side LLM integration.

At a high level:

- **Input:** Component source is pasted into the browser or selected from local examples.
- **Static analysis:** Parser-driven rules inspect source structure and component patterns.
- **Preview analysis:** The local preview surface exposes DOM information for browser-side checks where possible.
- **Results:** Findings are grouped by overview, state coverage, accessibility risks, and fix guidance.
- **Fix templates:** Suggested fixes are deterministic snippets or explanations tied to rules, not generated source diffs.

## Roadmap

Near-term areas that would make EdgeLens more useful without changing its client-side posture:

- Broaden coverage for additional shadcn/ui and Radix interaction patterns.
- Improve confidence labels so findings are easier to triage.
- Add more built-in examples that represent realistic product components.
- Expand fix templates with before/after examples.
- Improve preview-state controls for common component variants.
- Add lightweight documentation for rule authoring.

## Contributing

Contributions are welcome, especially focused rules, examples, documentation improvements, and small UI polish. Please keep changes aligned with the current MVP constraints: deterministic checks, client-side execution, and honest accessibility claims.

## License

License placeholder. Add the final open-source license before public launch.
