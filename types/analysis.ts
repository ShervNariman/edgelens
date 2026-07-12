export type IssueSeverity = "critical" | "warning" | "info";

/** Deterministic confidence for triage — low findings are visually de-emphasized. */
export type IssueConfidence = "high" | "medium" | "low";

/** How strongly a state/check is expected for this component type. */
export type RequirementLevel = "required" | "recommended" | "optional";

/** Where a finding came from — shown as trust badges in the report. */
export type IssueSource =
  | "static"
  | "preview"
  | "state-rule"
  | "a11y-rule";

export type IssueCategory =
  | "missing-state"
  | "accessibility"
  | "pattern"
  | "interaction";

export type ComponentState =
  | "default"
  | "hover"
  | "focus"
  | "active"
  | "disabled"
  | "loading"
  | "error"
  | "empty"
  | "success"
  | "selected";

export type DetectedComponentType =
  | "Button"
  | "Dialog"
  | "Sheet"
  | "Select"
  | "Input"
  | "Textarea"
  | "Checkbox"
  | "Switch"
  | "Tabs"
  | "Card"
  | "Form"
  | "Alert"
  | "DropdownMenu"
  | "Popover"
  | "Tooltip"
  | "Unknown";

export interface CodeLocation {
  line: number;
  column: number;
  endLine?: number;
  endColumn?: number;
}

export interface AnalysisIssue {
  id: string;
  category: IssueCategory;
  severity: IssueSeverity;
  /** Provenance for trust / demo clarity */
  source: IssueSource;
  title: string;
  description: string;
  state?: ComponentState;
  location?: CodeLocation;
  element?: string;
  suggestion: string;
  fixSnippet?: string;
  a11yRuleId?: string;
  /** Deterministic signal that triggered this finding (regex/token/heuristic id). */
  evidence: string;
  /** Triage confidence — low items should be visually de-emphasized. */
  confidence: IssueConfidence;
  /** Whether this check is required / recommended / optional for the detected type. */
  requirement: RequirementLevel;
}

/** Issue from a rule engine before provenance is attached. */
export type RawAnalysisIssue = Omit<AnalysisIssue, "source">;

export interface DetectedComponent {
  name: string;
  type: DetectedComponentType;
  props: string[];
  hasChildren: boolean;
  location?: CodeLocation;
}

export interface StateCoverage {
  state: ComponentState;
  present: boolean;
  evidence?: string;
  required: boolean;
  requirement: RequirementLevel;
}

/** Explains why a check did not run or was inconclusive. */
export interface CheckStatus {
  id: string;
  label: string;
  status: "skipped" | "inconclusive";
  reason: string;
}

export interface A11yNode {
  role: string;
  name: string;
  tag?: string;
  issues: string[];
  children?: A11yNode[];
}

export interface AnalysisSummary {
  score: number;
  totalIssues: number;
  criticalCount: number;
  warningCount: number;
  infoCount: number;
  statesCovered: number;
  statesTotal: number;
  componentsDetected: number;
  highConfidenceCount: number;
  mediumConfidenceCount: number;
  lowConfidenceCount: number;
}

export interface AxeViolation {
  id: string;
  impact: string | null | undefined;
  description: string;
  help: string;
  helpUrl: string;
  nodes: number;
}

export interface AnalysisReport {
  id: string;
  analyzedAt: string;
  sourceCode: string;
  componentName: string | null;
  primaryType: DetectedComponentType;
  detectedComponents: DetectedComponent[];
  stateCoverage: StateCoverage[];
  issues: AnalysisIssue[];
  a11yTree: A11yNode[];
  axeViolations: AxeViolation[];
  /** True once axe-core has run on the simulated preview (even if zero violations). */
  previewDomChecked: boolean;
  suggestedFixes: SuggestedFix[];
  summary: AnalysisSummary;
  parseErrors: string[];
  /** Checks that did not run or were inconclusive (parser recovery, missing cues, etc.). */
  checkStatuses: CheckStatus[];
  /** True when parse recovery makes line/column locations unreliable. */
  locationsUnreliable: boolean;
}

export interface SuggestedFix {
  id: string;
  issueId: string;
  title: string;
  /** Short problem statement */
  problem: string;
  /** Why this matters for UX / a11y */
  whyItMatters: string;
  /** What to do */
  suggestion: string;
  /** Manual adaptation note for copyable snippets */
  adaptNote?: string;
  /** @deprecated prefer problem + whyItMatters */
  description?: string;
  before?: string;
  after: string;
  language: "tsx" | "jsx" | "ts" | "js";
}

export interface AnalyzeOptions {
  runAxe?: boolean;
}
