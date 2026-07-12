#!/usr/bin/env node
/**
 * Retry-safe Release Room evidence CLI (Loop 1 / SHE-94).
 *
 * Usage:
 *   npm run release-room -- report --release-id rc-demo-ready --task "SHE-94" --dry-run
 *   npm run release-room -- report --release-id rc-demo-ready --offline
 */

import { createHmac, randomUUID } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

import {
  editorPayloadToWebhookBody,
  parseEditorEvidencePayload,
  type EditorAgent,
  type EditorEventKind,
  type EditorOutcome,
} from "../lib/release-room/integrations/editor";

function usage(): never {
  console.log(`Release Room evidence CLI

Commands:
  report   One-shot evidence report (default)
  start    Begin a run (persists local run id)
  complete Complete a started run
  fail     Fail a started run
  help     Show this help

Flags:
  --release-id <id>   Release candidate id (required unless RELEASE_ROOM_RELEASE_ID)
  --task <text>       Task / issue summary
  --agent <name>      cursor | codex | claude-code | script | other
  --check <name>      Repeatable check name
  --dry-run           Print signed payload without POSTing
  --offline           Print JSON only (no network)
  --json              Machine-readable output
  --run-id <id>       Explicit run id (for complete/fail retry)
  --url <base>        API base (default RELEASE_ROOM_URL or http://localhost:3000)
`);
  process.exit(0);
}

function argValue(args: string[], name: string): string | null {
  const idx = args.indexOf(name);
  if (idx === -1) return null;
  return args[idx + 1] ?? null;
}

function allArgValues(args: string[], name: string): string[] {
  const values: string[] = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i] === name && args[i + 1]) values.push(args[i + 1]);
  }
  return values;
}

function hasFlag(args: string[], name: string): boolean {
  return args.includes(name);
}

function signBody(body: string, secret: string): string {
  return createHmac("sha256", secret).update(body, "utf8").digest("hex");
}

function runStatePath(runId: string): string {
  return join(process.cwd(), ".release-room", "runs", `${runId}.json`);
}

function saveRun(runId: string, data: Record<string, unknown>): void {
  const dir = join(process.cwd(), ".release-room", "runs");
  mkdirSync(dir, { recursive: true });
  writeFileSync(runStatePath(runId), JSON.stringify(data, null, 2));
}

function loadRun(runId: string): Record<string, unknown> | null {
  const path = runStatePath(runId);
  if (!existsSync(path)) return null;
  return JSON.parse(readFileSync(path, "utf8")) as Record<string, unknown>;
}

async function deliverWithRetry(
  url: string,
  body: string,
  signature: string,
  maxAttempts = 3
): Promise<{ status: number; json: unknown }> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-release-room-signature": `sha256=${signature}`,
        },
        body,
      });
      const json = await response.json().catch(() => ({}));
      if (response.status === 429 || response.status >= 500) {
        if (attempt < maxAttempts) {
          await new Promise((r) => setTimeout(r, 200 * 2 ** (attempt - 1)));
          continue;
        }
      }
      return { status: response.status, json };
    } catch (error) {
      lastError = error;
      if (attempt < maxAttempts) {
        await new Promise((r) => setTimeout(r, 200 * 2 ** (attempt - 1)));
        continue;
      }
    }
  }
  throw lastError instanceof Error
    ? lastError
    : new Error("Evidence delivery failed after retries.");
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const command = args[0] ?? "help";
  if (command === "help" || command === "--help" || command === "-h") usage();

  const kindMap: Record<string, EditorEventKind> = {
    report: "report",
    start: "start",
    complete: "complete",
    fail: "fail",
  };
  const kind = kindMap[command];
  if (!kind) usage();

  const releaseId =
    argValue(args, "--release-id") ?? process.env.RELEASE_ROOM_RELEASE_ID;
  if (!releaseId) {
    console.error("Missing --release-id (or RELEASE_ROOM_RELEASE_ID).");
    process.exit(1);
  }

  const agent = (argValue(args, "--agent") ?? "script") as EditorAgent;
  const task = argValue(args, "--task") ?? undefined;
  const checks = allArgValues(args, "--check");
  const dryRun = hasFlag(args, "--dry-run");
  const offline = hasFlag(args, "--offline");
  const asJson = hasFlag(args, "--json") || offline;
  const baseUrl =
    argValue(args, "--url") ??
    process.env.RELEASE_ROOM_URL ??
    "http://localhost:3000";

  let runId = argValue(args, "--run-id");
  if (!runId && (kind === "complete" || kind === "fail")) {
    console.error("complete/fail require --run-id (from start) for retry safety.");
    process.exit(1);
  }
  if (!runId) runId = randomUUID();

  if (kind === "complete" || kind === "fail") {
    const prior = loadRun(runId);
    if (!prior) {
      console.error(
        `No local run state for ${runId}. Re-run with the same --run-id used at start, or pass an explicit --run-id.`
      );
      process.exit(1);
    }
  }

  if (kind === "start") {
    saveRun(runId, { runId, releaseId, startedAt: new Date().toISOString() });
  }

  const outcomeMap: Record<EditorEventKind, EditorOutcome> = {
    start: "started",
    complete: "completed",
    fail: "failed",
    report: "reported",
  };

  const payload = parseEditorEvidencePayload({
    schemaVersion: 1,
    kind,
    runId,
    releaseId,
    editorAgent: agent,
    task,
    checksRun: checks.length ? checks : undefined,
    outcome: outcomeMap[kind],
    occurredAt: new Date().toISOString(),
  });

  const webhookBody = editorPayloadToWebhookBody(payload);
  const body = JSON.stringify(webhookBody);

  if (dryRun || offline) {
    const out = {
      dryRun: dryRun || offline,
      endpoint: `${baseUrl.replace(/\/$/, "")}/api/integrations/webhook`,
      eventId: webhookBody.eventId,
      payload: webhookBody,
    };
    console.log(asJson ? JSON.stringify(out, null, 2) : JSON.stringify(out, null, 2));
    return;
  }

  const secret =
    process.env.RELEASE_ROOM_EVIDENCE_SECRET ??
    process.env.RELEASE_ROOM_WEBHOOK_SECRET;
  if (!secret || secret.length < 16) {
    console.error(
      "Set RELEASE_ROOM_EVIDENCE_SECRET (or RELEASE_ROOM_WEBHOOK_SECRET) ≥16 chars."
    );
    process.exit(1);
  }

  const signature = signBody(body, secret);
  const url = `${baseUrl.replace(/\/$/, "")}/api/integrations/webhook`;
  const result = await deliverWithRetry(url, body, signature);

  if (asJson) {
    console.log(JSON.stringify({ httpStatus: result.status, body: result.json }, null, 2));
  } else {
    console.log(`HTTP ${result.status}`);
    console.log(JSON.stringify(result.json, null, 2));
  }

  if (result.status >= 400) process.exit(1);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
