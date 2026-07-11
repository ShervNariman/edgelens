/**
 * Provider-neutral editor/agent evidence bridge types (SHE-70).
 *
 * Captures approved work evidence from any code editor or coding agent
 * (Cursor, Codex, Claude Code, local scripts) — not a deep editor telemetry
 * integration.
 */

export const EDITOR_AGENTS = [
  "cursor",
  "codex",
  "claude-code",
  "script",
  "other",
] as const;

export type EditorAgent = (typeof EDITOR_AGENTS)[number];

export const EDITOR_EVENT_KINDS = [
  "report",
  "start",
  "complete",
  "fail",
] as const;

export type EditorEventKind = (typeof EDITOR_EVENT_KINDS)[number];

export const EDITOR_OUTCOMES = [
  "started",
  "completed",
  "failed",
  "reported",
] as const;

export type EditorOutcome = (typeof EDITOR_OUTCOMES)[number];

/** Soft bounds applied before signing / ingest. */
export const EDITOR_BRIDGE_LIMITS = {
  maxStringLength: 500,
  maxSummaryLength: 2000,
  maxFiles: 100,
  maxChecks: 40,
  maxMetadataKeys: 24,
  maxMetadataValueLength: 500,
  maxRetries: 3,
} as const;

export interface EditorCapacity {
  /** Optional token or credit estimate used for the run. */
  tokens?: number;
  /** Optional monetary cost in USD. */
  costUsd?: number;
  /** Free-form capacity note (redacted + truncated). */
  note?: string;
}

/**
 * Canonical unsigned evidence payload submitted by the CLI or compatible
 * agent wrappers.
 */
export interface EditorEvidencePayload {
  /** Schema version for forward compatibility. */
  schemaVersion: 1;
  /** Lifecycle event kind. */
  kind: EditorEventKind;
  /** Stable run id shared across start → complete/fail. */
  runId: string;
  /** Target release candidate id. */
  releaseId: string;
  /** Editor or coding agent that produced the evidence. */
  editorAgent: EditorAgent;
  /** Optional model identifier (never a secret). */
  model?: string;
  /** Task or issue reference (e.g. SHE-70, "fix login flaky"). */
  task?: string;
  branch?: string;
  commit?: string;
  filesChanged?: string[];
  checksRun?: string[];
  outcome: EditorOutcome;
  /** Elapsed wall time in milliseconds, when known. */
  elapsedMs?: number;
  capacity?: EditorCapacity;
  /** Bounded, redacted key/value bag. */
  metadata?: Record<string, string>;
  /** ISO-8601 timestamp set by the client (server may overwrite). */
  occurredAt: string;
}

export interface SignedEditorEvidenceEnvelope {
  payload: EditorEvidencePayload;
  /** Hex HMAC-SHA256 of the canonical JSON body. */
  signature: string;
}

export class EditorBridgeError extends Error {
  readonly code: string;
  readonly status: number;
  readonly details?: Record<string, unknown>;

  constructor(
    code: string,
    message: string,
    status = 400,
    details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "EditorBridgeError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}
