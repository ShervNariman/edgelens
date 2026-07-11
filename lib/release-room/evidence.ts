/**
 * Evidence normalization and required/optional resolution.
 */

import { EVIDENCE_CATEGORIES, type EvidenceCategory, type EvidenceItem, type EvidenceOutcome, type EvidenceResolution, ReleaseDecisionError } from "./types";

export function isEvidenceCategory(value: string): value is EvidenceCategory {
  return (EVIDENCE_CATEGORIES as readonly string[]).includes(value);
}

const VALID_OUTCOMES: readonly EvidenceOutcome[] = [
  "pass",
  "fail",
  "pending",
  "skipped",
];

export function isEvidenceOutcome(value: string): value is EvidenceOutcome {
  return (VALID_OUTCOMES as readonly string[]).includes(value);
}

/**
 * Validate and normalize evidence items.
 * Duplicate categories: last entry wins (deterministic given input order).
 */
export function normalizeEvidence(
  evidence: readonly EvidenceItem[]
): Map<EvidenceCategory, EvidenceItem> {
  if (!Array.isArray(evidence)) {
    throw new ReleaseDecisionError(
      "invalid_evidence",
      "evidence must be an array"
    );
  }

  const map = new Map<EvidenceCategory, EvidenceItem>();

  for (let i = 0; i < evidence.length; i++) {
    const item = evidence[i];
    if (!item || typeof item !== "object") {
      throw new ReleaseDecisionError(
        "invalid_evidence",
        `evidence[${i}] must be an object`,
        { index: i }
      );
    }
    if (typeof item.category !== "string" || !isEvidenceCategory(item.category)) {
      throw new ReleaseDecisionError(
        "invalid_evidence",
        `evidence[${i}].category is invalid`,
        { index: i, category: item.category, allowed: [...EVIDENCE_CATEGORIES] }
      );
    }
    if (typeof item.outcome !== "string" || !isEvidenceOutcome(item.outcome)) {
      throw new ReleaseDecisionError(
        "invalid_evidence",
        `evidence[${i}].outcome is invalid`,
        { index: i, outcome: item.outcome, allowed: [...VALID_OUTCOMES] }
      );
    }
    if (item.source !== undefined && typeof item.source !== "string") {
      throw new ReleaseDecisionError(
        "invalid_evidence",
        `evidence[${i}].source must be a string when provided`,
        { index: i }
      );
    }
    if (item.summary !== undefined && typeof item.summary !== "string") {
      throw new ReleaseDecisionError(
        "invalid_evidence",
        `evidence[${i}].summary must be a string when provided`,
        { index: i }
      );
    }

    map.set(item.category, {
      category: item.category,
      outcome: item.outcome,
      source: item.source,
      summary: item.summary,
      collectedAt: item.collectedAt,
    });
  }

  return map;
}

function isSatisfied(item: EvidenceItem | undefined): boolean {
  return item?.outcome === "pass";
}

function isFailed(item: EvidenceItem | undefined): boolean {
  return item?.outcome === "fail";
}

function isMissing(item: EvidenceItem | undefined): boolean {
  return (
    !item || item.outcome === "pending" || item.outcome === "skipped"
  );
}

/**
 * Resolve which required/optional evidence is present, missing, or failed.
 */
export function resolveEvidence(
  required: readonly EvidenceCategory[],
  optional: readonly EvidenceCategory[],
  evidenceMap: ReadonlyMap<EvidenceCategory, EvidenceItem>
): EvidenceResolution {
  const present: EvidenceCategory[] = [];
  for (const category of EVIDENCE_CATEGORIES) {
    if (isSatisfied(evidenceMap.get(category))) {
      present.push(category);
    }
  }

  const missingRequired: EvidenceCategory[] = [];
  const failedRequired: EvidenceCategory[] = [];
  for (const category of required) {
    const item = evidenceMap.get(category);
    if (isFailed(item)) {
      failedRequired.push(category);
    } else if (isMissing(item)) {
      missingRequired.push(category);
    }
  }

  const missingOptional: EvidenceCategory[] = [];
  const failedOptional: EvidenceCategory[] = [];
  for (const category of optional) {
    const item = evidenceMap.get(category);
    if (isFailed(item)) {
      failedOptional.push(category);
    } else if (isMissing(item)) {
      missingOptional.push(category);
    }
  }

  return {
    required: [...required],
    optional: [...optional],
    present,
    missingRequired,
    failedRequired,
    missingOptional,
    failedOptional,
  };
}
