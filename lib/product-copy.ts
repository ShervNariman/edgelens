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
