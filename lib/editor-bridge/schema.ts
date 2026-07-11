import { z } from "zod";
import {
  boundMetadata,
  boundStringList,
  sanitizeString,
} from "@/lib/editor-bridge/redact";
import {
  EDITOR_AGENTS,
  EDITOR_BRIDGE_LIMITS,
  EDITOR_EVENT_KINDS,
  EDITOR_OUTCOMES,
  EditorBridgeError,
  type EditorEvidencePayload,
  type EditorEventKind,
  type EditorOutcome,
} from "@/lib/editor-bridge/types";

const capacitySchema = z
  .object({
    tokens: z.number().int().nonnegative().max(1_000_000_000).optional(),
    costUsd: z.number().nonnegative().max(1_000_000).optional(),
    note: z.string().max(EDITOR_BRIDGE_LIMITS.maxStringLength).optional(),
  })
  .strict();

const rawPayloadSchema = z
  .object({
    schemaVersion: z.literal(1),
    kind: z.enum(EDITOR_EVENT_KINDS),
    runId: z.string().min(1).max(128),
    releaseId: z.string().min(1).max(128),
    editorAgent: z.enum(EDITOR_AGENTS),
    model: z.string().max(EDITOR_BRIDGE_LIMITS.maxStringLength).optional(),
    task: z.string().max(EDITOR_BRIDGE_LIMITS.maxStringLength).optional(),
    branch: z.string().max(EDITOR_BRIDGE_LIMITS.maxStringLength).optional(),
    commit: z.string().max(EDITOR_BRIDGE_LIMITS.maxStringLength).optional(),
    filesChanged: z.array(z.string()).max(EDITOR_BRIDGE_LIMITS.maxFiles).optional(),
    checksRun: z.array(z.string()).max(EDITOR_BRIDGE_LIMITS.maxChecks).optional(),
    outcome: z.enum(EDITOR_OUTCOMES),
    elapsedMs: z.number().int().nonnegative().max(7 * 24 * 60 * 60 * 1000).optional(),
    capacity: capacitySchema.optional(),
    metadata: z.record(z.union([z.string(), z.number()])).optional(),
    occurredAt: z.string().datetime({ offset: true }),
  })
  .strict();

const KIND_OUTCOME: Record<EditorEventKind, EditorOutcome[]> = {
  start: ["started"],
  complete: ["completed"],
  fail: ["failed"],
  report: ["reported", "completed", "failed"],
};

/**
 * Parse, validate, redact, and bound an editor/agent evidence payload.
 */
export function parseEditorEvidencePayload(input: unknown): EditorEvidencePayload {
  const parsed = rawPayloadSchema.safeParse(input);
  if (!parsed.success) {
    throw new EditorBridgeError(
      "evidence_payload_invalid",
      "Editor/agent evidence payload failed validation.",
      400,
      { issues: parsed.error.issues.map((issue) => issue.message) },
    );
  }

  const data = parsed.data;
  const allowed = KIND_OUTCOME[data.kind];
  if (!allowed.includes(data.outcome)) {
    throw new EditorBridgeError(
      "evidence_outcome_mismatch",
      `Outcome "${data.outcome}" is not valid for kind "${data.kind}".`,
      400,
      { kind: data.kind, outcome: data.outcome, allowed },
    );
  }

  const capacity = data.capacity
    ? {
        ...(data.capacity.tokens !== undefined
          ? { tokens: data.capacity.tokens }
          : {}),
        ...(data.capacity.costUsd !== undefined
          ? { costUsd: data.capacity.costUsd }
          : {}),
        ...(data.capacity.note
          ? { note: sanitizeString(data.capacity.note) }
          : {}),
      }
    : undefined;

  const metadata = boundMetadata(data.metadata);

  return {
    schemaVersion: 1,
    kind: data.kind,
    runId: sanitizeString(data.runId, 128),
    releaseId: sanitizeString(data.releaseId, 128),
    editorAgent: data.editorAgent,
    ...(data.model ? { model: sanitizeString(data.model) } : {}),
    ...(data.task
      ? { task: sanitizeString(data.task, EDITOR_BRIDGE_LIMITS.maxSummaryLength) }
      : {}),
    ...(data.branch ? { branch: sanitizeString(data.branch) } : {}),
    ...(data.commit ? { commit: sanitizeString(data.commit) } : {}),
    filesChanged: boundStringList(data.filesChanged, EDITOR_BRIDGE_LIMITS.maxFiles),
    checksRun: boundStringList(data.checksRun, EDITOR_BRIDGE_LIMITS.maxChecks),
    outcome: data.outcome,
    ...(data.elapsedMs !== undefined ? { elapsedMs: data.elapsedMs } : {}),
    ...(capacity && Object.keys(capacity).length > 0 ? { capacity } : {}),
    ...(metadata ? { metadata } : {}),
    occurredAt: data.occurredAt,
  };
}

export function outcomeToEvidenceStatus(
  outcome: EditorOutcome,
): "pass" | "fail" | "warn" | "info" {
  switch (outcome) {
    case "completed":
    case "reported":
      return "pass";
    case "failed":
      return "fail";
    case "started":
    default:
      return "info";
  }
}
