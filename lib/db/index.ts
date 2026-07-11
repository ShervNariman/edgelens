import { createLocalDatabase } from "@/lib/db/local";
import { createPostgresDatabase } from "@/lib/db/postgres";
import type { Database } from "@/lib/db/types";
import { getEnv } from "@/lib/env";

let cached: Database | null = null;

export function getDatabase(): Database {
  if (cached) {
    return cached;
  }

  const env = getEnv();
  cached =
    env.DATABASE_ADAPTER === "postgres"
      ? createPostgresDatabase(env.DATABASE_URL)
      : createLocalDatabase({
          dataDir: env.DATA_DIR,
          ownerEmail: env.OWNER_EMAIL,
        });

  return cached;
}

/** Test helper — drops the memoized database handle. */
export function resetDatabaseCache(): void {
  cached = null;
}
