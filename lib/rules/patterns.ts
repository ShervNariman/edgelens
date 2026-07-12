import type {
  DetectedComponent,
  RawAnalysisIssue,
} from "@/types/analysis";

export function checkPatterns(
  source: string,
  components: DetectedComponent[]
): RawAnalysisIssue[] {
  const issues: RawAnalysisIssue[] = [];
  const types = new Set(components.map((c) => c.type));

  // Raw button instead of shadcn Button when looking like a UI kit component
  if (
    /<button[\s>]/.test(source) &&
    !/<Button[\s>]/.test(source) &&
    (/className\s*=/.test(source) || components.length > 0)
  ) {
    issues.push({
      id: "pattern-raw-button",
      category: "pattern",
      severity: "info",
      title: "Native <button> instead of shadcn Button",
      description:
        "For design-system consistency, prefer the shadcn Button primitive which ships with focus/hover/disabled styles.",
      suggestion: 'Import Button from "@/components/ui/button".',
      element: "button",
      evidence: "native <button> with className/UI context and no <Button>",
      confidence: "low",
      requirement: "optional",
    });
  }

  // Dialog without controlled open state hints
  if (types.has("Dialog") && !/open\s*=/.test(source) && !/onOpenChange\s*=/.test(source)) {
    issues.push({
      id: "pattern-dialog-uncontrolled",
      category: "pattern",
      severity: "info",
      title: "Dialog may lack controlled state",
      description:
        "Production dialogs often need controlled open/onOpenChange for loading, confirm, and error flows.",
      suggestion:
        "Consider const [open, setOpen] = useState(false) with open/onOpenChange.",
      element: "Dialog",
      evidence: "Dialog without open=/onOpenChange=",
      confidence: "low",
      requirement: "optional",
    });
  }

  // Form submit without preventDefault / action handling
  if (
    (types.has("Form") || /<form[\s>]/.test(source)) &&
    !/onSubmit\s*=/.test(source) &&
    !/action\s*=/.test(source)
  ) {
    issues.push({
      id: "pattern-form-submit",
      category: "interaction",
      severity: "warning",
      title: "Form missing submit handler",
      description:
        "Forms should define onSubmit (or action) and handle pending/error states.",
      suggestion: "Add onSubmit with preventDefault and async handling + loading UI.",
      element: "Form",
      evidence: "<form>/Form without onSubmit= or action=",
      confidence: "high",
      requirement: "required",
    });
  }

  // Hard-coded colors that fight theme
  if (
    /className\s*=\s*\{?["'`][^"'`]*\b(?:bg-blue-|text-blue-|bg-purple-|text-purple-)/.test(
      source
    )
  ) {
    issues.push({
      id: "pattern-hardcoded-color",
      category: "pattern",
      severity: "info",
      title: "Hard-coded palette utilities",
      description:
        "Prefer theme tokens (bg-primary, text-muted-foreground) so dark mode and brand tokens work.",
      suggestion: "Replace blue-/purple- utilities with semantic tokens from your theme.",
      evidence: "className contains bg-blue-/text-blue-/bg-purple-/text-purple-",
      confidence: "medium",
      requirement: "optional",
    });
  }

  // Missing key in map
  if (/\.map\s*\(/.test(source) && !/key\s*=/.test(source)) {
    issues.push({
      id: "pattern-missing-key",
      category: "pattern",
      severity: "warning",
      title: "List render may be missing key",
      description: "Mapped JSX children should include a stable key prop.",
      suggestion:
        "Add key={item.id} (or another stable unique value) to the mapped element.",
      evidence: ".map( present without key=",
      confidence: "high",
      requirement: "required",
    });
  }

  // useEffect for derived UI that should be state machine / props
  if (/useEffect\s*\(/.test(source) && /setLoading|setError|setDisabled/.test(source)) {
    issues.push({
      id: "pattern-effect-state",
      category: "interaction",
      severity: "info",
      title: "Edge states driven only via useEffect",
      description:
        "Loading/error/disabled are often clearer as explicit props or render states rather than effect-only flags.",
      suggestion:
        "Expose isLoading / error props and render those branches declaratively.",
      evidence: "useEffect with setLoading/setError/setDisabled",
      confidence: "low",
      requirement: "optional",
    });
  }

  // No empty check before map
  if (/\.map\s*\(/.test(source) && !/length|\?\.|empty|items\s*\?\s*items/.test(source)) {
    if (!types.has("Select")) {
      issues.push({
        id: "pattern-map-unguarded",
        category: "interaction",
        severity: "info",
        title: "Mapped list without empty guard",
        description: "Consider guarding .map with an empty-state branch.",
        suggestion: "if (!items?.length) return <EmptyState />",
        evidence: ".map( without length/?./empty guard nearby",
        confidence: "low",
        requirement: "optional",
      });
    }
  }

  // Select placeholder / label gap when SelectValue exists but no Label
  if (
    types.has("Select") &&
    /<SelectValue[\s/>]/.test(source) &&
    !/<Label[\s>]/.test(source) &&
    !/htmlFor\s*=/.test(source) &&
    !/aria-label\s*=/.test(source) &&
    !/<FormLabel/.test(source)
  ) {
    issues.push({
      id: "pattern-select-label",
      category: "pattern",
      severity: "info",
      title: "Select missing visible Label",
      description:
        "SelectValue handles the value display, but a Label (or aria-label) still helps sighted and AT users.",
      suggestion: "Pair the Select with <Label> or aria-label on SelectTrigger.",
      element: "Select",
      evidence: "SelectValue present without Label/htmlFor/aria-label",
      confidence: "medium",
      requirement: "recommended",
    });
  }

  // Refresh button without loading affordance (common AI list pattern)
  if (
    /Refresh|refetch|reload/i.test(source) &&
    /<Button[\s>]/.test(source) &&
    !/isRefreshing|isLoading|pending|Loader|Spinner|aria-busy/.test(source)
  ) {
    issues.push({
      id: "pattern-refresh-loading",
      category: "interaction",
      severity: "info",
      title: "Refresh action without pending cue",
      description:
        "Refresh controls should show pending feedback and avoid stacked refreshes.",
      suggestion:
        "Disable the Refresh button while fetching and show a spinner or aria-busy.",
      evidence: "Refresh/refetch label on Button without loading/pending cue",
      confidence: "medium",
      requirement: "recommended",
    });
  }

  return issues;
}
