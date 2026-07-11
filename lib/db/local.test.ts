import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { createLocalDatabase } from "@/lib/db/local";
import { evaluateDecision } from "@/lib/policy/decision";

describe("evaluateDecision", () => {
  it("returns BLOCKED when any evidence fails", () => {
    expect(
      evaluateDecision([
        {
          id: "1",
          source: "github",
          title: "CI",
          summary: "fail",
          status: "fail",
          collectedAt: new Date().toISOString(),
        },
      ]),
    ).toBe("BLOCKED");
  });

  it("returns READY when evidence passes", () => {
    expect(
      evaluateDecision([
        {
          id: "1",
          source: "fixture",
          title: "Smoke",
          summary: "ok",
          status: "pass",
          collectedAt: new Date().toISOString(),
        },
      ]),
    ).toBe("READY");
  });
});

describe("local database", () => {
  const dirs: string[] = [];

  afterEach(async () => {
    await Promise.all(
      dirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })),
    );
  });

  it("seeds a private demo workspace and records approvals", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "rr-db-"));
    dirs.push(dir);

    const db = createLocalDatabase({
      dataDir: dir,
      ownerEmail: "owner@release-room.local",
    });

    const workspace = await db.getWorkspace();
    expect(workspace.isPrivate).toBe(true);
    expect(workspace.name).toContain("Release Room");

    const releases = await db.listReleases();
    expect(releases.length).toBeGreaterThan(0);

    const first = releases[0];
    expect(first).toBeDefined();
    if (!first) {
      throw new Error("expected seeded release");
    }

    const updated = await db.addApproval(first.id, {
      actorEmail: "owner@release-room.local",
      kind: "approve",
      note: "Ship it.",
    });

    expect(updated.approvals).toHaveLength(1);
    expect(updated.audit.at(-1)?.action).toBe("approval.added");
  });
});
