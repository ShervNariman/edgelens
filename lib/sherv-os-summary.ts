import type { AnalysisIssue, AnalysisReport } from "@/types/analysis";

const MAX_FINDINGS = 12;
const MAX_TEXT_LENGTH = 1_200;

export interface ShervOSReviewSummary {
  componentName: string | null;
  primaryType: string;
  score: number;
  totalIssues: number;
  criticalCount: number;
  warningCount: number;
  infoCount: number;
  statesCovered: number;
  statesTotal: number;
  missingRequiredStates: string[];
  findings: Array<{
    title: string;
    description: string;
    suggestion: string;
    severity: string;
    category: string;
    source: string;
  }>;
  previewDomChecked: boolean;
  previewViolationCount: number;
}

function boundedText(value: string): string {
  return value.slice(0, MAX_TEXT_LENGTH);
}

function normalizeFinding(issue: AnalysisIssue) {
  return {
    title: boundedText(issue.title),
    description: boundedText(issue.description),
    suggestion: boundedText(issue.suggestion),
    severity: issue.severity,
    category: issue.category,
    source: issue.source,
  };
}

/**
 * Builds a privacy-safe summary for the optional AI explanation layer.
 * Deliberately excludes sourceCode, filenames, locations, fix snippets, raw DOM,
 * accessibility trees, and parser diagnostics.
 */
export function buildShervOSReviewSummary(
  report: AnalysisReport,
): ShervOSReviewSummary {
  return {
    componentName: report.componentName,
    primaryType: report.primaryType,
    score: report.summary.score,
    totalIssues: report.summary.totalIssues,
    criticalCount: report.summary.criticalCount,
    warningCount: report.summary.warningCount,
    infoCount: report.summary.infoCount,
    statesCovered: report.summary.statesCovered,
    statesTotal: report.summary.statesTotal,
    missingRequiredStates: report.stateCoverage
      .filter((state) => state.required && !state.present)
      .map((state) => state.state),
    findings: report.issues.slice(0, MAX_FINDINGS).map(normalizeFinding),
    previewDomChecked: report.previewDomChecked,
    previewViolationCount: report.axeViolations.length,
  };
}
