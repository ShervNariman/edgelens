# Release Room — agent execution rules

Private MVP: evidence-backed go/no-go release decisions for a single owner workspace.

## Product boundaries

- Private single-owner MVP first. Do not build multi-tenant SaaS, public signup, or billing.
- Prefer deterministic policy and fixtures over LLM calls inside the product path.
- Keep provider integrations behind adapters (GitHub, Linear, Vercel). Foundation may use fixtures.
- Local zero-credential database mode must keep working for `dev`, unit tests, e2e, and CI.
- Do not claim WCAG certification, full compliance auditing, or autonomous production deploys.

## Ownership

| Area                       | Owner           | Notes                           |
| -------------------------- | --------------- | ------------------------------- |
| App Router UI + primitives | Cursor          | `app/`, `components/`           |
| Auth / session boundary    | Cursor          | `lib/auth/`, `middleware.ts`    |
| Database adapters + seed   | Cursor          | `lib/db/`, `docs/database.md`   |
| Policy engine              | Cursor          | `lib/policy/`                   |
| CI / tests / formatting    | Cursor or Codex | `.github/`, `vitest`, `e2e/`    |
| Product copy / README      | Codex or Cursor | Keep claims narrow and accurate |
| Merge + private deploy     | Human owner     | Final go/no-go                  |

**Hard rule:** one Linear issue → one branch → one PR. Do not run Cursor and Codex on the same files at once.

## Local commands

```bash
npm install
npm run dev
npm run lint
npm run typecheck
npm run test
npm run test:e2e
npm run build
```

Coding PRs must document: `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build`.

## Cursor Cloud notes

- Single Next.js service. Default local mode needs no cloud database credentials.
- Copy `.env.example` → `.env.local` before `dev` / `build` if env vars are unset.
- `npm run test:e2e` expects Playwright Chromium (`npx playwright install chromium`).
- Dev server: `npm run dev` on `http://localhost:3000`.
