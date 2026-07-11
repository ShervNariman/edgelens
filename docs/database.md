# Database adapters

Release Room keeps application code behind a small `Database` interface in
`lib/db/types.ts`.

## Local mode (default)

- `DATABASE_ADAPTER=local`
- No cloud credentials required
- Persistence file: `${DATA_DIR}/local-db.json` (default `.data/local-db.json`)
- First read seeds a private demo workspace via `lib/db/seed.ts`

Use local mode for development, unit tests, Playwright, and CI.

## Production adapter path

1. Set `DATABASE_ADAPTER=postgres` and provide `DATABASE_URL`.
2. Implement `createPostgresDatabase()` in `lib/db/postgres.ts`.
3. Add SQL migrations under `db/migrations/` (not scaffolded yet).
4. Map tables to the shared domain types (`Workspace`, `ReleaseCandidate`, …).
5. Keep method contracts identical so routes and policy code stay unchanged.

Until the Postgres adapter is implemented, production deploys should continue
using local mode only for private single-owner demos, or block deploy when
`DATABASE_ADAPTER=postgres`.
