import type {
  AnalysisIssue,
  AnalysisReport,
  AnalysisSummary,
  AxeViolation,
  ComponentState,
  DetectedComponent,
  DetectedComponentType,
  StateCoverage,
  SuggestedFix,
} from "@/types/analysis";
import { captureEvent } from "./analytics";
import { detectComponents, extractComponentName, parseSource } from "./parser";
import { checkMissingStates } from "./rules/states";
import { checkAccessibility } from "./rules/a11y";
import { checkPatterns } from "./rules/patterns";
import { buildSuggestedFixes } from "./fixes";
import { buildA11yTree } from "./a11y-tree";
import { inferPrimaryType } from "./preview-meta";

const REQUIRED_STATES: ComponentState[] = [
  "default",
  "hover",
  "focus",
  "disabled",
];

const OPTIONAL_STATES: ComponentState[] = [
  "active",
  "loading",
  "error",
  "empty",
];

function computeScore(issues: AnalysisIssue[], coverage: StateCoverage[]): number {
  let score = 100;

  for (const issue of issues) {
    if (issue.severity === "critical") score -= 12;
    else if (issue.severity === "warning") score -= 6;
    else score -= 2;
  }

  const requiredMissing = coverage.filter((s) => s.required && !s.present).length;
  score -= requiredMissing * 5;

  return Math.max(0, Math.min(100, Math.round(score)));
}

function buildSummary(
  issues: AnalysisIssue[],
  coverage: StateCoverage[],
  components: DetectedComponent[]
): AnalysisSummary {
  return {
    score: computeScore(issues, coverage),
    totalIssues: issues.length,
    criticalCount: issues.filter((i) => i.severity === "critical").length,
    warningCount: issues.filter((i) => i.severity === "warning").length,
    infoCount: issues.filter((i) => i.severity === "info").length,
    statesCovered: coverage.filter((s) => s.present).length,
    statesTotal: coverage.length,
    componentsDetected: components.length,
  };
}

export function analyzeComponent(
  sourceCode: string,
  options?: { axeViolations?: AxeViolation[] }
): AnalysisReport {
  const id = `analysis-${Date.now()}`;
  const analyzedAt = new Date().toISOString();
  const trimmed = sourceCode.trim();
  const previewDomChecked = options?.axeViolations !== undefined;
  const axeViolations = options?.axeViolations ?? [];

  if (!trimmed) {
    return {
      id,
      analyzedAt,
      sourceCode,
      componentName: null,
      primaryType: "Unknown",
      detectedComponents: [],
      stateCoverage: [],
      issues: [
        {
          id: "empty-source",
          category: "pattern",
          severity: "critical",
          source: "static",
          title: "No source code provided",
          description: "Paste a React/shadcn component to analyze.",
          suggestion: "Paste JSX/TSX from Cursor or your editor, then click Analyze.",
        },
      ],
      a11yTree: [],
      axeViolations: [],
      previewDomChecked: false,
      suggestedFixes: [],
      summary: {
        score: 0,
        totalIssues: 1,
        criticalCount: 1,
        warningCount: 0,
        infoCount: 0,
        statesCovered: 0,
        statesTotal: 0,
        componentsDetected: 0,
      },
      parseErrors: ["Empty source"],
    };
  }

  const { ast, errors: parseErrors } = parseSource(trimmed);
  const componentName = extractComponentName(ast, trimmed);
  const detectedComponents = detectComponents(ast, trimmed);
  const primaryType = inferPrimaryType(detectedComponents, trimmed);

  const stateIssues = checkMissingStates(trimmed, primaryType, detectedComponents).map(
    (issue) => ({ ...issue, source: "state-rule" as const })
  );
  const a11yIssues = checkAccessibility(trimmed, detectedComponents).map((issue) => ({
    ...issue,
    source: "a11y-rule" as const,
  }));
  const patternIssues = checkPatterns(trimmed, detectedComponents).map((issue) => ({
    ...issue,
    source: "static" as const,
  }));
  const axeIssues = axeViolationsToIssues(axeViolations);

  const issues: AnalysisIssue[] = [
    ...stateIssues,
    ...a11yIssues,
    ...axeIssues,
    ...patternIssues,
  ];

  const stateCoverage = buildStateCoverage(trimmed, primaryType, stateIssues);
  const suggestedFixes: SuggestedFix[] = buildSuggestedFixes(issues, trimmed, primaryType);
  const a11yTree = buildA11yTree(trimmed, detectedComponents, [
    ...a11yIssues,
    ...axeIssues,
  ]);
  const summary = buildSummary(issues, stateCoverage, detectedComponents);

  const report: AnalysisReport = {
    id,
    analyzedAt,
    sourceCode: trimmed,
    componentName,
    primaryType,
    detectedComponents,
    stateCoverage,
    issues,
    a11yTree,
    axeViolations,
    previewDomChecked,
    suggestedFixes,
    summary,
    parseErrors,
  };

  // The first deterministic pass is the product activation event. The later
  // axe merge reuses this function and must not double-count activation.
  if (!previewDomChecked) {
    captureEvent("analysis_completed", {
      score: summary.score,
      issue_count: summary.totalIssues,
      critical_count: summary.criticalCount,
      warning_count: summary.warningCount,
      states_covered: summary.statesCovered,
      states_total: summary.statesTotal,
      components_detected: summary.componentsDetected,
      primary_type: primaryType,
      parse_error_count: parseErrors.length,
    });
  }

  return report;
}

function axeViolationsToIssues(violations: AxeViolation[]): AnalysisIssue[] {
  return violations.map((v) => ({
    id: `axe-${v.id}`,
    category: "accessibility" as const,
    severity:
      v.impact === "critical" || v.impact === "serious"
        ? ("critical" as const)
        : v.impact === "moderate"
          ? ("warning" as const)
          : ("info" as const),
    source: "preview" as const,
    title: v.help,
    description: v.description,
    suggestion: `See axe rule “${v.id}” — ${v.helpUrl}`,
    a11yRuleId: v.id,
  }));
}

function buildStateCoverage(
  source: string,
  primaryType: DetectedComponentType,
  stateIssues: AnalysisIssue[]
): StateCoverage[] {
  const lower = source.toLowerCase();
  const missing = new Set(
    stateIssues
      .filter((i) => i.category === "missing-state" && i.state)
      .map((i) => i.state as ComponentState)
  );

  const evidenceFor = (state: ComponentState): string | undefined => {
    const patterns: Record<ComponentState, RegExp[]> = {
      default: [/variant\s*=/, /className\s*=/, /return\s*\(/],
      hover: [/hover:/, /onMouseEnter/, /onMouseOver/, /group-hover/],
      focus: [/focus:/, /focus-visible:/, /onFocus/, /ring-/],
      active: [/active:/, /data-\[state=active\]/, /aria-pressed/, /pressed/],
      disabled: [/disabled/, /aria-disabled/, /opacity-50/, /pointer-events-none/],
      loading: [/loading/, /isLoading/, /pending/, /Spinner/, /Loader/, /aria-busy/],
      error: [/error/, /destructive/, /aria-invalid/, /invalid/],
      empty: [/empty/, /no results/i, /length\s*===\s*0/, /EmptyState/, /Empty\s*State/],
    };
    for (const re of patterns[state]) {
      if (re.test(source)) return re.source;
    }
    return undefined;
  };

  const interactive =
    primaryType === "Button" ||
    primaryType === "Select" ||
    primaryType === "Input" ||
    primaryType === "Textarea" ||
    primaryType === "Checkbox" ||
    primaryType === "Switch" ||
    primaryType === "Dialog" ||
    primaryType === "DropdownMenu" ||
    primaryType === "Form";

  const needsLoading =
    primaryType === "Button" ||
    primaryType === "Form" ||
    primaryType === "Card" ||
    /submit|save|create|refresh/i.test(source);
  const needsError =
    primaryType === "Form" ||
    primaryType === "Input" ||
    primaryType === "Textarea" ||
    primaryType === "Alert" ||
    primaryType === "Card";
  const needsEmpty =
    primaryType === "Select" ||
    primaryType === "Tabs" ||
    primaryType === "Card" ||
    /map\s*\(/.test(source) ||
    /items?\s*=/.test(lower);

  return [
    ...REQUIRED_STATES.map((state) => ({
      state,
      present: !missing.has(state) && Boolean(evidenceFor(state) || state === "default"),
      evidence: evidenceFor(state),
      required: interactive || state === "default",
    })),
    ...OPTIONAL_STATES.map((state) => {
      const required =
        (state === "loading" && needsLoading) ||
        (state === "error" && needsError) ||
        (state === "empty" && needsEmpty) ||
        (state === "active" && (primaryType === "Tabs" || primaryType === "Button"));
      return {
        state,
        present: !missing.has(state) && Boolean(evidenceFor(state)),
        evidence: evidenceFor(state),
        required,
      };
    }),
  ];
}

export { REQUIRED_STATES, OPTIONAL_STATES };
