/**
 * Release Room integrations — adapter boundaries and normalized evidence.
 *
 * Providers activate via environment variables. When credentials are absent,
 * fixture adapters supply deterministic demo evidence without code changes.
 */

export const INTEGRATION_PROVIDERS = [
  "github",
  "linear",
  "vercel",
  "webhook",
  "editor",
  "fixture",
] as const;

export type IntegrationProvider = (typeof INTEGRATION_PROVIDERS)[number];

/** Evidence categories aligned with the SHE-59 decision engine. */
export const INTEGRATION_EVIDENCE_CATEGORIES = [
  "intent",
  "code",
  "test",
  "security",
  "visual",
  "deployment",
  "analytics",
  "operations",
  "approval",
] as const;

export type IntegrationEvidenceCategory =
  (typeof INTEGRATION_EVIDENCE_CATEGORIES)[number];

export type IntegrationEvidenceOutcome =
  | "pass"
  | "fail"
  | "pending"
  | "skipped";

/** Stable identity for a release candidate used when refreshing evidence. */
export interface ReleaseRef {
  id: string;
  /** Repository slug, e.g. owner/name */
  repository?: string;
  branch?: string;
  /** Pull request number when known */
  prNumber?: number;
  /** Linear issue identifier, e.g. SHE-60 */
  linearIssueId?: string;
  /** Vercel project / deployment identifiers */
  vercelProjectId?: string;
  vercelDeploymentId?: string;
  /** Optional version label for fixture selection */
  version?: string;
}

export interface SourceLink {
  label: string;
  url: string;
}

/**
 * Normalized evidence item produced by any adapter.
 * Maps cleanly to decision-engine and product-UI evidence shapes.
 */
export interface NormalizedEvidenceItem {
  /** Deterministic id for idempotent upserts: provider:externalId */
  id: string;
  provider: IntegrationProvider;
  category: IntegrationEvidenceCategory;
  outcome: IntegrationEvidenceOutcome;
  title: string;
  summary: string;
  /** External system id (PR number, issue id, deployment id, webhook event id) */
  externalId: string;
  sourceLinks: SourceLink[];
  collectedAt: string;
  /** Raw provider payload subset safe for audit (no secrets) */
  metadata?: Record<string, unknown>;
}

export interface AdapterContext {
  release: ReleaseRef;
  /** ISO clock override for deterministic fixtures/tests */
  now?: string;
  /** Injected fetch for tests; defaults to global fetch */
  fetchImpl?: typeof fetch;
  /** Force fixture mode even when credentials exist (tests) */
  forceFixture?: boolean;
}

export interface AdapterResult {
  provider: IntegrationProvider;
  mode: "live" | "fixture";
  evidence: NormalizedEvidenceItem[];
  /** Human-readable note for audit trail */
  note: string;
}

export interface EvidenceAdapter {
  readonly provider: IntegrationProvider;
  /** Whether live credentials are configured for this adapter */
  isLiveConfigured(): boolean;
  collect(ctx: AdapterContext): Promise<AdapterResult>;
}

export interface IngestedEvent {
  /** Caller-supplied or derived idempotency key */
  eventId: string;
  provider: IntegrationProvider;
  releaseId: string;
  receivedAt: string;
  evidence: NormalizedEvidenceItem[];
  sourceLinks: SourceLink[];
}

export interface IngestResult {
  status: "accepted" | "duplicate" | "rejected" | "unmatched" | "ambiguous";
  eventId: string;
  evidence: NormalizedEvidenceItem[];
  message: string;
  /** Matched release candidate id when known. */
  releaseId?: string | null;
  /** Present when ingest produced a provider-event envelope (SHE-69). */
  envelope?: ProviderEventEnvelope;
  audit?: IntegrationAuditRecord;
}

export interface RefreshResult {
  releaseId: string;
  refreshedAt: string;
  adapters: AdapterResult[];
  evidence: NormalizedEvidenceItem[];
  /** Newly ingested or updated item ids */
  upsertedIds: string[];
}

/** Native provider identity for install-ready webhook ingress (SHE-69). */
export const NATIVE_PROVIDERS = ["github", "linear", "vercel"] as const;
export type NativeProvider = (typeof NATIVE_PROVIDERS)[number];

/**
 * Common provider-event envelope after signature validation + normalization.
 * Keeps provider-native metadata audit-safe (no secrets / raw oversized payloads).
 */
export interface ProviderEventEnvelope {
  /** Idempotency key — typically provider delivery id */
  deliveryId: string;
  provider: NativeProvider;
  /** Provider event type, e.g. pull_request, Issue, deployment.succeeded */
  eventType: string;
  receivedAt: string;
  /** Best-effort release linkage when resolvable from payload */
  releaseId: string | null;
  /** ISO timestamp extracted from the provider payload when available */
  eventTimestamp: string | null;
  /** SHA-256 of the raw body for audit/replay diagnostics */
  payloadHash: string;
  evidence: NormalizedEvidenceItem[];
  sourceLinks: SourceLink[];
  metadata?: Record<string, unknown>;
}

export type IntegrationAuditStatus =
  | "accepted"
  | "duplicate"
  | "rejected"
  | "stale"
  | "oversized"
  | "unmatched"
  | "ambiguous";

/** Append-only style audit record for webhook ingestion outcomes. */
export interface IntegrationAuditRecord {
  id: string;
  provider: NativeProvider | "webhook" | "editor";
  deliveryId: string;
  eventType: string;
  status: IntegrationAuditStatus;
  receivedAt: string;
  message: string;
  releaseId: string | null;
  evidenceIds: string[];
  errorCode?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Truthful provider health vocabulary (SHE-94 Loop 1).
 * - not_configured: secrets / tokens absent
 * - configured: secrets present, no successful live event yet
 * - connected: recent successful event / probe
 * - stale: was connected, aged beyond freshness window
 * - degraded: partial capability (e.g. webhook ok, read probe weak)
 * - failed: last operation failed
 */
export type ConnectionHealth =
  | "not_configured"
  | "configured"
  | "connected"
  | "stale"
  | "degraded"
  | "failed";

export type ConnectionProvider =
  | NativeProvider
  | "webhook"
  | "editor";

/** Per-provider connection freshness and actionable error state. */
export interface ConnectionState {
  provider: ConnectionProvider;
  health: ConnectionHealth;
  lastEventAt: string | null;
  lastEventId: string | null;
  lastEventType: string | null;
  lastSuccessAt: string | null;
  lastErrorAt: string | null;
  lastProbeAt: string | null;
  /** Actionable error for operators (no secrets). */
  lastError: { code: string; message: string } | null;
  /** True when install/webhook secret or read token is configured */
  configured: boolean;
  /** Optional read vs webhook split for operators */
  channels?: {
    read?: ConnectionHealth;
    webhook?: ConnectionHealth;
  };
}

export class IntegrationError extends Error {
  readonly code: string;
  readonly status: number;
  readonly details?: Record<string, unknown>;

  constructor(
    code: string,
    message: string,
    status = 400,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "IntegrationError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}
