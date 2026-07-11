import { newId } from "@/lib/db/seed";
import type { AuditEvent, EvidenceItem, ReleaseCandidate } from "@/lib/db/types";
import { evaluateDecision } from "@/lib/policy/decision";
import { outcomeToEvidenceStatus } from "@/lib/editor-bridge/schema";
import { sanitizeString } from "@/lib/editor-bridge/redact";
import type { EditorEvidencePayload } from "@/lib/editor-bridge/types";

export interface EditorIngestResult {
  release: ReleaseCandidate;
  evidence: EvidenceItem;
  audit: AuditEvent;
  duplicated: boolean;
}

function buildTitle(payload: EditorEvidencePayload): string {
  const agentLabel =
    payload.editorAgent === "claude-code"
      ? "Claude Code"
      : payload.editorAgent === "script"
        ? "Local script"
        : payload.editorAgent.charAt(0).toUpperCase() + payload.editorAgent.slice(1);

  switch (payload.kind) {
    case "start":
      return `${agentLabel} run started`;
    case "complete":
      return `${agentLabel} run completed`;
    case "fail":
      return `${agentLabel} run failed`;
    case "report":
    default:
      return `${agentLabel} evidence report`;
  }
}

function buildSummary(payload: EditorEvidencePayload): string {
  const parts: string[] = [];
  if (payload.task) {
    parts.push(payload.task);
  }
  if (payload.model) {
    parts.push(`model ${payload.model}`);
  }
  if (payload.branch) {
    parts.push(`branch ${payload.branch}`);
  }
  if (payload.commit) {
    parts.push(`commit ${payload.commit.slice(0, 12)}`);
  }
  if (payload.filesChanged?.length) {
    parts.push(
      `${payload.filesChanged.length} file${payload.filesChanged.length === 1 ? "" : "s"} changed`,
    );
  }
  if (payload.checksRun?.length) {
    parts.push(`checks: ${payload.checksRun.join(", ")}`);
  }
  if (payload.elapsedMs !== undefined) {
    parts.push(`${Math.round(payload.elapsedMs / 100) / 10}s elapsed`);
  }
  if (payload.capacity?.costUsd !== undefined) {
    parts.push(`~$${payload.capacity.costUsd.toFixed(4)} estimated`);
  }
  if (payload.capacity?.tokens !== undefined) {
    parts.push(`${payload.capacity.tokens} tokens`);
  }

  const summary = parts.join(" · ") || `Editor/agent ${payload.outcome} (${payload.runId})`;
  return sanitizeString(summary, 2000);
}

function auditAction(payload: EditorEvidencePayload): string {
  return `editor.${payload.kind}`;
}

/**
 * Map a validated editor/agent payload onto release evidence + audit entries.
 * Idempotent for the same releaseId + runId + kind.
 */
export function applyEditorEvidence(
  release: ReleaseCandidate,
  payload: EditorEvidencePayload,
): EditorIngestResult {
  const evidenceKey = `editor:${payload.runId}:${payload.kind}`;
  const existing = release.evidence.find(
    (item) => item.id === evidenceKey || item.id.endsWith(`_${evidenceKey}`),
  );

  if (existing) {
    const priorAudit = release.audit.find(
      (event) =>
        event.action === auditAction(payload) &&
        event.detail.includes(payload.runId),
    );
    return {
      release,
      evidence: existing,
      audit:
        priorAudit ??
        ({
          id: newId("audit"),
          at: payload.occurredAt,
          actorEmail: `editor:${payload.editorAgent}@release-room.local`,
          action: auditAction(payload),
          detail: `Duplicate ignored for run ${payload.runId}`,
        } satisfies AuditEvent),
      duplicated: true,
    };
  }

  const evidence: EvidenceItem = {
    id: evidenceKey,
    source: "editor",
    title: buildTitle(payload),
    summary: buildSummary(payload),
    status: outcomeToEvidenceStatus(payload.outcome),
    collectedAt: payload.occurredAt,
  };

  const audit: AuditEvent = {
    id: newId("audit"),
    at: payload.occurredAt,
    actorEmail: `editor:${payload.editorAgent}@release-room.local`,
    action: auditAction(payload),
    detail: buildSummary(payload),
  };

  const evidenceNext = [...release.evidence, evidence];
  const next: ReleaseCandidate = {
    ...release,
    evidence: evidenceNext,
    audit: [...release.audit, audit],
    decision: evaluateDecision(evidenceNext),
    updatedAt: new Date().toISOString(),
  };

  return { release: next, evidence, audit, duplicated: false };
}
