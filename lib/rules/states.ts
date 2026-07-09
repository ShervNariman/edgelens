import type {
  AnalysisIssue,
  ComponentState,
  DetectedComponent,
  DetectedComponentType,
  RawAnalysisIssue,
} from "@/types/analysis";

interface StateRule {
  state: ComponentState;
  severity: AnalysisIssue["severity"];
  title: string;
  description: string;
  suggestion: string;
  patterns: RegExp[];
  appliesTo: DetectedComponentType[] | "interactive";
  required: boolean;
}

const INTERACTIVE: DetectedComponentType[] = [
  "Button",
  "Select",
  "Input",
  "Textarea",
  "Checkbox",
  "Switch",
  "Dialog",
  "DropdownMenu",
  "Form",
  "Tabs",
];

const STATE_RULES: StateRule[] = [
  {
    state: "hover",
    severity: "warning",
    title: "Missing hover state",
    description:
      "Interactive components should communicate hover affordance via Tailwind hover: utilities or event handlers.",
    suggestion: "Add hover: styles (e.g. hover:bg-accent) or use shadcn Button variants which include hover.",
    patterns: [/hover:/, /onMouseEnter/, /onMouseOver/, /group-hover/],
    appliesTo: "interactive",
    required: true,
  },
  {
    state: "focus",
    severity: "critical",
    title: "Missing focus / focus-visible styles",
    description:
      "Keyboard users need a visible focus indicator. Prefer focus-visible:ring utilities.",
    suggestion: "Add focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring.",
    patterns: [/focus:/, /focus-visible:/, /onFocus/, /ring-offset/, /ring-2/, /ring-ring/],
    appliesTo: "interactive",
    required: true,
  },
  {
    state: "disabled",
    severity: "warning",
    title: "No disabled state handling",
    description:
      "Buttons and form controls typically need a disabled prop and muted styling.",
    suggestion: "Support a disabled prop and styles: disabled:opacity-50 disabled:pointer-events-none.",
    patterns: [/disabled/, /aria-disabled/, /disabled:/],
    appliesTo: "interactive",
    required: true,
  },
  {
    state: "loading",
    severity: "warning",
    title: "No loading / pending state",
    description:
      "Async actions should show a loading state to prevent double-submits and clarify progress.",
    suggestion:
      "Add an isLoading prop that disables the control and shows a Loader2 spinner from lucide-react.",
    patterns: [/loading/, /isLoading/, /pending/, /Spinner/, /Loader/, /aria-busy/],
    appliesTo: ["Button", "Form", "Card", "Dialog"],
    required: true,
  },
  {
    state: "error",
    severity: "warning",
    title: "No error / invalid state",
    description:
      "Form fields and alerts should surface validation or failure states.",
    suggestion:
      "Wire aria-invalid, FormMessage, or a destructive Alert for error feedback.",
    patterns: [/error/, /destructive/, /aria-invalid/, /FormMessage/, /invalid/],
    appliesTo: ["Form", "Input", "Textarea", "Alert", "Select", "Card", "Dialog"],
    required: true,
  },
  {
    state: "empty",
    severity: "info",
    title: "No empty state",
    description:
      "Lists, selects, and mapped collections should handle zero items gracefully.",
    suggestion: "Render an empty placeholder when data length is 0.",
    patterns: [/empty/, /no results/i, /length\s*===\s*0/, /EmptyState/, /Empty\s*State/, /nothing (here|yet)/i],
    appliesTo: ["Select", "Tabs", "Card", "Dialog"],
    required: false,
  },
  {
    state: "active",
    severity: "info",
    title: "No active / pressed state",
    description:
      "Toggle-like or tab triggers benefit from an explicit active/pressed visual.",
    suggestion: "Use data-[state=active] or aria-pressed with matching styles.",
    patterns: [/active:/, /data-\[state=active\]/, /aria-pressed/, /pressed/],
    appliesTo: ["Tabs"],
    required: false,
  },
];

function applies(
  rule: StateRule,
  primary: DetectedComponentType,
  components: DetectedComponent[]
): boolean {
  const types = new Set(components.map((c) => c.type));
  types.add(primary);

  if (rule.appliesTo === "interactive") {
    return [...types].some((t) => INTERACTIVE.includes(t));
  }
  return rule.appliesTo.some((t) => types.has(t));
}

export function checkMissingStates(
  source: string,
  primaryType: DetectedComponentType,
  components: DetectedComponent[]
): RawAnalysisIssue[] {
  const issues: RawAnalysisIssue[] = [];

  // If using shadcn Button without custom className, hover/focus often come from the primitive
  const usesShadcnButton =
    components.some((c) => c.type === "Button") &&
    /from\s+["']@\/components\/ui\/button["']/.test(source);

  for (const rule of STATE_RULES) {
    if (!applies(rule, primaryType, components)) continue;

    const present = rule.patterns.some((re) => re.test(source));
    if (present) continue;

  // Soft-pass: shadcn Button primitive includes hover/focus/disabled by default
    // Exception: icon-only / size="icon" buttons still need explicit a11y + state props
    const isIconButton =
      /size\s*=\s*["']icon["']/.test(source) ||
      /<Button[^>]*>\s*<[A-Z][A-Za-z0-9.]*[^>]*\/>\s*<\/Button>/.test(source);

    if (
      usesShadcnButton &&
      !isIconButton &&
      (rule.state === "hover" || rule.state === "focus" || rule.state === "disabled") &&
      !/className\s*=/.test(source)
    ) {
      continue;
    }

    // Icon buttons: still require explicit disabled/loading (and focus if className overrides)
    if (
      usesShadcnButton &&
      isIconButton &&
      rule.state === "hover" &&
      !/className\s*=/.test(source)
    ) {
      continue;
    }

    // Still flag if they override className without those utilities
    if (
      usesShadcnButton &&
      (rule.state === "hover" || rule.state === "focus") &&
      /className\s*=/.test(source) &&
      !rule.patterns.some((re) => re.test(source))
    ) {
      // keep flagging
    }

    if (!rule.required && primaryType === "Unknown" && components.length === 0) {
      continue;
    }

    issues.push({
      id: `state-${rule.state}`,
      category: "missing-state",
      severity: rule.required ? rule.severity : "info",
      title: rule.title,
      description: rule.description,
      state: rule.state,
      suggestion: rule.suggestion,
      element: primaryType,
    });
  }

  return issues;
}
