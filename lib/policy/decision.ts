import type { EvidenceItem, DecisionStatus } from "@/lib/db/types";

/**
 * Deterministic foundation policy:
 * - any failing evidence => BLOCKED
 * - otherwise READY when at least one passing evidence item exists
 * - PENDING when evidence is empty
 */
export function evaluateDecision(evidence: EvidenceItem[]): DecisionStatus {
  if (evidence.length === 0) {
    return "PENDING";
  }
  if (evidence.some((item) => item.status === "fail")) {
    return "BLOCKED";
  }
  if (evidence.some((item) => item.status === "pass")) {
    return "READY";
  }
  return "PENDING";
}
