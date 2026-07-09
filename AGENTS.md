# EdgeLens

Rule-based, client-side web app (Next.js 15 / React 19 / TypeScript) that audits React UI
components for interaction states and accessibility issues. No backend, no database, no LLM,
no environment variables/secrets.

## Cursor Cloud specific instructions

- Single service. All logic runs client-side in the browser. Standard commands live in
  `package.json` (`dev`, `build`, `start`, `lint`).
- Dev server: `npm run dev` serves on `http://localhost:3000` (Next.js + Turbopack). Use this
  for development, not `npm run start` (which requires a prior `npm run build`).
- Lint is `npm run lint` (`eslint`). There is no automated test runner/`test` script. A manual
  smoke script exists at `scripts/smoke-examples.mts` (not wired to npm; run via `npx tsx`) that
  exercises the analysis engine over the built-in examples.
- `npm install` prints an `EBADENGINE` warning because `@babel/*@8` requests Node `>=22.18`; the
  installed Node 22.x works fine and the warning is harmless.
