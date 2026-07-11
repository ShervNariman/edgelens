/**
 * Deterministic release decision engine.
 * Turns normalized evidence + risk policy into READY | WARNING | BLOCKED.
 */

import { normalizeEvidence, resolveEvidence } from "./evidence";
import { resolvePolicyForRisks } from "./policy";
import {
  classifyRisk,
  normalizeRiskClasses,
} from "./risk-classifier";
import type {
  AuditEvent,
  DecisionFinding,
  OverrideRecord,
  OverrideRequest,
  ReleaseCandidateInput,
  ReleaseDecision,
  ReleaseDecisionStatus,
  RiskClass,
} from "./types";
import { ReleaseDecisionError } from "./types";

const DETERMINISTIC_DEFAULT_AT = "1970-01-01T00:00:00.000Z";

function validateInput(input: ReleaseCandidateInput): void {
  if (!input || typeof input !== "object") {
    throw new ReleaseDecisionError(
      "invalid_input",
      "input must be an object"
    );
  }
  if (typeof input.id !== "string" || input.id.trim() === "") {
    throw new ReleaseDecisionError(
      "invalid_input",
      "id must be a non-empty string"
    );
  }
  if (input.riskClasses !== undefined && input.changeSignals !== undefined) {
    // Both allowed: explicit riskClasses win; changeSignals ignored for classification.
  }
  if (
    input.riskClasses === undefined &&
    (input.changeSignals === undefined || !Array.isArray(input.changeSignals))
  ) {
    throw new ReleaseDecisionError(
      "invalid_input",
      "Provide riskClasses or changeSignals"
    );
  }
}

function resolveRisks(input: ReleaseCandidateInput): RiskClass[] {
  if (input.riskClasses !== undefined) {
    return normalizeRiskClasses(input.riskClasses);
  }
  return classifyRisk(input.changeSignals ?? []);
}

function buildFindings(
  resolution: ReturnType<typeof resolveEvidence>,
  policySource: string[]
): { blockers: DecisionFinding[]; warnings: DecisionFinding[] } {
  const policy = policySource.join("+") || "policy.unknown";
  const blockers: DecisionFinding[] = [];
  const warnings: DecisionFinding[] = [];

  for (const category of resolution.missingRequired) {
    blockers.push({
      code: "missing_required_evidence",
      category,
      message: `Required evidence missing: ${category}`,
      severity: "blocker",
      policySource: policy,
    });
  }

  for (const category of resolution.failedRequired) {
    blockers.push({
      code: "failed_required_evidence",
      category,
      message: `Required evidence failed: ${category}`,
      severity: "blocker",
      policySource: policy,
    });
  }

  // Missing optional evidence is recorded on EvidenceResolution for
  // explainability but does not elevate the gate to WARNING.
  // Failed optional evidence does — the check ran and did not pass.
  for (const category of resolution.failedOptional) {
    warnings.push({
      code: "failed_optional_evidence",
      category,
      message: `Optional evidence failed: ${category}`,
      severity: "warning",
      policySource: policy,
    });
  }

  return { blockers, warnings };
}

function validateOverride(override: OverrideRequest): OverrideRequest {
  if (!override || typeof override !== "object") {
    throw new ReleaseDecisionError(
      "invalid_override",
      "override must be an object when provided"
    );
  }
  if (typeof override.rationale !== "string" || override.rationale.trim() === "") {
    throw new ReleaseDecisionError(
      "invalid_override",
      "override.rationale is required and must be non-empty"
    );
  }
  if (typeof override.actor !== "string" || override.actor.trim() === "") {
    throw new ReleaseDecisionError(
      "invalid_override",
      "override.actor is required and must be non-empty"
    );
  }
  if (override.at !== undefined && typeof override.at !== "string") {
    throw new ReleaseDecisionError(
      "invalid_override",
      "override.at must be an ISO-8601 string when provided"
    );
  }
  return override;
}

function applyOverride(
  blockers: DecisionFinding[],
  warnings: DecisionFinding[],
  override: OverrideRequest
): {
  decision: ReleaseDecisionStatus;
  overrideRecord: OverrideRecord;
  remainingBlockers: DecisionFinding[];
  remainingWarnings: DecisionFinding[];
  auditEvent: AuditEvent;
} {
  const at = override.at ?? DETERMINISTIC_DEFAULT_AT;
  const forceReady = Boolean(override.forceReady);
  const overrideRecord: OverrideRecord = {
    rationale: override.rationale.trim(),
    actor: override.actor.trim(),
    at,
    forceReady,
    waivedBlockers: [...blockers],
  };

  const remainingBlockers: DecisionFinding[] = [];
  const remainingWarnings = [...warnings];

  let decision: ReleaseDecisionStatus;
  if (forceReady || remainingWarnings.length === 0) {
    decision = "READY";
  } else {
    decision = "WARNING";
  }

  const auditEvent: AuditEvent = {
    type: "override",
    at,
    actor: overrideRecord.actor,
    message: `Override applied: ${overrideRecord.rationale}`,
    details: {
      forceReady,
      waivedBlockerCodes: blockers.map((b) => b.code),
      waivedCategories: blockers.map((b) => b.category).filter(Boolean),
      resultingDecision: decision,
    },
  };

  return {
    decision,
    overrideRecord,
    remainingBlockers,
    remainingWarnings,
    auditEvent,
  };
}

function decideStatus(
  blockers: DecisionFinding[],
  warnings: DecisionFinding[]
): ReleaseDecisionStatus {
  if (blockers.length > 0) return "BLOCKED";
  if (warnings.length > 0) return "WARNING";
  return "READY";
}

/**
 * Evaluate a release candidate. Pure and deterministic for a given input.
 */
export function evaluateRelease(
  input: ReleaseCandidateInput
): ReleaseDecision {
  validateInput(input);

  const riskClasses = resolveRisks(input);
  const policy = resolvePolicyForRisks(riskClasses);
  const evidenceMap = normalizeEvidence(input.evidence);
  const evidence = resolveEvidence(
    policy.required,
    policy.optional,
    evidenceMap
  );
  const { blockers, warnings } = buildFindings(evidence, policy.policySource);

  const auditEvents: AuditEvent[] = [];
  const decidedAt = DETERMINISTIC_DEFAULT_AT;

  let decision = decideStatus(blockers, warnings);
  let finalBlockers = blockers;
  let finalWarnings = warnings;
  let overrideRecord: OverrideRecord | undefined;

  if (input.override !== undefined) {
    const override = validateOverride(input.override);
    if (blockers.length === 0 && !override.forceReady) {
      // Override with no blockers is still recorded but does not change status
      // unless forceReady; warnings may remain.
      const applied = applyOverride([], warnings, override);
      overrideRecord = {
        ...applied.overrideRecord,
        waivedBlockers: [],
      };
      auditEvents.push(applied.auditEvent);
      if (override.forceReady) {
        decision = "READY";
        finalWarnings = [];
      }
    } else if (blockers.length > 0 || override.forceReady) {
      const applied = applyOverride(blockers, warnings, override);
      decision = applied.decision;
      finalBlockers = applied.remainingBlockers;
      finalWarnings = applied.remainingWarnings;
      if (override.forceReady) {
        finalWarnings = [];
        decision = "READY";
      }
      overrideRecord = applied.overrideRecord;
      auditEvents.push(applied.auditEvent);
    }
  }

  // Recompute missingEvidence for explainability: required gaps only
  const missingEvidence = [
    ...evidence.missingRequired,
    ...evidence.failedRequired,
  ];

  auditEvents.push({
    type: "decision",
    at: decidedAt,
    message: `Decision: ${decision}`,
    details: {
      decision,
      riskClasses,
      policySource: policy.policySource,
      blockerCount: finalBlockers.length,
      warningCount: finalWarnings.length,
      overridden: Boolean(overrideRecord),
    },
  });

  return {
    candidateId: input.id,
    decision,
    riskClasses,
    evidence,
    missingEvidence,
    warnings: finalWarnings,
    blockers: finalBlockers,
    policySource: policy.policySource,
    override: overrideRecord,
    auditEvents,
  };
}

/**
 * Convenience: evaluate and throw ReleaseDecisionError on invalid input.
 * Same as evaluateRelease — errors are thrown, not returned.
 */
export function evaluateReleaseOrThrow(
  input: ReleaseCandidateInput
): ReleaseDecision {
  return evaluateRelease(input);
}
