import type {
  AnalysisIssue,
  DetectedComponentType,
  SuggestedFix,
} from "@/types/analysis";

function whyFor(issue: AnalysisIssue): string {
  if (issue.category === "accessibility") {
    return "Screen reader and keyboard users may miss this control or get incomplete context.";
  }
  if (issue.category === "missing-state") {
    return "Without this state, the UI can feel broken during real interaction (hover, focus, async, failure).";
  }
  if (issue.category === "interaction") {
    return "Users can get stuck or trigger unintended behavior when edge interactions aren’t handled.";
  }
  return "Small pattern gaps compound quickly in AI-generated UI and are easy to miss in review.";
}

const ADAPT_NOTE =
  "Adapt prop names, imports, and copy to your project — this snippet is a conceptual template, not a drop-in for unknown APIs.";

const FIX_TEMPLATES: Partial<
  Record<
    string,
    (issue: AnalysisIssue, primary: DetectedComponentType) => SuggestedFix
  >
> = {
  "state-loading": (issue) => ({
    id: `fix-${issue.id}`,
    issueId: issue.id,
    title: "Add a loading state",
    problem: issue.title,
    whyItMatters: whyFor(issue),
    suggestion: "Disable the control and show a spinner while the action is pending.",
    adaptNote: ADAPT_NOTE,
    language: "tsx",
    before: `<Button onClick={onSave}>
  Save changes
</Button>`,
    after: `import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

export function SubmitButton({ isLoading }: { isLoading?: boolean }) {
  return (
    <Button disabled={isLoading} aria-busy={isLoading}>
      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {isLoading ? "Saving…" : "Save changes"}
    </Button>
  )
}`,
  }),
  "state-async-submit-guard": (issue) => ({
    id: `fix-${issue.id}`,
    issueId: issue.id,
    title: "Protect against duplicate submits",
    problem: issue.title,
    whyItMatters: whyFor(issue),
    suggestion:
      "Disable the submit control while pending and expose aria-busy for assistive tech.",
    adaptNote: ADAPT_NOTE,
    language: "tsx",
    before: `<Button type="submit">Invite teammate</Button>`,
    after: `<Button type="submit" disabled={isPending} aria-busy={isPending}>
  {isPending ? "Sending…" : "Invite teammate"}
</Button>`,
  }),
  "state-disabled": (issue) => ({
    id: `fix-${issue.id}`,
    issueId: issue.id,
    title: "Wire a disabled state",
    problem: issue.title,
    whyItMatters: whyFor(issue),
    suggestion: "Accept a disabled prop and mute the control so it can’t be activated.",
    adaptNote: ADAPT_NOTE,
    language: "tsx",
    before: `<Button onClick={onContinue}>Continue</Button>`,
    after: `<Button
  disabled={isDisabled}
  className="disabled:pointer-events-none disabled:opacity-50"
>
  Continue
</Button>`,
  }),
  "state-focus": (issue) => ({
    id: `fix-${issue.id}`,
    issueId: issue.id,
    title: "Add a visible focus ring",
    problem: issue.title,
    whyItMatters: whyFor(issue),
    suggestion: "Use focus-visible ring utilities so keyboard users can see focus.",
    adaptNote: ADAPT_NOTE,
    language: "tsx",
    before: `<Button className="rounded-md px-3">Continue</Button>`,
    after: `<Button className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
  Continue
</Button>`,
  }),
  "state-hover": (issue) => ({
    id: `fix-${issue.id}`,
    issueId: issue.id,
    title: "Add hover affordance",
    problem: issue.title,
    whyItMatters: whyFor(issue),
    suggestion: "Use theme-aware hover utilities (or rely on shadcn Button variants).",
    adaptNote: ADAPT_NOTE,
    language: "tsx",
    before: `<Button className="bg-primary text-primary-foreground">Continue</Button>`,
    after: `<Button className="hover:bg-primary/90 transition-colors">
  Continue
</Button>`,
  }),
  "state-error": (issue) => ({
    id: `fix-${issue.id}`,
    issueId: issue.id,
    title: "Surface an error state",
    problem: issue.title,
    whyItMatters: whyFor(issue),
    suggestion: "Connect aria-invalid and an error message to the control.",
    adaptNote: ADAPT_NOTE,
    language: "tsx",
    before: `<div className="space-y-2">
  <Input id="email" type="email" />
</div>`,
    after: `import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"

export function EmailField({ error }: { error?: string }) {
  return (
    <div className="space-y-2">
      <Label htmlFor="email">Email</Label>
      <Input
        id="email"
        type="email"
        aria-invalid={!!error}
        aria-describedby={error ? "email-error" : undefined}
      />
      {error && (
        <p id="email-error" className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}`,
  }),
  "state-empty": (issue) => ({
    id: `fix-${issue.id}`,
    issueId: issue.id,
    title: "Add an empty state",
    problem: issue.title,
    whyItMatters: whyFor(issue),
    suggestion: "Guard zero-length collections before mapping to JSX.",
    adaptNote: ADAPT_NOTE,
    language: "tsx",
    before: `{items.map((item) => (
  <div key={item.id}>{item.label}</div>
))}`,
    after: `{items.length === 0 ? (
  <p className="text-sm text-muted-foreground">No results found.</p>
) : (
  items.map((item) => <div key={item.id}>{item.label}</div>)
)}`,
  }),
  "state-search-no-results": (issue) => ({
    id: `fix-${issue.id}`,
    issueId: issue.id,
    title: "Add a no-results + clear branch",
    problem: issue.title,
    whyItMatters: whyFor(issue),
    suggestion: "When filters match nothing, say so and offer a clear/reset action.",
    adaptNote: ADAPT_NOTE,
    language: "tsx",
    before: `{results.map((row) => (
  <Row key={row.id} row={row} />
))}`,
    after: `{results.length === 0 ? (
  <div className="space-y-2">
    <p className="text-sm text-muted-foreground">No results for “{query}”.</p>
    <Button variant="ghost" onClick={onClear}>Clear search</Button>
  </div>
) : (
  results.map((row) => <Row key={row.id} row={row} />)
)}`,
  }),
  "state-list-retry": (issue) => ({
    id: `fix-${issue.id}`,
    issueId: issue.id,
    title: "Add error + retry for the list",
    problem: issue.title,
    whyItMatters: whyFor(issue),
    suggestion: "Render a failure message with a Retry control that re-runs the fetch.",
    adaptNote: ADAPT_NOTE,
    language: "tsx",
    before: `{projects.map((project) => (
  <ProjectRow key={project.id} project={project} />
))}`,
    after: `{error ? (
  <div className="space-y-2">
    <p className="text-sm text-destructive">{error.message}</p>
    <Button variant="outline" onClick={onRetry}>Retry</Button>
  </div>
) : projects.length === 0 ? (
  <p className="text-sm text-muted-foreground">No projects yet.</p>
) : (
  projects.map((project) => (
    <ProjectRow key={project.id} project={project} />
  ))
)}`,
  }),
  "state-destructive-confirm": (issue) => ({
    id: `fix-${issue.id}`,
    issueId: issue.id,
    title: "Confirm destructive actions",
    problem: issue.title,
    whyItMatters: whyFor(issue),
    suggestion: "Use AlertDialog (or a confirm Dialog) before delete/remove mutations.",
    adaptNote: ADAPT_NOTE,
    language: "tsx",
    before: `<Button variant="destructive" onClick={onDelete}>
  Delete member
</Button>`,
    after: `<AlertDialog>
  <AlertDialogTrigger asChild>
    <Button variant="destructive">Delete member</Button>
  </AlertDialogTrigger>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Delete this member?</AlertDialogTitle>
      <AlertDialogDescription>
        They will lose access immediately. This cannot be undone.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction onClick={onDelete}>Delete</AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>`,
  }),
  "state-pagination-loading": (issue) => ({
    id: `fix-${issue.id}`,
    issueId: issue.id,
    title: "Handle loading-next and end-of-list",
    problem: issue.title,
    whyItMatters: whyFor(issue),
    suggestion:
      "Disable Load more while fetching; show an end-of-list message when hasMore is false.",
    adaptNote: ADAPT_NOTE,
    language: "tsx",
    before: `<Button onClick={onLoadMore}>Load more</Button>`,
    after: `{hasMore ? (
  <Button disabled={isFetchingNext} onClick={onLoadMore}>
    {isFetchingNext ? "Loading…" : "Load more"}
  </Button>
) : (
  <p className="text-sm text-muted-foreground">You've reached the end.</p>
)}`,
  }),
  "state-form-field-error": (issue) => ({
    id: `fix-${issue.id}`,
    issueId: issue.id,
    title: "Wire field-level form errors",
    problem: issue.title,
    whyItMatters: whyFor(issue),
    suggestion: "Attach aria-invalid and an alert message to each failing field.",
    adaptNote: ADAPT_NOTE,
    language: "tsx",
    before: `<form onSubmit={onSubmit}>
  <Input name="email" />
  <Button type="submit">Continue</Button>
</form>`,
    after: `<form onSubmit={onSubmit} className="space-y-4">
  <div className="space-y-2">
    <Label htmlFor="email">Work email</Label>
    <Input
      id="email"
      name="email"
      aria-invalid={!!errors.email}
      aria-describedby={errors.email ? "email-error" : undefined}
    />
    {errors.email && (
      <p id="email-error" role="alert" className="text-sm text-destructive">
        {errors.email}
      </p>
    )}
  </div>
  <Button type="submit" disabled={isPending} aria-busy={isPending}>
    Continue
  </Button>
</form>`,
  }),
  "state-selected": (issue) => ({
    id: `fix-${issue.id}`,
    issueId: issue.id,
    title: "Expose selected / checked visuals",
    problem: issue.title,
    whyItMatters: whyFor(issue),
    suggestion: "Use checked/selected props and matching data-state styles.",
    adaptNote: ADAPT_NOTE,
    language: "tsx",
    before: `<Checkbox id="billing" />`,
    after: `<Checkbox
  id="billing"
  checked={checked}
  onCheckedChange={setChecked}
  className="data-[state=checked]:bg-primary"
/>`,
  }),
  "state-success": (issue) => ({
    id: `fix-${issue.id}`,
    issueId: issue.id,
    title: "Add success feedback",
    problem: issue.title,
    whyItMatters: whyFor(issue),
    suggestion: "After a successful mutation, show inline success or a toast.",
    adaptNote: ADAPT_NOTE,
    language: "tsx",
    before: `<Button type="submit">Save</Button>`,
    after: `{isSuccess ? (
  <p className="text-sm text-emerald-700" role="status">Saved successfully.</p>
) : (
  <Button type="submit" disabled={isPending}>Save</Button>
)}`,
  }),
};

function beforeFromIssue(issue: AnalysisIssue, primary: DetectedComponentType): string | undefined {
  if (issue.element === "Button" || primary === "Button") {
    if (issue.id.includes("a11y") || issue.a11yRuleId === "button-name") {
      return `<Button onClick={onSave}>
  <Save className="h-4 w-4" />
</Button>`;
    }
  }
  if (issue.element === "Input" || issue.a11yRuleId === "label") {
    return `<Input type="email" placeholder="Email" />`;
  }
  if (issue.element === "Dialog") {
    return `<DialogContent>
  {/* missing DialogTitle */}
  <DialogFooter>…</DialogFooter>
</DialogContent>`;
  }
  if (issue.element === "Sheet") {
    return `<SheetContent>
  {/* missing SheetTitle */}
</SheetContent>`;
  }
  if (issue.element === "Select") {
    return `<SelectTrigger>
  {/* missing SelectValue */}
</SelectTrigger>`;
  }
  if (issue.title.includes("asChild")) {
    return `<DialogTrigger asChild>
  <div>Open</div>
</DialogTrigger>`;
  }
  return undefined;
}

export function buildSuggestedFixes(
  issues: AnalysisIssue[],
  _source: string,
  primary: DetectedComponentType
): SuggestedFix[] {
  const fixes: SuggestedFix[] = [];

  for (const issue of issues) {
    if (issue.fixSnippet) {
      fixes.push({
        id: `fix-${issue.id}`,
        issueId: issue.id,
        title: issue.title,
        problem: issue.title,
        whyItMatters: whyFor(issue),
        suggestion: issue.suggestion,
        adaptNote: ADAPT_NOTE,
        description: issue.suggestion,
        before: beforeFromIssue(issue, primary),
        after: issue.fixSnippet,
        language: "tsx",
      });
      continue;
    }

    const template = FIX_TEMPLATES[issue.id];
    if (template) {
      fixes.push(template(issue, primary));
      continue;
    }

    if (issue.category === "accessibility" || issue.severity !== "info") {
      fixes.push({
        id: `fix-${issue.id}`,
        issueId: issue.id,
        title: issue.title,
        problem: issue.title,
        whyItMatters: whyFor(issue),
        suggestion: issue.suggestion,
        adaptNote: ADAPT_NOTE,
        description: issue.suggestion,
        before: beforeFromIssue(issue, primary),
        after:
          issue.fixSnippet ??
          `// ${issue.suggestion}\n// Flagged on: ${issue.element ?? primary}\n// Signal: ${issue.evidence}`,
        language: "tsx",
      });
    }
  }

  const seen = new Set<string>();
  return fixes.filter((f) => {
    if (seen.has(f.issueId)) return false;
    seen.add(f.issueId);
    return true;
  });
}
