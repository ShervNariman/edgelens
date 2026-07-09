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
  "state-disabled": (issue) => ({
    id: `fix-${issue.id}`,
    issueId: issue.id,
    title: "Wire a disabled state",
    problem: issue.title,
    whyItMatters: whyFor(issue),
    suggestion: "Accept a disabled prop and mute the control so it can’t be activated.",
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
  if (issue.element === "Select") {
    return `<SelectTrigger>
  {/* missing SelectValue */}
</SelectTrigger>`;
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
        description: issue.suggestion,
        before: beforeFromIssue(issue, primary),
        after:
          issue.fixSnippet ??
          `// ${issue.suggestion}\n// Flagged on: ${issue.element ?? primary}`,
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
