import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { createSeedSnapshot, stampApproval, stampAudit } from "@/lib/db/seed";
import type {
  Approval,
  AuditEvent,
  Database,
  DatabaseSnapshot,
  ReleaseCandidate,
} from "@/lib/db/types";

async function ensureDir(dir: string): Promise<void> {
  await mkdir(dir, { recursive: true });
}

export function createLocalDatabase(options: {
  dataDir: string;
  ownerEmail: string;
}): Database {
  const filePath = path.join(options.dataDir, "local-db.json");
  let memory: DatabaseSnapshot | null = null;
  let writeQueue: Promise<void> = Promise.resolve();

  async function load(): Promise<DatabaseSnapshot> {
    if (memory) {
      return memory;
    }

    await ensureDir(options.dataDir);

    try {
      const raw = await readFile(filePath, "utf8");
      memory = JSON.parse(raw) as DatabaseSnapshot;
      return memory;
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (code !== "ENOENT") {
        throw error;
      }
      memory = createSeedSnapshot(options.ownerEmail);
      await persist(memory);
      return memory;
    }
  }

  async function persist(snapshot: DatabaseSnapshot): Promise<void> {
    memory = snapshot;
    writeQueue = writeQueue.then(async () => {
      await ensureDir(options.dataDir);
      await writeFile(filePath, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");
    });
    await writeQueue;
  }

  async function mutateRelease(
    releaseId: string,
    mutator: (release: ReleaseCandidate) => ReleaseCandidate,
  ): Promise<ReleaseCandidate> {
    const snapshot = await load();
    const index = snapshot.releases.findIndex((item) => item.id === releaseId);
    if (index < 0) {
      throw new Error(`Release candidate not found: ${releaseId}`);
    }

    const current = snapshot.releases[index];
    if (!current) {
      throw new Error(`Release candidate not found: ${releaseId}`);
    }

    const next = mutator(current);
    const releases = [...snapshot.releases];
    releases[index] = next;
    await persist({ ...snapshot, releases });
    return next;
  }

  return {
    async getWorkspace() {
      return (await load()).workspace;
    },
    async getOwner() {
      return (await load()).owner;
    },
    async listReleases() {
      const snapshot = await load();
      return [...snapshot.releases].sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
    },
    async getRelease(id) {
      const snapshot = await load();
      return snapshot.releases.find((item) => item.id === id) ?? null;
    },
    async addApproval(releaseId, input: Omit<Approval, "id" | "createdAt">) {
      const approval = stampApproval(input);
      const audit = stampAudit({
        actorEmail: input.actorEmail,
        action: input.kind === "approve" ? "approval.added" : "exception.added",
        detail: input.note,
      });

      return mutateRelease(releaseId, (release) => ({
        ...release,
        approvals: [...release.approvals, approval],
        audit: [...release.audit, audit],
        updatedAt: new Date().toISOString(),
      }));
    },
    async appendAudit(releaseId, input: Omit<AuditEvent, "id" | "at">) {
      const event = stampAudit(input);
      return mutateRelease(releaseId, (release) => ({
        ...release,
        audit: [...release.audit, event],
        updatedAt: new Date().toISOString(),
      }));
    },
    async updateRelease(releaseId, updater) {
      return mutateRelease(releaseId, updater);
    },
    async resetToSeed() {
      const snapshot = createSeedSnapshot(options.ownerEmail);
      await persist(snapshot);
      return snapshot;
    },
  };
}
