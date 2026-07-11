/**
 * Release Room — core evidence and decision types.
 * Deterministic: same input always yields the same decision. No LLM required.
 */

/** Normalized evidence categories collected for a release candidate. */
export const EVIDENCE_CATEGORIES = [
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

export type EvidenceCategory = (typeof EVIDENCE_CATEGORIES)[number];

/** Change risk classes that drive required/optional evidence policy. */
export const RISK_CLASSES = [
  "ui",
  "authentication",
  "billing",
  "database_migration",
  "permissions",
  "public_api",
  "content",
] as const;

export type RiskClass = (typeof RISK_CLASSES)[number];

/** Outcome of a single evidence item. */
export type EvidenceOutcome = "pass" | "fail" | "pending" | "skipped";

/** Final release gate decision. */
export type ReleaseDecisionStatus = "READY" | "WARNING" | "BLOCKED";

export interface EvidenceItem {
  category: EvidenceCategory;
  /** pass = satisfied; fail = present but failed check; pending/skipped = not satisfied */
  outcome: EvidenceOutcome;
  source?: string;
  summary?: string;
  /** ISO-8601 timestamp when collected; optional for fixtures */
  collectedAt?: string;
}

export interface ReleaseCandidateInput {
  /** Stable id for the candidate (PR, release, etc.) */
  id: string;
  /** Explicit risk classes; if omitted, derived from changeSignals */
  riskClasses?: RiskClass[];
  /** Free-form signals used by the risk classifier when riskClasses is omitted */
  changeSignals?: string[];
  /** Evidence collected so far (one entry per category preferred; last wins on duplicates) */
  evidence: EvidenceItem[];
  /**
   * Optional human override. When present with a non-empty rationale,
   * blockers may be waived and the decision forced to READY or WARNING.
   */
  override?: OverrideRequest;
}

export interface OverrideRequest {
  /** Required non-empty rationale for auditability */
  rationale: string;
  /** Who requested the override */
  actor: string;
  /** Force READY even when warnings remain; default keeps WARNING if soft issues remain */
  forceReady?: boolean;
  /** ISO-8601; if omitted, engine uses a fixed placeholder for determinism when not provided */
  at?: string;
}

export interface PolicyRequirement {
  riskClass: RiskClass;
  required: readonly EvidenceCategory[];
  optional: readonly EvidenceCategory[];
  /** Stable policy identifier for explainability */
  policyId: string;
}

export interface DecisionFinding {
  code: string;
  category?: EvidenceCategory;
  message: string;
  severity: "blocker" | "warning";
  policySource: string;
}

export interface AuditEvent {
  type: "decision" | "override" | "validation_error";
  at: string;
  actor?: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface OverrideRecord {
  rationale: string;
  actor: string;
  at: string;
  forceReady: boolean;
  waivedBlockers: DecisionFinding[];
}

export interface EvidenceResolution {
  required: EvidenceCategory[];
  optional: EvidenceCategory[];
  present: EvidenceCategory[];
  missingRequired: EvidenceCategory[];
  failedRequired: EvidenceCategory[];
  missingOptional: EvidenceCategory[];
  failedOptional: EvidenceCategory[];
}

export interface ReleaseDecision {
  candidateId: string;
  decision: ReleaseDecisionStatus;
  riskClasses: RiskClass[];
  evidence: EvidenceResolution;
  missingEvidence: EvidenceCategory[];
  warnings: DecisionFinding[];
  blockers: DecisionFinding[];
  /** Policy ids that contributed to this decision */
  policySource: string[];
  override?: OverrideRecord;
  auditEvents: AuditEvent[];
}

export class ReleaseDecisionError extends Error {
  readonly code: string;
  readonly details?: Record<string, unknown>;

  constructor(
    code: string,
    message: string,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "ReleaseDecisionError";
    this.code = code;
    this.details = details;
  }
}
