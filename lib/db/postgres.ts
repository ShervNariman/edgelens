import type { Database } from "@/lib/db/types";

/**
 * Production adapter path.
 *
 * Wire a Postgres-backed `Database` implementation here when
 * `DATABASE_ADAPTER=postgres` and `DATABASE_URL` are set. The local adapter
 * remains the zero-credential default for development and CI.
 *
 * Suggested shape:
 * - migrations under `db/migrations/`
 * - connection pool via `pg` or `@neondatabase/serverless`
 * - map rows to the shared types in `lib/db/types.ts`
 * - keep the same method contracts so app code stays adapter-agnostic
 */
export function createPostgresDatabase(databaseUrl: string): Database {
  void databaseUrl;
  throw new Error(
    [
      "Postgres adapter is not implemented in this foundation scaffold.",
      "Set DATABASE_ADAPTER=local for zero-credential development,",
      "or implement createPostgresDatabase() before deploying with DATABASE_ADAPTER=postgres.",
      "See docs/database.md for the production adapter path.",
    ].join(" "),
  );
}
