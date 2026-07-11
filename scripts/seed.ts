import { getDatabase, resetDatabaseCache } from "@/lib/db";
import { getEnv, resetEnvCache } from "@/lib/env";

async function main() {
  resetEnvCache();
  resetDatabaseCache();
  const env = getEnv();
  process.env.DATA_DIR = env.DATA_DIR;
  const db = getDatabase();
  const snapshot = await db.resetToSeed();
  console.log(
    `Seeded workspace "${snapshot.workspace.name}" with ${snapshot.releases.length} release candidates at ${env.DATA_DIR}/local-db.json`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
