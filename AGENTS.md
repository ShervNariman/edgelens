# EdgeLens

Rule-based, client-side web app (Next.js 15 / React 19 / TypeScript) that runs pre-flight
checks on AI-generated React/shadcn components — state completeness first, with supporting
shadcn/Radix accessibility risk detection. No backend, database, LLM, account system, or
server-side secret is required. Optional `NEXT_PUBLIC_POSTHOG_*` values are public browser
configuration and must never contain secrets. EdgeLens is not a broad accessibility auditor,
WCAG checker, Storybook replacement, or axe alternative.

## Repository boundary

- This repository is the complete source of truth for the EdgeLens application.
- Keep the workspace single-root by opening `edgelens.code-workspace`.
- Do not copy application code, credentials, analytics identifiers, private screenshots, or
  user-submitted source between EdgeLens and Headroom, XProductInsights, sherv-website, or
  another product repository without an explicit reviewed migration.
- Grok 4.5 Very Fast is the default implementation model. Use Sonnet 5 only for difficult
  privacy or architecture work, unresolved defects, or final release QA.

## Ops / manager loop

- Sprint operating playbook: `docs/manager-loop.md`
- Human-readable dashboard: `COMMAND_CENTER.md`
- In-app snapshot: `/internal/command-center` (`lib/command-center-data.ts`)
- One Linear issue → one branch → one PR. Do not run Cursor and Codex on the same files at once.
- Coding PRs must document: `npm run audit:public`, `npm run lint`, `npm run typecheck`,
  `npm test`, `npm run test:determinism`, `npm run build`.
- Milestone 1 baseline notes: `docs/milestone-1.md`.

## Cursor Cloud specific instructions

- Single service. All analysis logic runs client-side in the browser. Standard commands live in
  `package.json` (`dev`, `build`, `start`, `lint`, `typecheck`, `audit:public`).
- Dev server: `npm run dev` serves on `http://localhost:3000` (Next.js + Turbopack). Use this
  for development, not `npm run start` (which requires a prior `npm run build`).
- A manual smoke script exists at `scripts/smoke-examples.mts` (run via `npx tsx`) and exercises
  the analysis engine over built-in examples.
- `npm install` may print an `EBADENGINE` warning because `@babel/*@8` requests Node `>=22.18`;
  use a current Node 22 release for local work.
