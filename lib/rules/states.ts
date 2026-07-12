import type {
  ComponentState,
  DetectedComponent,
  DetectedComponentType,
  IssueConfidence,
  RawAnalysisIssue,
  RequirementLevel,
} from "@/types/analysis";

interface StateRule {
  id: string;
  state: ComponentState;
  severity: RawAnalysisIssue["severity"];
  confidence: IssueConfidence;
  requirement: RequirementLevel;
  title: string;
  description: string;
  suggestion: string;
  patterns: RegExp[];
  appliesTo: DetectedComponentType[] | "interactive";
  /** Extra gate — only apply when this matches (or always if omitted). */
  when?: RegExp;
  /** Evidence string for the missing case. */
  missingEvidence: string;
}

const INTERACTIVE: DetectedComponentType[] = [
  "Button",
  "Select",
  "Input",
  "Textarea",
  "Checkbox",
  "Switch",
  "Dialog",
  "Sheet",
  "DropdownMenu",
  "Form",
  "Tabs",
  "Popover",
];

const STATE_RULES: StateRule[] = [
  {
    id: "state-hover",
    state: "hover",
    severity: "warning",
    confidence: "medium",
    requirement: "recommended",
    title: "Missing hover state",
    description:
      "Interactive components should communicate hover affordance via Tailwind hover: utilities or event handlers.",
    suggestion:
      "Add hover: styles (e.g. hover:bg-accent) or use shadcn Button variants which include hover.",
    patterns: [/hover:/, /onMouseEnter/, /onMouseOver/, /group-hover/],
    appliesTo: "interactive",
    missingEvidence: "no hover:/onMouseEnter/group-hover cue in source",
  },
  {
    id: "state-focus",
    state: "focus",
    severity: "critical",
    confidence: "high",
    requirement: "required",
    title: "Missing focus / focus-visible styles",
    description:
      "Keyboard users need a visible focus indicator. Prefer focus-visible:ring utilities.",
    suggestion:
      "Add focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring.",
    patterns: [/focus:/, /focus-visible:/, /onFocus/, /ring-offset/, /ring-2/, /ring-ring/],
    appliesTo: "interactive",
    missingEvidence: "no focus:/focus-visible:/ring-* cue in source",
  },
  {
    id: "state-disabled",
    state: "disabled",
    severity: "warning",
    confidence: "high",
    requirement: "required",
    title: "No disabled state handling",
    description:
      "Buttons and form controls typically need a disabled prop and muted styling.",
    suggestion:
      "Support a disabled prop and styles: disabled:opacity-50 disabled:pointer-events-none.",
    patterns: [/disabled/, /aria-disabled/, /disabled:/],
    appliesTo: "interactive",
    missingEvidence: "no disabled/aria-disabled/disabled: cue in source",
  },
  {
    id: "state-loading",
    state: "loading",
    severity: "warning",
    confidence: "high",
    requirement: "required",
    title: "No loading / pending state",
    description:
      "Async actions should show a loading state to prevent double-submits and clarify progress.",
    suggestion:
      "Add an isLoading prop that disables the control and shows a Loader2 spinner from lucide-react.",
    patterns: [/loading/, /isLoading/, /pending/, /Spinner/, /Loader/, /aria-busy/],
    appliesTo: ["Button", "Form", "Card", "Dialog", "Sheet"],
    missingEvidence: "no loading/isLoading/pending/Spinner/aria-busy cue",
  },
  {
    id: "state-error",
    state: "error",
    severity: "warning",
    confidence: "high",
    requirement: "required",
    title: "No error / invalid state",
    description:
      "Form fields and alerts should surface validation or failure states.",
    suggestion:
      "Wire aria-invalid, FormMessage, or a destructive Alert for error feedback.",
    patterns: [/error/, /destructive/, /aria-invalid/, /FormMessage/, /invalid/],
    appliesTo: ["Form", "Input", "Textarea", "Alert", "Select", "Card", "Dialog", "Sheet"],
    missingEvidence: "no error/destructive/aria-invalid/FormMessage cue",
  },
  {
    id: "state-empty",
    state: "empty",
    severity: "info",
    confidence: "medium",
    requirement: "recommended",
    title: "No empty state",
    description:
      "Lists, selects, and mapped collections should handle zero items gracefully.",
    suggestion: "Render an empty placeholder when data length is 0.",
    patterns: [
      /empty/,
      /no results/i,
      /length\s*===\s*0/,
      /EmptyState/,
      /Empty\s*State/,
      /nothing (here|yet)/i,
    ],
    appliesTo: ["Select", "Tabs", "Card", "Dialog", "Sheet"],
    missingEvidence: "no empty/no-results/length===0/EmptyState cue",
  },
  {
    id: "state-active",
    state: "active",
    severity: "info",
    confidence: "medium",
    requirement: "recommended",
    title: "No active / pressed state",
    description:
      "Toggle-like or tab triggers benefit from an explicit active/pressed visual.",
    suggestion: "Use data-[state=active] or aria-pressed with matching styles.",
    patterns: [/active:/, /data-\[state=active\]/, /aria-pressed/, /pressed/],
    appliesTo: ["Tabs"],
    missingEvidence: "no active:/data-[state=active]/aria-pressed cue",
  },
  {
    id: "state-selected",
    state: "selected",
    severity: "info",
    confidence: "medium",
    requirement: "recommended",
    title: "No selected / checked visual cue",
    description:
      "Selection controls should expose selected/checked/active styling for the current choice.",
    suggestion:
      "Use data-[state=checked], aria-checked, or selected styles on the active option.",
    patterns: [
      /selected/,
      /aria-checked/,
      /aria-selected/,
      /data-\[state=checked\]/,
      /data-\[state=on\]/,
      /checked\s*=/,
    ],
    appliesTo: ["Checkbox", "Switch", "Tabs", "Select"],
    missingEvidence: "no selected/checked/aria-selected cue",
  },
  {
    id: "state-success",
    state: "success",
    severity: "info",
    confidence: "low",
    requirement: "optional",
    title: "No success / confirmation feedback",
    description:
      "Forms and destructive flows often need a brief success state after completion.",
    suggestion:
      "Add a success branch (toast, inline message, or check icon) after the async action resolves.",
    patterns: [/success/, /isSuccess/, /toast\(/i, /CheckCircle/, /saved successfully/i],
    appliesTo: ["Form", "Dialog", "Sheet"],
    when: /onSubmit|submit|delete|remove|invite|save/i,
    missingEvidence: "no success/isSuccess/toast success cue after async action",
  },
];

/** Contextual state completeness rules for startup UI patterns. */
interface ContextualRule {
  id: string;
  state?: ComponentState;
  severity: RawAnalysisIssue["severity"];
  confidence: IssueConfidence;
  requirement: RequirementLevel;
  category: RawAnalysisIssue["category"];
  title: string;
  description: string;
  suggestion: string;
  fixSnippet?: string;
  element?: string;
  /** Return true when this rule should evaluate. */
  applies: (
    source: string,
    primary: DetectedComponentType,
    components: DetectedComponent[]
  ) => boolean;
  /** Return true when the expected state/cue is already present. */
  present: (source: string) => boolean;
  missingEvidence: string;
}

const CONTEXTUAL_RULES: ContextualRule[] = [
  {
    id: "state-async-submit-guard",
    state: "loading",
    severity: "warning",
    confidence: "high",
    requirement: "required",
    category: "missing-state",
    title: "Async submit lacks duplicate-submit protection",
    description:
      "Submit/save buttons that kick off async work should disable (or debounce) while pending so users cannot double-fire.",
    suggestion:
      "Bind disabled={isPending} (and ideally aria-busy) while the mutation runs; show a loading label/spinner.",
    fixSnippet: `<Button type="submit" disabled={isPending} aria-busy={isPending}>
  {isPending ? "Saving…" : "Save"}
</Button>`,
    element: "Button",
    applies: (source, primary, components) => {
      const types = new Set(components.map((c) => c.type));
      const looksAsync =
        /onSubmit|type\s*=\s*["']submit["']|onClick\s*=/.test(source) &&
        /save|submit|create|invite|send|update|delete|confirm/i.test(source);
      return (
        looksAsync &&
        (primary === "Button" ||
          primary === "Form" ||
          primary === "Card" ||
          types.has("Button") ||
          types.has("Form"))
      );
    },
    present: (source) =>
      (/disabled\s*=/.test(source) && /loading|isLoading|pending|isPending|aria-busy/.test(source)) ||
      (/aria-busy/.test(source) && /disabled/.test(source)),
    missingEvidence:
      "async submit/save cue without disabled+loading/pending/aria-busy pairing",
  },
  {
    id: "state-list-retry",
    state: "error",
    severity: "warning",
    confidence: "medium",
    requirement: "recommended",
    category: "missing-state",
    title: "Data list missing error recovery / retry",
    description:
      "Lists and tables that fetch data should expose an error branch with a retry or refresh action.",
    suggestion:
      "When fetch fails, render an error message and a Retry/Refresh button that re-runs the query.",
    fixSnippet: `{error ? (
  <div className="space-y-2">
    <p className="text-sm text-destructive">{error.message}</p>
    <Button variant="outline" onClick={onRetry}>Retry</Button>
  </div>
) : null}`,
    element: "Card",
    applies: (source, primary) =>
      /\.map\s*\(/.test(source) &&
      (primary === "Card" ||
        /projects?|items?|rows?|users?|members?|invoices?|entries/i.test(source)) &&
      !/search|filter|query|debounc/i.test(source),
    present: (source) =>
      /retry|onRetry|refetch|refresh/i.test(source) && /error/i.test(source),
    missingEvidence: "mapped list/card without error+retry/refresh recovery cue",
  },
  {
    id: "state-search-no-results",
    state: "empty",
    severity: "warning",
    confidence: "high",
    requirement: "required",
    category: "missing-state",
    title: "Search/filter missing no-results state",
    description:
      "Search and filter UIs need an explicit no-results branch (and ideally a clear/reset control).",
    suggestion:
      "When filtered length is 0, render “No results” and a Clear filters / Reset control.",
    fixSnippet: `{results.length === 0 ? (
  <div className="space-y-2 text-sm text-muted-foreground">
    <p>No results for “{query}”.</p>
    <Button variant="ghost" onClick={onClear}>Clear search</Button>
  </div>
) : (
  results.map((item) => <Row key={item.id} item={item} />)
)}`,
    applies: (source) =>
      /search|filter|query|debounc/i.test(source) &&
      (/\.map\s*\(/.test(source) || /results|items|options/i.test(source)),
    present: (source) =>
      /no results|no matches|nothing found|empty/i.test(source) ||
      (/length\s*===\s*0/.test(source) && /clear|reset/i.test(source)),
    missingEvidence: "search/filter/query cue without no-results or clear/reset branch",
  },
  {
    id: "state-search-pending",
    state: "loading",
    severity: "info",
    confidence: "medium",
    requirement: "recommended",
    category: "missing-state",
    title: "Search missing pending / debounced loading cue",
    description:
      "Debounced or remote search should show a pending state so users know results are still updating.",
    suggestion:
      "Track isSearching / isPending while the debounce or request is in flight; set aria-busy on the results region.",
    applies: (source) => /search|filter|query|debounc/i.test(source),
    present: (source) =>
      /isSearching|searching|isPending|debounc|aria-busy|Skeleton|Loader/i.test(source),
    missingEvidence: "search/filter cue without pending/debounce/aria-busy loading signal",
  },
  {
    id: "state-destructive-confirm",
    state: "default",
    severity: "warning",
    confidence: "high",
    requirement: "required",
    category: "interaction",
    title: "Destructive action missing confirmation",
    description:
      "Delete/remove/revoke actions should confirm intent (Dialog/AlertDialog) before mutating.",
    suggestion:
      "Wrap the destructive action in an AlertDialog / confirmation Dialog with cancel + confirm.",
    fixSnippet: `<AlertDialog>
  <AlertDialogTrigger asChild>
    <Button variant="destructive">Delete</Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Delete this item?</AlertDialogTitle>
      <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction onClick={onDelete}>Delete</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>`,
    element: "Button",
    applies: (source) =>
      /variant\s*=\s*["']destructive["']/.test(source) ||
      (/delete|remove|revoke|destroy|unlink/i.test(source) &&
        (/<Button[\s>]/.test(source) || /onClick\s*=/.test(source))),
    present: (source) =>
      /AlertDialog|confirm|onConfirm|are you sure|cannot be undone/i.test(source) ||
      (/<Dialog[\s>]/.test(source) && /delete|remove|confirm/i.test(source)),
    missingEvidence: "destructive/delete cue without AlertDialog/confirm dialog branch",
  },
  {
    id: "state-pagination-loading",
    state: "loading",
    severity: "warning",
    confidence: "medium",
    requirement: "recommended",
    category: "missing-state",
    title: "Pagination / infinite list missing loading-next state",
    description:
      "Load-more and infinite lists should show a loading-next cue and handle end-of-list / failure.",
    suggestion:
      "While fetching the next page, disable Load more and show a spinner; render an end-of-list message when hasMore is false.",
    fixSnippet: `{hasMore ? (
  <Button disabled={isFetchingNext} onClick={onLoadMore}>
    {isFetchingNext ? "Loading…" : "Load more"}
  </Button>
) : (
  <p className="text-sm text-muted-foreground">You've reached the end.</p>
)}`,
    applies: (source) =>
      /load more|loadMore|hasMore|infinite|pagination|pageIndex|nextPage|cursor/i.test(
        source
      ),
    present: (source) =>
      (/isFetchingNext|loadingMore|isLoadingMore|fetchingNext/i.test(source) ||
        (/disabled\s*=/.test(source) && /load more|Load more/i.test(source))) &&
      (/hasMore|end of|no more|reached the end/i.test(source) ||
        /error|retry/i.test(source)),
    missingEvidence:
      "pagination/infinite cue without loading-next and end-of-list/failure handling",
  },
  {
    id: "state-overlay-open",
    state: "active",
    severity: "info",
    confidence: "low",
    requirement: "optional",
    category: "missing-state",
    title: "Overlay missing open/closed state cues",
    description:
      "Dialogs, sheets, popovers, and menus often need controlled open state for focus, escape, and async flows.",
    suggestion:
      "Consider open/onOpenChange (or data-state) so you can coordinate focus return and pending UI.",
    applies: (_s, primary, components) => {
      const types = new Set(components.map((c) => c.type));
      return (
        types.has("Dialog") ||
        types.has("Sheet") ||
        types.has("Popover") ||
        types.has("DropdownMenu") ||
        types.has("Tooltip") ||
        primary === "Dialog" ||
        primary === "Sheet"
      );
    },
    present: (source) =>
      /open\s*=/.test(source) ||
      /onOpenChange\s*=/.test(source) ||
      /data-\[state=open\]/.test(source) ||
      /defaultOpen/.test(source),
    missingEvidence: "overlay primitive without open/onOpenChange/data-[state=open] cue",
  },
  {
    id: "state-form-field-error",
    state: "error",
    severity: "warning",
    confidence: "high",
    requirement: "required",
    category: "missing-state",
    title: "Form missing field-level error UI",
    description:
      "Forms should surface field errors (and ideally a form-level error) with aria-invalid linkage.",
    suggestion:
      "Render FormMessage / role=alert text per field and set aria-invalid when errors exist.",
    applies: (source, primary, components) => {
      const types = new Set(components.map((c) => c.type));
      return (
        primary === "Form" ||
        types.has("Form") ||
        (/<form[\s>]/.test(source) &&
          (/<Input[\s/>]/.test(source) || /<input[\s>]/.test(source)))
      );
    },
    present: (source) =>
      /FormMessage|aria-invalid|fieldError|errors\.|role\s*=\s*["']alert["']/.test(
        source
      ),
    missingEvidence: "form/input without FormMessage/aria-invalid/field error cue",
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

  const usesShadcnButton =
    components.some((c) => c.type === "Button") &&
    /from\s+["']@\/components\/ui\/button["']/.test(source);

  for (const rule of STATE_RULES) {
    if (!applies(rule, primaryType, components)) continue;
    if (rule.when && !rule.when.test(source)) continue;

    const present = rule.patterns.some((re) => re.test(source));
    if (present) continue;

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

    if (
      usesShadcnButton &&
      isIconButton &&
      rule.state === "hover" &&
      !/className\s*=/.test(source)
    ) {
      continue;
    }

    if (!rule.when && rule.requirement === "optional" && primaryType === "Unknown") {
      continue;
    }

    issues.push({
      id: rule.id,
      category: "missing-state",
      severity: rule.requirement === "optional" ? "info" : rule.severity,
      title: rule.title,
      description: rule.description,
      state: rule.state,
      suggestion: rule.suggestion,
      element: primaryType,
      evidence: rule.missingEvidence,
      confidence: rule.confidence,
      requirement: rule.requirement,
    });
  }

  for (const rule of CONTEXTUAL_RULES) {
    if (!rule.applies(source, primaryType, components)) continue;
    if (rule.present(source)) continue;

    issues.push({
      id: rule.id,
      category: rule.category,
      severity: rule.severity,
      title: rule.title,
      description: rule.description,
      state: rule.state,
      suggestion: rule.suggestion,
      fixSnippet: rule.fixSnippet,
      element: rule.element ?? primaryType,
      evidence: rule.missingEvidence,
      confidence: rule.confidence,
      requirement: rule.requirement,
    });
  }

  return issues;
}

export { STATE_RULES, CONTEXTUAL_RULES, INTERACTIVE };
