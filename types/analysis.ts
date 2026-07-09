export type IssueSeverity = "critical" | "warning" | "info";

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
  | "empty";

export type DetectedComponentType =
  | "Button"
  | "Dialog"
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
  /** @deprecated prefer problem + whyItMatters */
  description?: string;
  before?: string;
  after: string;
  language: "tsx" | "jsx" | "ts" | "js";
}

export interface AnalyzeOptions {
  runAxe?: boolean;
}
