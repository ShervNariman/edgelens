import type { DetectedComponent, RawAnalysisIssue } from "@/types/analysis";

let issueCounter = 0;
function nextId(prefix: string) {
  issueCounter += 1;
  return `${prefix}-${issueCounter}`;
}

export function checkAccessibility(
  source: string,
  components: DetectedComponent[]
): RawAnalysisIssue[] {
  issueCounter = 0;
  const issues: RawAnalysisIssue[] = [];
  const types = new Set(components.map((c) => c.type));

  // Icon-only buttons without accessible name
  const iconOnlyButton =
    /<Button[^>]*>\s*<[A-Z][A-Za-z0-9.]*[^>]*\/>\s*<\/Button>/.test(source) ||
    (/size\s*=\s*["']icon["']/.test(source) &&
      /<Button[\s>]/.test(source) &&
      !/>\s*[A-Za-z]{2,}/.test(source));

  if (
    iconOnlyButton &&
    !/aria-label\s*=/.test(source) &&
    !/sr-only/.test(source) &&
    !/<span[^>]*className=["'][^"']*sr-only/.test(source)
  ) {
    issues.push({
      id: nextId("a11y"),
      category: "accessibility",
      severity: "critical",
      title: "Icon button missing accessible name",
      description:
        "Buttons with only an icon need an aria-label (or visually hidden text) so screen readers can announce them.",
      suggestion: 'Add aria-label="Describe action" to the Button.',
      fixSnippet: `<Button aria-label="Save changes" size="icon">\n  <Save className="h-4 w-4" />\n</Button>`,
      a11yRuleId: "button-name",
      element: "Button",
    });
  }

  // Images without alt
  if (/<img[\s>]/.test(source) && !/alt\s*=/.test(source)) {
    issues.push({
      id: nextId("a11y"),
      category: "accessibility",
      severity: "critical",
      title: "Image missing alt text",
      description: "All <img> elements need an alt attribute (empty for decorative).",
      suggestion: 'Add alt="..." or alt="" for decorative images.',
      a11yRuleId: "image-alt",
      element: "img",
    });
  }

  // Inputs without labels
  if (
    (types.has("Input") || /<input[\s>]/i.test(source) || /<Input[\s/>]/.test(source)) &&
    !/<Label[\s>]/.test(source) &&
    !/htmlFor\s*=/.test(source) &&
    !/aria-label\s*=/.test(source) &&
    !/<FormLabel/.test(source)
  ) {
    issues.push({
      id: nextId("a11y"),
      category: "accessibility",
      severity: "critical",
      title: "Input missing label",
      description:
        "Form controls need an associated <Label htmlFor>, FormLabel, or aria-label.",
      suggestion: "Wrap with FormItem + FormLabel, or pair Label with htmlFor matching the input id.",
      fixSnippet: `<div className="space-y-2">\n  <Label htmlFor="email">Email</Label>\n  <Input id="email" type="email" />\n</div>`,
      a11yRuleId: "label",
      element: "Input",
    });
  }

  // Dialog without DialogTitle (match JSX tag, not comments)
  if (
    types.has("Dialog") &&
    /<DialogContent[\s>]/.test(source) &&
    !/<DialogTitle[\s>]/.test(source)
  ) {
    issues.push({
      id: nextId("a11y"),
      category: "accessibility",
      severity: "critical",
      title: "Dialog missing DialogTitle",
      description:
        "Radix Dialog requires a DialogTitle for screen reader announcement of the dialog.",
      suggestion: "Add <DialogTitle> inside DialogHeader / DialogContent.",
      fixSnippet: `<DialogContent>\n  <DialogHeader>\n    <DialogTitle>Confirm action</DialogTitle>\n    <DialogDescription>This cannot be undone.</DialogDescription>\n  </DialogHeader>\n</DialogContent>`,
      a11yRuleId: "dialog-name",
      element: "Dialog",
    });
  }

  // Dialog without DialogDescription (common Cursor omission)
  if (
    types.has("Dialog") &&
    /<DialogContent[\s>]/.test(source) &&
    /<DialogTitle[\s>]/.test(source) &&
    !/<DialogDescription[\s>]/.test(source)
  ) {
    issues.push({
      id: nextId("a11y"),
      category: "accessibility",
      severity: "warning",
      title: "Dialog missing DialogDescription",
      description:
        "DialogDescription gives assistive tech additional context for the dialog purpose.",
      suggestion: "Add <DialogDescription> under DialogTitle.",
      fixSnippet: `<DialogHeader>\n  <DialogTitle>Settings</DialogTitle>\n  <DialogDescription>Manage your preferences.</DialogDescription>\n</DialogHeader>`,
      a11yRuleId: "dialog-description",
      element: "Dialog",
    });
  }

  // DialogContent with neither title nor description
  if (
    types.has("Dialog") &&
    /<DialogContent[\s>]/.test(source) &&
    !/<DialogTitle[\s>]/.test(source) &&
    !/<DialogDescription[\s>]/.test(source) &&
    !/aria-label\s*=/.test(source)
  ) {
    issues.push({
      id: nextId("a11y"),
      category: "accessibility",
      severity: "warning",
      title: "Dialog missing accessible description",
      description:
        "Provide DialogDescription (or aria-describedby) so users understand the dialog context.",
      suggestion: "Add DialogHeader with DialogTitle and DialogDescription.",
      fixSnippet: `<DialogHeader>\n  <DialogTitle>Settings</DialogTitle>\n  <DialogDescription>Choose your preferred theme.</DialogDescription>\n</DialogHeader>`,
      a11yRuleId: "dialog-description",
      element: "Dialog",
    });
  }

  // Clickable div/span without keyboard support
  if (
    /<(?:div|span)[^>]*onClick\s*=/.test(source) &&
    !/onKeyDown\s*=/.test(source) &&
    !/role\s*=\s*["']button["']/.test(source)
  ) {
    issues.push({
      id: nextId("a11y"),
      category: "accessibility",
      severity: "critical",
      title: "Clickable non-interactive element",
      description:
        "div/span with onClick is not keyboard accessible. Prefer <button> or add role, tabIndex, and onKeyDown.",
      suggestion: "Use <Button> or a native <button>, or add role=\"button\" tabIndex={0} onKeyDown.",
      a11yRuleId: "nested-interactive",
      element: "div",
    });
  }

  // Links that look like buttons without href
  if (/<a[\s>]/.test(source) && !/href\s*=/.test(source)) {
    issues.push({
      id: nextId("a11y"),
      category: "accessibility",
      severity: "warning",
      title: "Anchor without href",
      description: "Anchors used as buttons should be real buttons, or include a valid href.",
      suggestion: "Replace with <Button> or add an href.",
      a11yRuleId: "link-name",
      element: "a",
    });
  }

  // Missing aria-describedby for error messages near inputs
  if (
    (/error/i.test(source) || /FormMessage/.test(source)) &&
    (/<Input/.test(source) || /<input/.test(source)) &&
    !/aria-describedby\s*=/.test(source) &&
    !/aria-invalid\s*=/.test(source)
  ) {
    issues.push({
      id: nextId("a11y"),
      category: "accessibility",
      severity: "warning",
      title: "Error message not linked to control",
      description:
        "Validation messages should be connected via aria-describedby and aria-invalid.",
      suggestion: "Set aria-invalid={!!error} and aria-describedby pointing at the message id.",
      a11yRuleId: "aria-input-field-name",
      element: "Input",
    });
  }

  // Select without accessible value label (ignore comments mentioning SelectValue)
  if (
    types.has("Select") &&
    /<SelectTrigger[\s>]/.test(source) &&
    !/<SelectValue[\s/>]/.test(source) &&
    !/aria-label\s*=/.test(source)
  ) {
    issues.push({
      id: nextId("a11y"),
      category: "accessibility",
      severity: "warning",
      title: "Select missing SelectValue / label",
      description: "SelectTrigger should include SelectValue (and preferably a Label).",
      suggestion: "Add <SelectValue placeholder=\"...\" /> and an associated Label.",
      fixSnippet: `<div className="space-y-2">\n  <Label>Theme</Label>\n  <Select>\n    <SelectTrigger>\n      <SelectValue placeholder="Select a theme" />\n    </SelectTrigger>\n  </Select>\n</div>`,
      a11yRuleId: "select-name",
      element: "Select",
    });
  }

  // Positive: role misuse check
  if (/role\s*=\s*["']button["']/.test(source) && !/tabIndex|tabindex/i.test(source)) {
    issues.push({
      id: nextId("a11y"),
      category: "accessibility",
      severity: "warning",
      title: "role=button without tabIndex",
      description: "Custom buttons need tabIndex={0} to enter the tab order.",
      suggestion: "Add tabIndex={0} and onKeyDown for Enter/Space.",
      a11yRuleId: "aria-command-name",
    });
  }

  return issues;
}
