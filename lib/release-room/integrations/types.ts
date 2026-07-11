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
  status: "accepted" | "duplicate" | "rejected";
  eventId: string;
  evidence: NormalizedEvidenceItem[];
  message: string;
}

export interface RefreshResult {
  releaseId: string;
  refreshedAt: string;
  adapters: AdapterResult[];
  evidence: NormalizedEvidenceItem[];
  /** Newly ingested or updated item ids */
  upsertedIds: string[];
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
