# Release Room

Evidence-backed go/no-go release system for small AI-native startup teams.

This repository is the **private MVP foundation** (SHE-58): App Router app shell,
owner auth boundary, local database adapter, seeded demo workspace, tests, and CI.

## Quickstart

```bash
cp .env.example .env.local
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Sign in with the owner
credentials from `.env.example`.

## Scripts

| Command                           | Purpose                                  |
| --------------------------------- | ---------------------------------------- |
| `npm run dev`                     | Next.js dev server (Turbopack)           |
| `npm run lint`                    | ESLint                                   |
| `npm run typecheck`               | TypeScript `--noEmit`                    |
| `npm run format` / `format:check` | Prettier                                 |
| `npm run test`                    | Vitest unit tests                        |
| `npm run test:e2e`                | Playwright end-to-end tests              |
| `npm run build`                   | Production build                         |
| `npm run db:seed`                 | Reset local DB to seeded demo workspace  |
| `npm run ci`                      | format + lint + typecheck + unit + build |

## Architecture notes

- **Auth:** single private owner via email/password env vars and signed HTTP-only session cookie.
- **Database:** `DATABASE_ADAPTER=local` writes `${DATA_DIR}/local-db.json` with zero cloud credentials. Production Postgres path is documented in `docs/database.md`.
- **Policy:** `lib/policy/decision.ts` recomputes READY / BLOCKED / PENDING from evidence.
- **UI primitives:** accessible native controls in `components/ui` (no heavy component library).

## Acceptance (foundation)

From a clean clone with `.env.local` copied from `.env.example`:

```bash
npm install
npm run lint
npm run typecheck
npm run test
npm run build
```

Playwright: `npx playwright install chromium && npm run test:e2e`
