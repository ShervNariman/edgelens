import type {
  AnalysisIssue,
  AnalysisReport,
  AnalysisSummary,
  AxeViolation,
  ComponentState,
  DetectedComponent,
  DetectedComponentType,
  RequirementLevel,
  StateCoverage,
  SuggestedFix,
} from "@/types/analysis";
import { captureEvent } from "./analytics";
import { detectComponents, extractComponentName, parseSource } from "./parser";
import { checkMissingStates } from "./rules/states";
import { checkAccessibility } from "./rules/a11y";
import { checkPatterns } from "./rules/patterns";
import {
  buildCheckStatuses,
  dedupeIssues,
  stripUnreliableLocations,
  withDefaultEvidence,
} from "./rules/postprocess";
import { buildSuggestedFixes } from "./fixes";
import { buildA11yTree } from "./a11y-tree";
import { inferPrimaryType } from "./preview-meta";

const BASE_STATES: ComponentState[] = [
  "default",
  "hover",
  "focus",
  "disabled",
  "active",
  "loading",
  "error",
  "empty",
  "success",
  "selected",
];

function computeScore(issues: AnalysisIssue[], coverage: StateCoverage[]): number {
  let score = 100;

  for (const issue of issues) {
    // Low-confidence findings weigh less so triage stays calm
    const weight =
      issue.confidence === "low" ? 0.5 : issue.confidence === "medium" ? 0.85 : 1;
    if (issue.severity === "critical") score -= 12 * weight;
    else if (issue.severity === "warning") score -= 6 * weight;
    else score -= 2 * weight;
  }

  const requiredMissing = coverage.filter(
    (s) => s.requirement === "required" && !s.present
  ).length;
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
    highConfidenceCount: issues.filter((i) => i.confidence === "high").length,
    mediumConfidenceCount: issues.filter((i) => i.confidence === "medium").length,
    lowConfidenceCount: issues.filter((i) => i.confidence === "low").length,
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
          evidence: "empty trimmed source",
          confidence: "high",
          requirement: "required",
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
        highConfidenceCount: 1,
        mediumConfidenceCount: 0,
        lowConfidenceCount: 0,
      },
      parseErrors: ["Empty source"],
      checkStatuses: [
        {
          id: "empty-source",
          label: "All rules",
          status: "skipped",
          reason: "No source code was provided.",
        },
      ],
      locationsUnreliable: false,
    };
  }

  const { ast, errors: parseErrors } = parseSource(trimmed);
  const locationsUnreliable = parseErrors.length > 0;
  const componentName = extractComponentName(ast, trimmed);
  const detectedComponents = detectComponents(ast, trimmed);
  const primaryType = inferPrimaryType(detectedComponents, trimmed);

  const stateIssues = checkMissingStates(trimmed, primaryType, detectedComponents).map(
    (issue) => ({
      ...withDefaultEvidence(issue),
      source: "state-rule" as const,
    })
  );
  const a11yIssues = checkAccessibility(trimmed, detectedComponents).map((issue) => ({
    ...withDefaultEvidence(issue),
    source: "a11y-rule" as const,
  }));
  const patternIssues = checkPatterns(trimmed, detectedComponents).map((issue) => ({
    ...withDefaultEvidence(issue),
    source: "static" as const,
  }));
  const axeIssues = axeViolationsToIssues(axeViolations);

  let issues: AnalysisIssue[] = dedupeIssues([
    ...stateIssues,
    ...a11yIssues,
    ...axeIssues,
    ...patternIssues,
  ]);
  issues = stripUnreliableLocations(issues, locationsUnreliable);

  const stateCoverage = buildStateCoverage(trimmed, primaryType, stateIssues);
  const suggestedFixes: SuggestedFix[] = buildSuggestedFixes(issues, trimmed, primaryType);
  const a11yTree = buildA11yTree(trimmed, detectedComponents, [
    ...a11yIssues,
    ...axeIssues,
  ]);
  const summary = buildSummary(issues, stateCoverage, detectedComponents);
  const checkStatuses = buildCheckStatuses({
    parseErrors,
    locationsUnreliable,
    primaryType,
    componentsDetected: detectedComponents.length,
    previewDomChecked,
    source: trimmed,
  });

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
    checkStatuses,
    locationsUnreliable,
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
    evidence: `axe-core violation id=${v.id} nodes=${v.nodes}`,
    confidence: (v.impact === "critical" || v.impact === "serious"
      ? "high"
      : v.impact === "moderate"
        ? "medium"
        : "low") as AnalysisIssue["confidence"],
    requirement: "recommended" as const,
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
      success: [/success/, /isSuccess/, /toast\(/i, /CheckCircle/],
      selected: [
        /selected/,
        /aria-checked/,
        /aria-selected/,
        /data-\[state=checked\]/,
        /checked\s*=/,
      ],
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
    primaryType === "Sheet" ||
    primaryType === "DropdownMenu" ||
    primaryType === "Form" ||
    primaryType === "Popover";

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
    /\.map\s*\(/.test(source) ||
    /items?\s*=/.test(lower);
  const needsSelected =
    primaryType === "Checkbox" ||
    primaryType === "Switch" ||
    primaryType === "Tabs" ||
    primaryType === "Select";
  const needsSuccess =
    primaryType === "Form" ||
    primaryType === "Dialog" ||
    primaryType === "Sheet";
  const needsActive = primaryType === "Tabs" || primaryType === "Button";

  const requirementFor = (state: ComponentState): RequirementLevel => {
    if (state === "default") return "required";
    if (state === "hover" || state === "focus" || state === "disabled") {
      return interactive ? "required" : "optional";
    }
    if (state === "loading") return needsLoading ? "required" : "optional";
    if (state === "error") return needsError ? "required" : "optional";
    if (state === "empty") return needsEmpty ? "recommended" : "optional";
    if (state === "active") return needsActive ? "recommended" : "optional";
    if (state === "selected") return needsSelected ? "recommended" : "optional";
    if (state === "success") return needsSuccess ? "optional" : "optional";
    return "optional";
  };

  return BASE_STATES.map((state) => {
    const requirement = requirementFor(state);
    const evidence = evidenceFor(state);
    const present =
      !missing.has(state) &&
      Boolean(evidence || state === "default");
    return {
      state,
      present,
      evidence,
      required: requirement === "required",
      requirement,
    };
  });
}

export { BASE_STATES as REQUIRED_STATES };
export const OPTIONAL_STATES: ComponentState[] = [
  "active",
  "loading",
  "error",
  "empty",
  "success",
  "selected",
];
