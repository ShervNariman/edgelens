import type { NormalizedEvidenceItem } from "./types";

/**
 * Map integration evidence into the SHE-59 decision-engine EvidenceItem shape.
 * Decision engine fields: category, outcome, source, summary, collectedAt.
 */
export function toDecisionEvidence(items: NormalizedEvidenceItem[]): Array<{
  category: NormalizedEvidenceItem["category"];
  outcome: NormalizedEvidenceItem["outcome"];
  source: string;
  summary: string;
  collectedAt: string;
}> {
  return items.map((item) => ({
    category: item.category,
    outcome: item.outcome,
    source: item.provider,
    summary: `${item.title}: ${item.summary}`,
    collectedAt: item.collectedAt,
  }));
}

/** UI evidence group mapping used by SHE-61 product surfaces. */
export type UiEvidenceGroup =
  | "intent"
  | "engineering"
  | "experience"
  | "deployment"
  | "launch";

export type UiEvidenceStatus =
  | "pass"
  | "fail"
  | "missing"
  | "pending"
  | "waived";

function toUiGroup(
  category: NormalizedEvidenceItem["category"]
): UiEvidenceGroup {
  switch (category) {
    case "intent":
      return "intent";
    case "code":
    case "test":
    case "security":
      return "engineering";
    case "visual":
      return "experience";
    case "deployment":
      return "deployment";
    case "analytics":
    case "operations":
    case "approval":
      return "launch";
    default:
      return "engineering";
  }
}

function toUiStatus(
  outcome: NormalizedEvidenceItem["outcome"]
): UiEvidenceStatus {
  switch (outcome) {
    case "pass":
      return "pass";
    case "fail":
      return "fail";
    case "pending":
      return "pending";
    case "skipped":
      return "missing";
    default:
      return "pending";
  }
}

/**
 * Map integration evidence into the SHE-61 product UI EvidenceItem shape.
 */
export function toUiEvidence(items: NormalizedEvidenceItem[]): Array<{
  id: string;
  group: UiEvidenceGroup;
  title: string;
  summary: string;
  status: UiEvidenceStatus;
  required: boolean;
  owner: string;
  sourceKind: "github" | "linear" | "vercel" | "manual" | "ci" | "policy";
  sourceLabel: string;
  sourceUrl?: string;
  collectedAt: string;
  refreshedAt?: string;
}> {
  return items.map((item) => {
    const sourceKind =
      item.provider === "github" ||
      item.provider === "linear" ||
      item.provider === "vercel"
        ? item.provider
        : item.provider === "fixture"
          ? "ci"
          : "manual";

    return {
      id: item.id,
      group: toUiGroup(item.category),
      title: item.title,
      summary: item.summary,
      status: toUiStatus(item.outcome),
      required: item.category === "intent" || item.category === "code" || item.category === "test" || item.category === "deployment",
      owner: item.provider,
      sourceKind,
      sourceLabel: item.provider,
      sourceUrl: item.sourceLinks[0]?.url,
      collectedAt: item.collectedAt,
      refreshedAt: item.collectedAt,
    };
  });
}
