import type { DetectedComponent, RawAnalysisIssue } from "@/types/analysis";

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
      suggestion: "Consider const [open, setOpen] = useState(false) with open/onOpenChange.",
      element: "Dialog",
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
      description: "Forms should define onSubmit (or action) and handle pending/error states.",
      suggestion: "Add onSubmit with preventDefault and async handling + loading UI.",
      element: "Form",
    });
  }

  // Hard-coded colors that fight theme
  if (/className\s*=\s*\{?["'`][^"'`]*\b(?:bg-blue-|text-blue-|bg-purple-|text-purple-)/.test(source)) {
    issues.push({
      id: "pattern-hardcoded-color",
      category: "pattern",
      severity: "info",
      title: "Hard-coded palette utilities",
      description:
        "Prefer theme tokens (bg-primary, text-muted-foreground) so dark mode and brand tokens work.",
      suggestion: "Replace blue-/purple- utilities with semantic tokens from your theme.",
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
      suggestion: "Add key={item.id} (or another stable unique value) to the mapped element.",
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
      suggestion: "Expose isLoading / error props and render those branches declaratively.",
    });
  }

  // No empty check before map
  if (/\.map\s*\(/.test(source) && !/length|\?\.|empty|items\s*\?\s*items/.test(source)) {
    // soft signal only if we didn't already flag empty state elsewhere heavily
    if (!types.has("Select")) {
      issues.push({
        id: "pattern-map-unguarded",
        category: "interaction",
        severity: "info",
        title: "Mapped list without empty guard",
        description: "Consider guarding .map with an empty-state branch.",
        suggestion: "if (!items?.length) return <EmptyState />",
      });
    }
  }

  return issues;
}
