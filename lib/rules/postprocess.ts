import type {
  AnalysisIssue,
  CheckStatus,
  IssueConfidence,
  RawAnalysisIssue,
} from "@/types/analysis";

/** Suppress obvious duplicates and contradictory findings. */
export function dedupeIssues(issues: AnalysisIssue[]): AnalysisIssue[] {
  const byId = new Map<string, AnalysisIssue>();
  for (const issue of issues) {
    const existing = byId.get(issue.id);
    if (!existing) {
      byId.set(issue.id, issue);
      continue;
    }
    // Keep the higher-severity / higher-confidence duplicate
    byId.set(issue.id, preferIssue(existing, issue));
  }

  let result = Array.from(byId.values());

  const titles = new Set(result.map((i) => i.title));

  // If DialogTitle is missing, drop the weaker “accessible description” twin
  // (legacy id path) — title finding already covers the composition gap.
  if (titles.has("Dialog missing DialogTitle")) {
    result = result.filter(
      (i) => i.title !== "Dialog missing accessible description"
    );
  }

  // Empty-state rule supersedes soft unguarded-map pattern
  if (
    result.some((i) => i.id === "state-empty" || i.id === "state-search-no-results")
  ) {
    result = result.filter((i) => i.id !== "pattern-map-unguarded");
  }

  // Async submit guard overlaps generic loading — keep both only if distinct;
  // if both fire, prefer keeping both but mark loading as recommended companion.
  // Contradictory: "no loading" + "loading button missing disabled" shouldn't both
  // claim opposite presence of loading cues.
  const hasLoadingMissing = result.some((i) => i.id === "state-loading");
  if (hasLoadingMissing) {
    result = result.filter((i) => i.title !== "Loading button missing disabled / aria-busy");
  }

  // Overlay open-state contextual rule overlaps pattern-dialog-uncontrolled
  if (result.some((i) => i.id === "state-overlay-open")) {
    result = result.filter((i) => i.id !== "pattern-dialog-uncontrolled");
  }

  // Form field error overlaps generic state-error for forms — keep both only when
  // state-error is absent; otherwise drop the more specific if identical severity?
  // Prefer keeping specific form-field-error and generic state-error is ok for coverage.
  // Suppress pattern-form-submit contradiction when onSubmit clearly exists (shouldn't happen).

  return result;
}

function preferIssue(a: AnalysisIssue, b: AnalysisIssue): AnalysisIssue {
  const sev = { critical: 3, warning: 2, info: 1 };
  const conf = { high: 3, medium: 2, low: 1 };
  const score = (i: AnalysisIssue) => sev[i.severity] * 10 + conf[i.confidence];
  return score(b) > score(a) ? b : a;
}

/** Strip locations when parse recovery makes them unreliable. */
export function stripUnreliableLocations(
  issues: AnalysisIssue[],
  locationsUnreliable: boolean
): AnalysisIssue[] {
  if (!locationsUnreliable) return issues;
  return issues.map((issue) => {
    if (!issue.location) return issue;
    const { location: _, ...rest } = issue;
    void _;
    return rest;
  });
}

export function buildCheckStatuses(args: {
  parseErrors: string[];
  locationsUnreliable: boolean;
  primaryType: string;
  componentsDetected: number;
  previewDomChecked: boolean;
  source: string;
}): CheckStatus[] {
  const statuses: CheckStatus[] = [];

  if (args.parseErrors.length > 0) {
    statuses.push({
      id: "parse-recovery",
      label: "Precise source locations",
      status: "inconclusive",
      reason:
        "Parser recovery reported syntax issues — line/column locations are omitted because they may not match the pasted source.",
    });
  }

  if (args.componentsDetected === 0 && args.primaryType === "Unknown") {
    statuses.push({
      id: "component-detection",
      label: "shadcn primitive detection",
      status: "inconclusive",
      reason:
        "No known shadcn/Radix primitives were detected; some composition rules did not run.",
    });
  }

  if (!args.previewDomChecked) {
    statuses.push({
      id: "preview-dom",
      label: "Preview DOM (axe)",
      status: "skipped",
      reason:
        "Preview DOM checks run after Analyze mounts the simulated preview — not on the initial static pass.",
    });
  }

  if (!/Sheet|Dialog|Popover|DropdownMenu|Tooltip/.test(args.source)) {
    statuses.push({
      id: "overlay-composition",
      label: "Overlay composition rules",
      status: "skipped",
      reason: "No Dialog/Sheet/Popover/Menu/Tooltip cues — overlay rules did not apply.",
    });
  }

  if (!/search|filter|query|debounc/i.test(args.source)) {
    statuses.push({
      id: "search-states",
      label: "Search/filter state rules",
      status: "skipped",
      reason: "No search/filter/query cues — search no-results/pending rules did not apply.",
    });
  }

  if (!/load more|loadMore|hasMore|infinite|pagination|nextPage/i.test(args.source)) {
    statuses.push({
      id: "pagination-states",
      label: "Pagination / infinite-load rules",
      status: "skipped",
      reason: "No pagination/infinite-load cues — loading-next rules did not apply.",
    });
  }

  return statuses;
}

export function withDefaultEvidence(
  issue: RawAnalysisIssue & { source?: AnalysisIssue["source"] }
): RawAnalysisIssue {
  return {
    ...issue,
    evidence: issue.evidence || `rule:${issue.id}`,
    confidence: issue.confidence || defaultConfidence(issue),
    requirement: issue.requirement || "recommended",
  };
}

function defaultConfidence(issue: RawAnalysisIssue): IssueConfidence {
  if (issue.severity === "critical") return "high";
  if (issue.severity === "warning") return "medium";
  return "low";
}
