/**
 * Release Room core — evidence model, risk classifier, and decision engine.
 *
 * Deterministic: same input → same READY | WARNING | BLOCKED decision.
 * No LLM, no network, no environment secrets.
 */

export {
  EVIDENCE_CATEGORIES,
  RISK_CLASSES,
  ReleaseDecisionError,
  type AuditEvent,
  type DecisionFinding,
  type EvidenceCategory,
  type EvidenceItem,
  type EvidenceOutcome,
  type EvidenceResolution,
  type OverrideRecord,
  type OverrideRequest,
  type PolicyRequirement,
  type ReleaseCandidateInput,
  type ReleaseDecision,
  type ReleaseDecisionStatus,
  type RiskClass,
} from "./types";

export {
  RISK_POLICIES,
  RISK_SEVERITY_ORDER,
  resolvePolicyForRisks,
} from "./policy";

export {
  classifyRisk,
  isRiskClass,
  normalizeRiskClasses,
} from "./risk-classifier";

export {
  isEvidenceCategory,
  isEvidenceOutcome,
  normalizeEvidence,
  resolveEvidence,
} from "./evidence";

export {
  evaluateRelease,
  evaluateReleaseOrThrow,
} from "./decision-engine";
