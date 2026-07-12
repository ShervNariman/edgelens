/**
 * Editor/agent evidence contract — provider-neutral, retry-safe (SHE-94 / SHE-70).
 * Maps onto NormalizedEvidenceItem so backfill and live paths share semantics.
 */

import { editorEvidenceKey } from "./evidence-keys";
import type {
  IntegrationEvidenceOutcome,
  NormalizedEvidenceItem,
} from "./types";
import { IntegrationError } from "./types";

export const EDITOR_AGENTS = [
  "cursor",
  "codex",
  "claude-code",
  "script",
  "other",
] as const;
export type EditorAgent = (typeof EDITOR_AGENTS)[number];

export const EDITOR_EVENT_KINDS = [
  "start",
  "complete",
  "fail",
  "report",
] as const;
export type EditorEventKind = (typeof EDITOR_EVENT_KINDS)[number];

export const EDITOR_OUTCOMES = [
  "started",
  "completed",
  "failed",
  "reported",
] as const;
export type EditorOutcome = (typeof EDITOR_OUTCOMES)[number];

export const EDITOR_BRIDGE_LIMITS = {
  maxStringLength: 256,
  maxSummaryLength: 2000,
  maxFiles: 100,
  maxChecks: 50,
  maxMetadataKeys: 20,
} as const;

export interface EditorEvidencePayload {
  schemaVersion: 1;
  kind: EditorEventKind;
  runId: string;
  releaseId: string;
  editorAgent: EditorAgent;
  model?: string;
  task?: string;
  branch?: string;
  commit?: string;
  filesChanged?: string[];
  checksRun?: string[];
  outcome: EditorOutcome;
  elapsedMs?: number;
  capacity?: { tokens?: number; costUsd?: number; note?: string };
  metadata?: Record<string, string | number>;
  occurredAt: string;
}

const KIND_OUTCOME: Record<EditorEventKind, EditorOutcome[]> = {
  start: ["started"],
  complete: ["completed"],
  fail: ["failed"],
  report: ["reported", "completed", "failed"],
};

function asString(value: unknown, max: number = EDITOR_BRIDGE_LIMITS.maxStringLength): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, max);
}

function outcomeToIntegration(outcome: EditorOutcome): IntegrationEvidenceOutcome {
  switch (outcome) {
    case "completed":
    case "reported":
      return "pass";
    case "failed":
      return "fail";
    case "started":
    default:
      return "pending";
  }
}

/**
 * Parse and bound an editor/agent evidence payload (no zod dependency).
 */
export function parseEditorEvidencePayload(input: unknown): EditorEvidencePayload {
  if (!input || typeof input !== "object") {
    throw new IntegrationError(
      "evidence_payload_invalid",
      "Editor/agent evidence payload must be an object.",
      400
    );
  }
  const row = input as Record<string, unknown>;
  if (row.schemaVersion !== 1) {
    throw new IntegrationError(
      "evidence_payload_invalid",
      "schemaVersion must be 1.",
      400
    );
  }
  const kind = asString(row.kind);
  const outcome = asString(row.outcome);
  const runId = asString(row.runId, 128);
  const releaseId = asString(row.releaseId, 128);
  const editorAgent = asString(row.editorAgent);
  const occurredAt = asString(row.occurredAt, 64);

  if (
    !kind ||
    !EDITOR_EVENT_KINDS.includes(kind as EditorEventKind) ||
    !outcome ||
    !EDITOR_OUTCOMES.includes(outcome as EditorOutcome) ||
    !runId ||
    !releaseId ||
    !editorAgent ||
    !EDITOR_AGENTS.includes(editorAgent as EditorAgent) ||
    !occurredAt
  ) {
    throw new IntegrationError(
      "evidence_payload_invalid",
      "Editor/agent evidence payload failed validation.",
      400
    );
  }

  const allowed = KIND_OUTCOME[kind as EditorEventKind];
  if (!allowed.includes(outcome as EditorOutcome)) {
    throw new IntegrationError(
      "evidence_outcome_mismatch",
      `Outcome "${outcome}" is not valid for kind "${kind}".`,
      400
    );
  }

  const filesChanged = Array.isArray(row.filesChanged)
    ? row.filesChanged
        .filter((v): v is string => typeof v === "string")
        .slice(0, EDITOR_BRIDGE_LIMITS.maxFiles)
        .map((v) => v.slice(0, EDITOR_BRIDGE_LIMITS.maxStringLength))
    : undefined;
  const checksRun = Array.isArray(row.checksRun)
    ? row.checksRun
        .filter((v): v is string => typeof v === "string")
        .slice(0, EDITOR_BRIDGE_LIMITS.maxChecks)
        .map((v) => v.slice(0, EDITOR_BRIDGE_LIMITS.maxStringLength))
    : undefined;

  return {
    schemaVersion: 1,
    kind: kind as EditorEventKind,
    runId,
    releaseId,
    editorAgent: editorAgent as EditorAgent,
    ...(asString(row.model) ? { model: asString(row.model)! } : {}),
    ...(asString(row.task, EDITOR_BRIDGE_LIMITS.maxSummaryLength)
      ? { task: asString(row.task, EDITOR_BRIDGE_LIMITS.maxSummaryLength)! }
      : {}),
    ...(asString(row.branch) ? { branch: asString(row.branch)! } : {}),
    ...(asString(row.commit) ? { commit: asString(row.commit)! } : {}),
    ...(filesChanged?.length ? { filesChanged } : {}),
    ...(checksRun?.length ? { checksRun } : {}),
    outcome: outcome as EditorOutcome,
    ...(typeof row.elapsedMs === "number" && row.elapsedMs >= 0
      ? { elapsedMs: Math.min(row.elapsedMs, 7 * 24 * 60 * 60 * 1000) }
      : {}),
    occurredAt,
  };
}

export function editorPayloadToEvidence(
  payload: EditorEvidencePayload
): NormalizedEvidenceItem {
  const agentLabel =
    payload.editorAgent === "claude-code"
      ? "Claude Code"
      : payload.editorAgent === "script"
        ? "Local script"
        : payload.editorAgent.charAt(0).toUpperCase() + payload.editorAgent.slice(1);

  const title =
    payload.kind === "start"
      ? `${agentLabel} run started`
      : payload.kind === "complete"
        ? `${agentLabel} run completed`
        : payload.kind === "fail"
          ? `${agentLabel} run failed`
          : `${agentLabel} evidence report`;

  const parts: string[] = [];
  if (payload.task) parts.push(payload.task);
  if (payload.model) parts.push(`model ${payload.model}`);
  if (payload.branch) parts.push(`branch ${payload.branch}`);
  if (payload.commit) parts.push(`commit ${payload.commit.slice(0, 12)}`);
  if (payload.filesChanged?.length) {
    parts.push(`${payload.filesChanged.length} files changed`);
  }
  if (payload.checksRun?.length) {
    parts.push(`checks: ${payload.checksRun.join(", ")}`);
  }

  return {
    id: editorEvidenceKey(payload.runId, payload.kind),
    provider: "editor",
    category: "operations",
    outcome: outcomeToIntegration(payload.outcome),
    title,
    summary: parts.join(" · ") || `Editor/agent ${payload.outcome}`,
    externalId: `${payload.runId}:${payload.kind}`,
    sourceLinks: [],
    collectedAt: payload.occurredAt,
    metadata: {
      editorAgent: payload.editorAgent,
      kind: payload.kind,
      runId: payload.runId,
      ...(payload.elapsedMs !== undefined ? { elapsedMs: payload.elapsedMs } : {}),
    },
  };
}

/** Build a generic webhook body for editor evidence (retry-safe eventId). */
export function editorPayloadToWebhookBody(
  payload: EditorEvidencePayload
): Record<string, unknown> {
  const evidence = editorPayloadToEvidence(payload);
  return {
    eventId: evidence.id,
    provider: "editor",
    releaseId: payload.releaseId,
    occurredAt: payload.occurredAt,
    evidence: [evidence],
  };
}
