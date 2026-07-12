import type {
  DetectedComponent,
  IssueConfidence,
  RawAnalysisIssue,
  RequirementLevel,
} from "@/types/analysis";

let issueCounter = 0;
function nextId(prefix: string) {
  issueCounter += 1;
  return `${prefix}-${issueCounter}`;
}

function push(
  issues: RawAnalysisIssue[],
  partial: Omit<RawAnalysisIssue, "id" | "confidence" | "requirement" | "evidence"> & {
    confidence?: IssueConfidence;
    requirement?: RequirementLevel;
    evidence: string;
    id?: string;
  }
) {
  issues.push({
    id: partial.id ?? nextId("a11y"),
    category: partial.category,
    severity: partial.severity,
    title: partial.title,
    description: partial.description,
    suggestion: partial.suggestion,
    fixSnippet: partial.fixSnippet,
    a11yRuleId: partial.a11yRuleId,
    element: partial.element,
    state: partial.state,
    location: partial.location,
    evidence: partial.evidence,
    confidence: partial.confidence ?? "high",
    requirement: partial.requirement ?? "required",
  });
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
    push(issues, {
      category: "accessibility",
      severity: "critical",
      title: "Icon button missing accessible name",
      description:
        "Buttons with only an icon need an aria-label (or visually hidden text) so screen readers can announce them.",
      suggestion: 'Add aria-label="Describe action" to the Button.',
      fixSnippet: `<Button aria-label="Save changes" size="icon">\n  <Save className="h-4 w-4" />\n</Button>`,
      a11yRuleId: "button-name",
      element: "Button",
      evidence: "icon-only Button without aria-label/sr-only text",
      confidence: "high",
      requirement: "required",
    });
  }

  // Images without alt
  if (/<img[\s>]/.test(source) && !/alt\s*=/.test(source)) {
    push(issues, {
      category: "accessibility",
      severity: "critical",
      title: "Image missing alt text",
      description: "All <img> elements need an alt attribute (empty for decorative).",
      suggestion: 'Add alt="..." or alt="" for decorative images.',
      a11yRuleId: "image-alt",
      element: "img",
      evidence: "<img> present without alt=",
      confidence: "high",
      requirement: "required",
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
    push(issues, {
      category: "accessibility",
      severity: "critical",
      title: "Input missing label",
      description:
        "Form controls need an associated <Label htmlFor>, FormLabel, or aria-label.",
      suggestion:
        "Wrap with FormItem + FormLabel, or pair Label with htmlFor matching the input id.",
      fixSnippet: `<div className="space-y-2">\n  <Label htmlFor="email">Email</Label>\n  <Input id="email" type="email" />\n</div>`,
      a11yRuleId: "label",
      element: "Input",
      evidence: "Input/input without Label/htmlFor/aria-label/FormLabel",
      confidence: "high",
      requirement: "required",
    });
  }

  // Dialog without DialogTitle
  if (
    types.has("Dialog") &&
    /<DialogContent[\s>]/.test(source) &&
    !/<DialogTitle[\s>]/.test(source)
  ) {
    push(issues, {
      category: "accessibility",
      severity: "critical",
      title: "Dialog missing DialogTitle",
      description:
        "Radix Dialog requires a DialogTitle for screen reader announcement of the dialog.",
      suggestion: "Add <DialogTitle> inside DialogHeader / DialogContent.",
      fixSnippet: `<DialogContent>\n  <DialogHeader>\n    <DialogTitle>Confirm action</DialogTitle>\n    <DialogDescription>This cannot be undone.</DialogDescription>\n  </DialogHeader>\n</DialogContent>`,
      a11yRuleId: "dialog-name",
      element: "Dialog",
      evidence: "DialogContent without DialogTitle",
      confidence: "high",
      requirement: "required",
    });
  }

  // Dialog without DialogDescription (only when title is present — avoid duplicate with title miss)
  if (
    types.has("Dialog") &&
    /<DialogContent[\s>]/.test(source) &&
    /<DialogTitle[\s>]/.test(source) &&
    !/<DialogDescription[\s>]/.test(source) &&
    !/aria-describedby\s*=/.test(source)
  ) {
    push(issues, {
      category: "accessibility",
      severity: "warning",
      title: "Dialog missing DialogDescription",
      description:
        "DialogDescription gives assistive tech additional context for the dialog purpose.",
      suggestion: "Add <DialogDescription> under DialogTitle.",
      fixSnippet: `<DialogHeader>\n  <DialogTitle>Settings</DialogTitle>\n  <DialogDescription>Manage your preferences.</DialogDescription>\n</DialogHeader>`,
      a11yRuleId: "dialog-description",
      element: "Dialog",
      evidence: "DialogTitle present without DialogDescription/aria-describedby",
      confidence: "high",
      requirement: "recommended",
    });
  }

  // Sheet Title / Description (shadcn Sheet mirrors Dialog)
  if (
    (types.has("Sheet") || /<SheetContent[\s>]/.test(source)) &&
    /<SheetContent[\s>]/.test(source) &&
    !/<SheetTitle[\s>]/.test(source)
  ) {
    push(issues, {
      category: "accessibility",
      severity: "critical",
      title: "Sheet missing SheetTitle",
      description:
        "Radix/shadcn Sheet content needs a SheetTitle for accessible naming.",
      suggestion: "Add <SheetTitle> inside SheetHeader / SheetContent.",
      fixSnippet: `<SheetContent>\n  <SheetHeader>\n    <SheetTitle>Edit profile</SheetTitle>\n    <SheetDescription>Update your public details.</SheetDescription>\n  </SheetHeader>\n</SheetContent>`,
      a11yRuleId: "dialog-name",
      element: "Sheet",
      evidence: "SheetContent without SheetTitle",
      confidence: "high",
      requirement: "required",
    });
  }

  if (
    (types.has("Sheet") || /<SheetContent[\s>]/.test(source)) &&
    /<SheetContent[\s>]/.test(source) &&
    /<SheetTitle[\s>]/.test(source) &&
    !/<SheetDescription[\s>]/.test(source)
  ) {
    push(issues, {
      category: "accessibility",
      severity: "warning",
      title: "Sheet missing SheetDescription",
      description:
        "SheetDescription provides supporting context for assistive technologies.",
      suggestion: "Add <SheetDescription> under SheetTitle.",
      fixSnippet: `<SheetHeader>\n  <SheetTitle>Filters</SheetTitle>\n  <SheetDescription>Narrow results by status and owner.</SheetDescription>\n</SheetHeader>`,
      a11yRuleId: "dialog-description",
      element: "Sheet",
      evidence: "SheetTitle present without SheetDescription",
      confidence: "medium",
      requirement: "recommended",
    });
  }

  // asChild composition risks — trigger wrapping non-interactive or multiple children cues
  if (
    /asChild/.test(source) &&
    /<(?:DialogTrigger|SheetTrigger|PopoverTrigger|DropdownMenuTrigger|TooltipTrigger)[^>]*asChild/.test(
      source
    )
  ) {
    const triggerBlock =
      /<(?:DialogTrigger|SheetTrigger|PopoverTrigger|DropdownMenuTrigger|TooltipTrigger)[^>]*asChild[^>]*>\s*<div[\s>]/.test(
        source
      );
    const bareTextChild =
      /<(?:DialogTrigger|SheetTrigger|PopoverTrigger|DropdownMenuTrigger|TooltipTrigger)[^>]*asChild[^>]*>\s*[A-Za-z]/.test(
        source
      );
    if (triggerBlock || bareTextChild) {
      push(issues, {
        category: "accessibility",
        severity: "warning",
        title: "asChild trigger composition risk",
        description:
          "Radix asChild merges props into a single React element child. Wrapping a div or bare text often breaks keyboard and focus behavior.",
        suggestion:
          "Pass a single interactive child (Button/link) to asChild triggers — not a div or text node.",
        fixSnippet: `<DialogTrigger asChild>\n  <Button variant="outline">Open</Button>\n</DialogTrigger>`,
        a11yRuleId: "nested-interactive",
        element: "Trigger",
        evidence: "asChild trigger wrapping <div> or bare text instead of Button",
        confidence: "medium",
        requirement: "required",
      });
    }
  }

  // Clickable div/span without keyboard support
  if (
    /<(?:div|span)[^>]*onClick\s*=/.test(source) &&
    !/onKeyDown\s*=/.test(source) &&
    !/role\s*=\s*["']button["']/.test(source)
  ) {
    push(issues, {
      category: "accessibility",
      severity: "critical",
      title: "Clickable non-interactive element",
      description:
        "div/span with onClick is not keyboard accessible. Prefer <button> or add role, tabIndex, and onKeyDown.",
      suggestion:
        'Use <Button> or a native <button>, or add role="button" tabIndex={0} onKeyDown.',
      a11yRuleId: "nested-interactive",
      element: "div",
      evidence: "div/span onClick without role=button/onKeyDown",
      confidence: "high",
      requirement: "required",
    });
  }

  // Links that look like buttons without href
  if (/<a[\s>]/.test(source) && !/href\s*=/.test(source)) {
    push(issues, {
      category: "accessibility",
      severity: "warning",
      title: "Anchor without href",
      description:
        "Anchors used as buttons should be real buttons, or include a valid href.",
      suggestion: "Replace with <Button> or add an href.",
      a11yRuleId: "link-name",
      element: "a",
      evidence: "<a> without href=",
      confidence: "high",
      requirement: "required",
    });
  }

  // Missing aria-describedby for error messages near inputs
  if (
    (/error/i.test(source) || /FormMessage/.test(source)) &&
    (/<Input/.test(source) || /<input/.test(source)) &&
    !/aria-describedby\s*=/.test(source) &&
    !/aria-invalid\s*=/.test(source)
  ) {
    push(issues, {
      category: "accessibility",
      severity: "warning",
      title: "Error message not linked to control",
      description:
        "Validation messages should be connected via aria-describedby and aria-invalid.",
      suggestion:
        "Set aria-invalid={!!error} and aria-describedby pointing at the message id.",
      a11yRuleId: "aria-input-field-name",
      element: "Input",
      evidence: "error/FormMessage near Input without aria-invalid/aria-describedby",
      confidence: "medium",
      requirement: "recommended",
    });
  }

  // Select without accessible value label
  if (
    types.has("Select") &&
    /<SelectTrigger[\s>]/.test(source) &&
    !/<SelectValue[\s/>]/.test(source) &&
    !/aria-label\s*=/.test(source)
  ) {
    push(issues, {
      category: "accessibility",
      severity: "warning",
      title: "Select missing SelectValue / label",
      description:
        "SelectTrigger should include SelectValue (and preferably a Label).",
      suggestion: 'Add <SelectValue placeholder="..." /> and an associated Label.',
      fixSnippet: `<div className="space-y-2">\n  <Label>Theme</Label>\n  <Select>\n    <SelectTrigger>\n      <SelectValue placeholder="Select a theme" />\n    </SelectTrigger>\n  </Select>\n</div>`,
      a11yRuleId: "select-name",
      element: "Select",
      evidence: "SelectTrigger without SelectValue/aria-label",
      confidence: "high",
      requirement: "required",
    });
  }

  // role=button without tabIndex
  if (/role\s*=\s*["']button["']/.test(source) && !/tabIndex|tabindex/i.test(source)) {
    push(issues, {
      category: "accessibility",
      severity: "warning",
      title: "role=button without tabIndex",
      description: "Custom buttons need tabIndex={0} to enter the tab order.",
      suggestion: "Add tabIndex={0} and onKeyDown for Enter/Space.",
      a11yRuleId: "aria-command-name",
      evidence: "role=button without tabIndex/tabindex",
      confidence: "high",
      requirement: "required",
    });
  }

  // Custom interactive control with className override but no focus-visible
  if (
    (/onClick\s*=/.test(source) || /role\s*=\s*["']button["']/.test(source)) &&
    /className\s*=/.test(source) &&
    !/focus-visible:|focus:ring|focus:outline/.test(source) &&
    !/<Button[\s>]/.test(source)
  ) {
    push(issues, {
      category: "accessibility",
      severity: "warning",
      title: "Custom control missing focus-visible styles",
      description:
        "Custom clickable elements need an explicit focus-visible ring when they override className outside shadcn Button.",
      suggestion:
        "Add focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring.",
      fixSnippet: `<button\n  type="button"\n  className="rounded-md px-3 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"\n  onClick={onAction}\n>\n  Action\n</button>`,
      a11yRuleId: "focus-order-semantics",
      evidence: "custom onClick/role=button with className but no focus-visible utilities",
      confidence: "medium",
      requirement: "recommended",
    });
  }

  // Disabled semantics / aria-busy opportunity on async buttons
  if (
    (/isLoading|pending|isPending/.test(source) || /Loader2|Spinner/.test(source)) &&
    /<Button[\s>]/.test(source) &&
    !/aria-busy\s*=/.test(source) &&
    !/disabled\s*=/.test(source)
  ) {
    push(issues, {
      category: "accessibility",
      severity: "info",
      title: "Loading button missing disabled / aria-busy",
      description:
        "When a button shows a spinner, pair it with disabled and aria-busy so assistive tech and pointer users get consistent pending semantics.",
      suggestion: "Set disabled={isLoading} aria-busy={isLoading} on the Button.",
      fixSnippet: `<Button disabled={isLoading} aria-busy={isLoading}>\n  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}\n  Save\n</Button>`,
      a11yRuleId: "aria-busy",
      element: "Button",
      evidence: "loading/pending/Spinner cue on Button without disabled/aria-busy",
      confidence: "medium",
      requirement: "recommended",
    });
  }

  // Tooltip / Popover content without accessible name cues
  if (
    (types.has("Tooltip") || /<TooltipContent[\s>]/.test(source)) &&
    /<TooltipContent[\s>]/.test(source) &&
    !/>\s*[^<\s]/.test(source.replace(/[\s\S]*<TooltipContent/, "<TooltipContent"))
  ) {
    // soft: empty tooltip content is hard to detect with regex; skip vague case
  }

  if (
    types.has("Popover") &&
    /<PopoverContent[\s>]/.test(source) &&
    !/aria-label\s*=/.test(source) &&
    !/<PopoverContent[^>]*>\s*<[A-Z]/.test(source) &&
    !/<h[1-6][\s>]/.test(source)
  ) {
    push(issues, {
      category: "accessibility",
      severity: "info",
      title: "Popover may lack an accessible name",
      description:
        "PopoverContent should include a heading or aria-label so assistive tech can announce its purpose.",
      suggestion: "Add a visible title inside PopoverContent or aria-label on the content.",
      a11yRuleId: "aria-dialog-name",
      element: "Popover",
      evidence: "PopoverContent without heading/aria-label cue",
      confidence: "low",
      requirement: "optional",
    });
  }

  return issues;
}
