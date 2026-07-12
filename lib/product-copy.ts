/**
 * Shared EdgeLens MVP positioning copy.
 * Keep claims narrow: state completeness first, a11y as supporting risk detection.
 */

export const PRODUCT_NAME = "EdgeLens";

/** Strongest launch framing (SHE-19). */
export const LAUNCH_FRAMING =
  "EdgeLens is a local deterministic pre-flight checker for generated React/shadcn UI. It helps catch missing loading, empty, error, disabled, focus, active, selected states and common shadcn/Radix accessibility gotchas before components ship.";

/** Short hero / tagline — state completeness is the hero feature. */
export const HERO_TAGLINE =
  "Pre-flight checks for the UI states AI-generated React/shadcn components often skip.";

/** Supporting line — a11y is secondary, not certification. */
export const HERO_SUPPORT =
  "Force missing loading, empty, error, disabled, and focus states — plus common shadcn/Radix accessibility risks — before you ship.";

/** Main demo story for /record/edgelens and launch capture. */
export const DEMO_STORY =
  "The component looked done on the happy path until EdgeLens forced the states AI forgot.";

/**
 * Visible limitation copy — honest, not overwhelming.
 * Required in-app (SHE-19).
 */
export const LIMITATION_COPY =
  "EdgeLens is a rule-based pre-flight checker. It flags common UI state and accessibility risks in React/shadcn components. It can miss issues and produce false positives. It does not certify WCAG compliance or replace manual keyboard testing, screen-reader testing, axe, Storybook, or full QA.";

/** Document title / meta description (keep aligned with LAUNCH_FRAMING). */
export const META_TITLE = "EdgeLens — Pre-flight for React/shadcn UI states";
export const META_DESCRIPTION =
  "Local deterministic pre-flight checker for generated React/shadcn UI. Catch missing loading, empty, error, disabled, and focus states — plus common shadcn/Radix accessibility gotchas — before components ship.";

/** Analyzer workflow strip — progressive disclosure of the primary path. */
export const WORKFLOW_STEPS = [
  {
    id: "source",
    label: "Source",
    href: "#analyzer-source",
    blurb: "Paste or load an example",
  },
  {
    id: "preview",
    label: "Preview",
    href: "#analyzer-preview",
    blurb: "Force states the happy path hid",
  },
  {
    id: "report",
    label: "Findings",
    href: "#analyzer-report",
    blurb: "Review layers and score",
  },
  {
    id: "fixes",
    label: "Fixes",
    href: "#analyzer-report",
    blurb: "Copy deterministic templates",
  },
] as const;

export const ANALYZER_COPY = {
  heading: "Analyzer",
  intro:
    "Paste or load an example, analyze, force missing states, then review findings and copy fixes.",
  sourceTitle: "Component source",
  sourceHelp:
    "Intentionally imperfect AI-style shadcn components — load one, then Analyze.",
  sourceHelpCompact: "Preloaded launch demo — swap examples anytime.",
  exampleRevealLabel: "This example should reveal…",
  exampleAnalyzeHint: "Click Analyze to generate the report",
  previewTitle: "Forced state preview",
  previewSimulated:
    "Simulated preview — illustrative only. Controls inside are not part of the product UI.",
  reportTitle: "Analysis report",
  scoreDisclaimer:
    "Score is heuristic — weighted toward state completeness, with supporting static and preview risk signals. Not a WCAG score.",
  stateHeroLabel: "State completeness · hero check",
  analyzing: "Checking state completeness…",
  previewDomPending: "Running preview DOM checks…",
  previewDomDone: "Preview DOM checks complete",
  noAnalysisYet: "No analysis yet",
  noAnalysisHint:
    "Load an example or paste a component, then click Analyze. State completeness is the primary check.",
  sourceOverLimit:
    "Source is too large to analyze in the browser. Trim the file or paste a single component (max 80k characters).",
  sourceWarn:
    "Large source may slow analysis. Prefer a single component under ~40k characters.",
  copiedFix: "Copied fix to clipboard",
  copyFailed: "Could not copy — select the snippet and copy manually",
  analysisComplete: (issueCount: number) =>
    issueCount === 0
      ? "Analysis complete. No issues flagged."
      : `Analysis complete. ${issueCount} issue${issueCount === 1 ? "" : "s"} found.`,
  analysisFailed: "Analysis failed",
} as const;

export const PREVIEW_STATE_GUIDANCE = {
  default: "Baseline appearance when no interaction is applied.",
  hover: "Add hover: utilities or rely on shadcn primitive hover styles.",
  focus: "Add focus-visible:ring styles for keyboard users.",
  active: "Use active: or data-[state=active] for pressed/selected feedback.",
  disabled: "Support a disabled prop with muted opacity and pointer-events-none.",
  loading: "Expose isLoading — disable the control and show a spinner.",
  error: "Surface validation/failure with aria-invalid or a destructive Alert.",
  empty: "Guard empty collections with a placeholder before mapping items.",
} as const;

/** Report section labels — keep the four check layers distinct. */
export const CHECK_LAYERS = {
  states: {
    id: "states",
    label: "State completeness",
    short: "States",
    blurb:
      "Hero check: missing loading, empty, error, disabled, focus, hover, active, and selected-style states.",
  },
  static: {
    id: "static",
    label: "Static JSX / shadcn",
    short: "Static",
    blurb:
      "Source heuristics for icon-only names, Dialog title/description gaps, and suspicious Radix/shadcn composition.",
  },
  preview: {
    id: "preview",
    label: "Preview DOM",
    short: "Preview",
    blurb:
      "Supporting browser-side checks on the simulated preview DOM (axe-core where available).",
  },
  fixes: {
    id: "fixes",
    label: "Rule-based fixes",
    short: "Fixes",
    blurb:
      "Deterministic before/after templates — review and apply manually in your editor.",
  },
} as const;
