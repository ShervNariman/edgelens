import type { AnalysisReport } from "@/types/analysis";

/**
 * Strip volatile fields so reports can be compared for determinism.
 * `id` and `analyzedAt` intentionally use wall-clock values at analysis time.
 */
export function stableReport(report: AnalysisReport) {
  return {
    sourceCode: report.sourceCode,
    componentName: report.componentName,
    primaryType: report.primaryType,
    detectedComponents: report.detectedComponents,
    stateCoverage: report.stateCoverage,
    issues: report.issues,
    a11yTree: report.a11yTree,
    axeViolations: report.axeViolations,
    previewDomChecked: report.previewDomChecked,
    suggestedFixes: report.suggestedFixes,
    summary: report.summary,
    parseErrors: report.parseErrors,
  };
}

export function stableFingerprint(report: AnalysisReport): string {
  return JSON.stringify(stableReport(report));
}

export function issueIndex(report: AnalysisReport) {
  return report.issues.map((issue) => ({
    id: issue.id,
    category: issue.category,
    severity: issue.severity,
    source: issue.source,
    state: issue.state ?? null,
    title: issue.title,
  }));
}
