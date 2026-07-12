import type {
  AnalysisIssue,
  CodeLocation,
  IssueSeverity,
  IssueSource,
} from "@/types/analysis";

export type FindingConfidence = "high" | "medium" | "heuristic";

export function confidenceForIssue(issue: AnalysisIssue): FindingConfidence {
  if (issue.source === "state-rule" || issue.category === "missing-state") {
    return issue.severity === "critical" ? "high" : "medium";
  }
  if (issue.source === "preview") return "heuristic";
  if (issue.source === "a11y-rule") {
    return issue.severity === "critical" ? "medium" : "heuristic";
  }
  return issue.severity === "info" ? "heuristic" : "medium";
}

export function confidenceLabel(confidence: FindingConfidence): string {
  switch (confidence) {
    case "high":
      return "High confidence";
    case "medium":
      return "Medium confidence";
    default:
      return "Heuristic";
  }
}

export function whyForIssue(issue: AnalysisIssue): string {
  if (issue.category === "missing-state") {
    return (
      issue.description ||
      "Without this state, the happy path can hide broken real-world interaction."
    );
  }
  if (issue.source === "preview") {
    return (
      issue.description ||
      "Detected on the simulated preview DOM — treat as supporting risk, not WCAG certification."
    );
  }
  if (issue.category === "accessibility") {
    return (
      issue.description ||
      "Screen reader and keyboard users may miss context or get incomplete feedback."
    );
  }
  return (
    issue.description ||
    "Pattern gaps in AI-generated UI are easy to miss in visual review."
  );
}

export function nextActionForIssue(issue: AnalysisIssue): string {
  return issue.suggestion;
}

export function evidenceForIssue(issue: AnalysisIssue): string | null {
  const parts: string[] = [];
  if (issue.element) parts.push(issue.element);
  if (issue.location) parts.push(formatLocation(issue.location));
  if (issue.state) parts.push(`state: ${issue.state}`);
  if (issue.a11yRuleId) parts.push(`rule: ${issue.a11yRuleId}`);
  return parts.length > 0 ? parts.join(" · ") : null;
}

export function formatLocation(location: CodeLocation): string {
  const start = `L${location.line}:${location.column}`;
  if (location.endLine != null) {
    return `${start}–L${location.endLine}:${location.endColumn ?? 0}`;
  }
  return start;
}

export function sourceLayerLabel(source: IssueSource): string {
  switch (source) {
    case "preview":
      return "Preview DOM";
    case "state-rule":
      return "State completeness";
    case "a11y-rule":
      return "Static a11y rule";
    default:
      return "Static JSX / shadcn";
  }
}

export function severityRank(severity: IssueSeverity): number {
  if (severity === "critical") return 0;
  if (severity === "warning") return 1;
  return 2;
}
