#!/usr/bin/env node
/**
 * release-room CLI — editor/agent evidence bridge.
 *
 * Commands: report | start | complete | fail
 * Modes: --dry-run (signed payload, no POST) | --offline / --json (JSON only)
 */

import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import {
  deliverEditorEvidence,
  parseEditorEvidencePayload,
  type EditorAgent,
  type EditorEventKind,
  type EditorEvidencePayload,
  type EditorOutcome,
  EditorBridgeError,
  EDITOR_AGENTS,
} from "../lib/editor-bridge";

interface CliArgs {
  command: EditorEventKind | "help" | "version";
  releaseId?: string;
  runId?: string;
  editorAgent: EditorAgent;
  model?: string;
  task?: string;
  branch?: string;
  commit?: string;
  files: string[];
  checks: string[];
  elapsedMs?: number;
  tokens?: number;
  costUsd?: number;
  capacityNote?: string;
  endpoint?: string;
  secret?: string;
  stateDir: string;
  dryRun: boolean;
  offline: boolean;
  json: boolean;
  help: boolean;
}

interface RunState {
  runId: string;
  releaseId: string;
  editorAgent: EditorAgent;
  startedAt: string;
  model?: string;
  task?: string;
}

const DEFAULT_STATE_DIR = path.join(process.cwd(), ".release-room");

function printHelp(): void {
  process.stdout.write(`release-room — editor/agent evidence bridge

Usage:
  release-room <command> [options]

Commands:
  report      One-shot evidence report (outcome=reported)
  start       Mark an editor/agent run as started
  complete    Mark a started run as completed
  fail        Mark a started run as failed
  help        Show this help
  version     Print CLI version

Options:
  --release-id <id>     Target release candidate (or RELEASE_ROOM_RELEASE_ID)
  --run-id <id>         Stable run id (auto-generated for start/report)
  --editor <name>       cursor | codex | claude-code | script | other (default: cursor)
  --model <name>        Model identifier
  --task <text>         Task / issue summary
  --branch <name>       Git branch (auto-detected when omitted)
  --commit <sha>        Git commit (auto-detected when omitted)
  --file <path>         Changed file (repeatable)
  --check <name>        Check run name (repeatable)
  --elapsed-ms <n>      Wall time in milliseconds
  --tokens <n>          Optional token estimate
  --cost-usd <n>        Optional cost estimate
  --capacity-note <t>   Optional capacity note
  --endpoint <url>      Evidence URL (default: $RELEASE_ROOM_URL/api/evidence)
  --secret <value>      HMAC secret (or RELEASE_ROOM_EVIDENCE_SECRET)
  --state-dir <path>    Local run state directory (default: ./.release-room)
  --dry-run             Sign and print payload without POSTing
  --offline             Offline JSON output (no network)
  --json                Alias for --offline machine-readable output
  -h, --help            Show help

Environment:
  RELEASE_ROOM_URL                 Base app URL (default http://localhost:3000)
  RELEASE_ROOM_RELEASE_ID          Default release candidate id
  RELEASE_ROOM_EVIDENCE_SECRET     Shared HMAC secret
`);
}

function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = {
    command: "help",
    editorAgent: "cursor",
    files: [],
    checks: [],
    stateDir: process.env.RELEASE_ROOM_STATE_DIR || DEFAULT_STATE_DIR,
    dryRun: false,
    offline: false,
    json: false,
    help: false,
  };

  if (argv.length === 0) {
    args.help = true;
    return args;
  }

  const [command, ...rest] = argv;
  if (
    command === "report" ||
    command === "start" ||
    command === "complete" ||
    command === "fail" ||
    command === "help" ||
    command === "version"
  ) {
    args.command = command;
  } else if (command === "-h" || command === "--help") {
    args.help = true;
    args.command = "help";
    return args;
  } else {
    throw new EditorBridgeError(
      "cli_unknown_command",
      `Unknown command "${command}". Use report|start|complete|fail.`,
      400,
    );
  }

  for (let i = 0; i < rest.length; i += 1) {
    const token = rest[i];
    if (!token) continue;
    const next = rest[i + 1];

    const take = (flag: string): string => {
      if (!next || next.startsWith("--")) {
        throw new EditorBridgeError(
          "cli_missing_value",
          `Flag ${flag} requires a value.`,
          400,
        );
      }
      i += 1;
      return next;
    };

    switch (token) {
      case "--release-id":
        args.releaseId = take(token);
        break;
      case "--run-id":
        args.runId = take(token);
        break;
      case "--editor": {
        const value = take(token);
        if (!(EDITOR_AGENTS as readonly string[]).includes(value)) {
          throw new EditorBridgeError(
            "cli_invalid_editor",
            `Unknown editor "${value}". Expected one of: ${EDITOR_AGENTS.join(", ")}.`,
            400,
          );
        }
        args.editorAgent = value as EditorAgent;
        break;
      }
      case "--model":
        args.model = take(token);
        break;
      case "--task":
        args.task = take(token);
        break;
      case "--branch":
        args.branch = take(token);
        break;
      case "--commit":
        args.commit = take(token);
        break;
      case "--file":
        args.files.push(take(token));
        break;
      case "--check":
        args.checks.push(take(token));
        break;
      case "--elapsed-ms":
        args.elapsedMs = Number(take(token));
        break;
      case "--tokens":
        args.tokens = Number(take(token));
        break;
      case "--cost-usd":
        args.costUsd = Number(take(token));
        break;
      case "--capacity-note":
        args.capacityNote = take(token);
        break;
      case "--endpoint":
        args.endpoint = take(token);
        break;
      case "--secret":
        args.secret = take(token);
        break;
      case "--state-dir":
        args.stateDir = take(token);
        break;
      case "--dry-run":
        args.dryRun = true;
        break;
      case "--offline":
        args.offline = true;
        break;
      case "--json":
        args.json = true;
        args.offline = true;
        break;
      case "-h":
      case "--help":
        args.help = true;
        break;
      default:
        throw new EditorBridgeError(
          "cli_unknown_flag",
          `Unknown flag "${token}".`,
          400,
        );
    }
  }

  return args;
}

function git(gitArgs: string[]): string | undefined {
  const result = spawnSync("git", gitArgs, { encoding: "utf8" });
  if (result.status !== 0) {
    return undefined;
  }
  return result.stdout.trim() || undefined;
}

function detectBranch(): string | undefined {
  return git(["rev-parse", "--abbrev-ref", "HEAD"]);
}

function detectCommit(): string | undefined {
  return git(["rev-parse", "HEAD"]);
}

function detectFiles(): string[] {
  const status = spawnSync("git", ["status", "--porcelain"], { encoding: "utf8" });
  if (status.status === 0 && status.stdout.trim()) {
    return status.stdout
      .split("\n")
      .map((line) => line.slice(3).trim())
      .filter(Boolean);
  }
  return [];
}

function runStatePath(stateDir: string, runId: string): string {
  return path.join(stateDir, "runs", `${runId}.json`);
}

function saveRunState(stateDir: string, state: RunState): void {
  mkdirSync(path.join(stateDir, "runs"), { recursive: true });
  writeFileSync(
    runStatePath(stateDir, state.runId),
    `${JSON.stringify(state, null, 2)}\n`,
  );
}

function loadRunState(stateDir: string, runId: string): RunState | null {
  const file = runStatePath(stateDir, runId);
  if (!existsSync(file)) {
    return null;
  }
  return JSON.parse(readFileSync(file, "utf8")) as RunState;
}

function findLatestRun(stateDir: string, releaseId: string): RunState | null {
  const dir = path.join(stateDir, "runs");
  if (!existsSync(dir)) {
    return null;
  }
  let latest: RunState | null = null;
  for (const file of readdirSync(dir).filter((name) => name.endsWith(".json"))) {
    const state = JSON.parse(
      readFileSync(path.join(dir, file), "utf8"),
    ) as RunState;
    if (state.releaseId !== releaseId) continue;
    if (!latest || state.startedAt > latest.startedAt) {
      latest = state;
    }
  }
  return latest;
}

function kindToOutcome(kind: EditorEventKind): EditorOutcome {
  switch (kind) {
    case "start":
      return "started";
    case "complete":
      return "completed";
    case "fail":
      return "failed";
    case "report":
    default:
      return "reported";
  }
}

function buildPayload(args: CliArgs): EditorEvidencePayload {
  if (args.command === "help" || args.command === "version") {
    throw new EditorBridgeError("cli_invalid_command", "Not a delivery command.", 400);
  }

  const releaseId = args.releaseId || process.env.RELEASE_ROOM_RELEASE_ID || "";
  if (!releaseId) {
    throw new EditorBridgeError(
      "cli_missing_release_id",
      "Provide --release-id or set RELEASE_ROOM_RELEASE_ID.",
      400,
    );
  }

  let runId = args.runId;
  let startedAt: string | undefined;
  let model = args.model;
  let task = args.task;
  let editorAgent = args.editorAgent;

  if (args.command === "complete" || args.command === "fail") {
    const existing =
      (runId ? loadRunState(args.stateDir, runId) : null) ||
      findLatestRun(args.stateDir, releaseId);
    if (!existing) {
      throw new EditorBridgeError(
        "cli_missing_run",
        "No matching start state found. Pass --run-id from `release-room start`.",
        400,
      );
    }
    runId = existing.runId;
    startedAt = existing.startedAt;
    model = model || existing.model;
    task = task || existing.task;
    editorAgent = existing.editorAgent;
  }

  runId = runId || `run_${randomUUID().replace(/-/g, "").slice(0, 16)}`;

  const elapsedMs =
    args.elapsedMs ??
    (startedAt ? Date.now() - new Date(startedAt).getTime() : undefined);

  const files =
    args.files.length > 0
      ? args.files
      : args.command === "start"
        ? []
        : detectFiles();

  const branch = args.branch || detectBranch();
  const commit = args.commit || detectCommit();

  const raw = {
    schemaVersion: 1 as const,
    kind: args.command,
    runId,
    releaseId,
    editorAgent,
    outcome: kindToOutcome(args.command),
    occurredAt: new Date().toISOString(),
    ...(model ? { model } : {}),
    ...(task ? { task } : {}),
    ...(branch ? { branch } : {}),
    ...(commit ? { commit } : {}),
    ...(files.length ? { filesChanged: files } : {}),
    ...(args.checks.length ? { checksRun: args.checks } : {}),
    ...(elapsedMs !== undefined && Number.isFinite(elapsedMs)
      ? { elapsedMs: Math.max(0, Math.round(elapsedMs)) }
      : {}),
    ...((args.tokens !== undefined ||
      args.costUsd !== undefined ||
      args.capacityNote) && {
      capacity: {
        ...(args.tokens !== undefined ? { tokens: args.tokens } : {}),
        ...(args.costUsd !== undefined ? { costUsd: args.costUsd } : {}),
        ...(args.capacityNote ? { note: args.capacityNote } : {}),
      },
    }),
  };

  return parseEditorEvidencePayload(raw);
}

async function main(): Promise<number> {
  try {
    const args = parseArgs(process.argv.slice(2));
    if (args.help || args.command === "help") {
      printHelp();
      return 0;
    }
    if (args.command === "version") {
      process.stdout.write("release-room 0.1.0\n");
      return 0;
    }

    const payload = buildPayload(args);
    const baseUrl = (process.env.RELEASE_ROOM_URL || "http://localhost:3000").replace(
      /\/$/,
      "",
    );
    const endpoint = args.endpoint || `${baseUrl}/api/evidence`;
    const secret = args.secret || process.env.RELEASE_ROOM_EVIDENCE_SECRET || "";

    if (!args.offline && !args.dryRun && !secret) {
      throw new EditorBridgeError(
        "cli_missing_secret",
        "Provide --secret or set RELEASE_ROOM_EVIDENCE_SECRET (or use --dry-run / --offline).",
        400,
      );
    }

    if (args.command === "start") {
      saveRunState(args.stateDir, {
        runId: payload.runId,
        releaseId: payload.releaseId,
        editorAgent: payload.editorAgent,
        startedAt: payload.occurredAt,
        ...(payload.model ? { model: payload.model } : {}),
        ...(payload.task ? { task: payload.task } : {}),
      });
    }

    const result = await deliverEditorEvidence({
      endpoint,
      secret: secret || "dry-run-offline-placeholder-secret",
      payload,
      dryRun: args.dryRun,
      offline: args.offline || args.json,
    });

    process.stdout.write(
      `${JSON.stringify(
        {
          ok: result.ok,
          command: args.command,
          runId: payload.runId,
          releaseId: payload.releaseId,
          dryRun: result.dryRun,
          offline: result.offline,
          status: result.status,
          signatureHeader: result.signatureHeader,
          payload,
          response: result.body,
        },
        null,
        2,
      )}\n`,
    );
    return result.ok ? 0 : 1;
  } catch (error) {
    const payload =
      error instanceof EditorBridgeError
        ? {
            ok: false,
            error: {
              code: error.code,
              message: error.message,
              ...(error.details ? { details: error.details } : {}),
            },
          }
        : {
            ok: false,
            error: {
              code: "cli_unexpected",
              message: error instanceof Error ? error.message : String(error),
            },
          };
    process.stderr.write(`${JSON.stringify(payload, null, 2)}\n`);
    return 1;
  }
}

void main().then((code) => {
  process.exit(code);
});
