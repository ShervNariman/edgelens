import { mkdtemp, rm, writeFile, mkdir } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { afterEach, describe, expect, it } from "vitest";

const cliEntry = path.join(process.cwd(), "cli/release-room.ts");

function runCli(args: string[], env: Record<string, string> = {}) {
  return spawnSync(
    process.execPath,
    ["--import", "tsx", cliEntry, ...args],
    {
      encoding: "utf8",
      env: {
        ...process.env,
        ...env,
      },
    },
  );
}

describe("release-room CLI integration", () => {
  const dirs: string[] = [];

  afterEach(async () => {
    await Promise.all(
      dirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })),
    );
  });

  it("prints help", () => {
    const result = runCli(["help"]);
    expect(result.status).toBe(0);
    expect(result.stdout).toContain("editor/agent evidence bridge");
  });

  it("emits offline JSON for report", () => {
    const result = runCli([
      "report",
      "--release-id",
      "rc_ready_001",
      "--editor",
      "cursor",
      "--task",
      "SHE-70 CLI integration",
      "--check",
      "lint",
      "--offline",
      "--branch",
      "cursor/she-70-editor-agent-bridge-8b2c",
      "--commit",
      "abc1234",
    ]);

    expect(result.status).toBe(0);
    const parsed = JSON.parse(result.stdout) as {
      ok: boolean;
      offline: boolean;
      payload: { kind: string; outcome: string; checksRun?: string[] };
    };
    expect(parsed.ok).toBe(true);
    expect(parsed.offline).toBe(true);
    expect(parsed.payload.kind).toBe("report");
    expect(parsed.payload.outcome).toBe("reported");
    expect(parsed.payload.checksRun).toContain("lint");
  });

  it("supports start → complete lifecycle with local state", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "rr-cli-"));
    dirs.push(dir);

    const start = runCli([
      "start",
      "--release-id",
      "rc_ready_001",
      "--editor",
      "codex",
      "--task",
      "lifecycle",
      "--state-dir",
      dir,
      "--dry-run",
    ]);
    expect(start.status).toBe(0);
    const startJson = JSON.parse(start.stdout) as { runId: string };
    expect(startJson.runId).toMatch(/^run_/);

    const complete = runCli([
      "complete",
      "--release-id",
      "rc_ready_001",
      "--run-id",
      startJson.runId,
      "--state-dir",
      dir,
      "--check",
      "typecheck",
      "--json",
    ]);
    expect(complete.status).toBe(0);
    const completeJson = JSON.parse(complete.stdout) as {
      payload: { kind: string; outcome: string; runId: string };
    };
    expect(completeJson.payload.kind).toBe("complete");
    expect(completeJson.payload.outcome).toBe("completed");
    expect(completeJson.payload.runId).toBe(startJson.runId);
  });

  it("fails clearly when release id is missing", () => {
    const result = runCli(["report", "--offline"], {
      RELEASE_ROOM_RELEASE_ID: "",
    });
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("cli_missing_release_id");
  });

  it("writes dry-run signed payloads without posting", async () => {
    const dir = await mkdtemp(path.join(os.tmpdir(), "rr-cli-"));
    dirs.push(dir);
    await mkdir(path.join(dir, "out"), { recursive: true });
    const outFile = path.join(dir, "out", "payload.json");

    const result = runCli([
      "fail",
      "--release-id",
      "rc_blocked_001",
      "--run-id",
      "run_manual_fail",
      "--state-dir",
      dir,
      "--dry-run",
      "--editor",
      "claude-code",
    ]);

    // fail without prior start should error
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("cli_missing_run");

    // seed a start state then fail
    await mkdir(path.join(dir, "runs"), { recursive: true });
    await writeFile(
      path.join(dir, "runs", "run_manual_fail.json"),
      `${JSON.stringify({
        runId: "run_manual_fail",
        releaseId: "rc_blocked_001",
        editorAgent: "claude-code",
        startedAt: "2026-07-11T12:00:00.000Z",
        task: "manual fail path",
      })}\n`,
    );

    const fail = runCli([
      "fail",
      "--release-id",
      "rc_blocked_001",
      "--run-id",
      "run_manual_fail",
      "--state-dir",
      dir,
      "--dry-run",
    ]);
    expect(fail.status).toBe(0);
    const parsed = JSON.parse(fail.stdout) as {
      dryRun: boolean;
      payload: { outcome: string };
      signatureHeader: string;
    };
    expect(parsed.dryRun).toBe(true);
    expect(parsed.payload.outcome).toBe("failed");
    expect(parsed.signatureHeader.startsWith("sha256=")).toBe(true);

    await writeFile(outFile, fail.stdout);
  });
});
