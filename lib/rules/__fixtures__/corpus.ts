/**
 * Deterministic rule corpus for SHE-150.
 * Families: positive (must flag), negative (must not flag), ambiguous,
 * parser-recovery, and false-positive regressions.
 *
 * Fixtures use realistic AI-generated shadcn patterns — not only toys.
 */

export type CorpusKind =
  | "positive"
  | "negative"
  | "ambiguous"
  | "parser-recovery"
  | "false-positive";

export interface CorpusFixture {
  id: string;
  family: string;
  kind: CorpusKind;
  description: string;
  code: string;
  /** Issue ids that MUST appear (positive / parser cases). */
  expectIssueIds?: string[];
  /** Issue titles / id substrings that MUST appear. */
  expectTitleIncludes?: string[];
  /** Issue ids that MUST NOT appear. */
  forbidIssueIds?: string[];
  /** Title substrings that MUST NOT appear. */
  forbidTitleIncludes?: string[];
  /** Soft: at least one of these ids. */
  expectAnyIssueIds?: string[];
  expectLocationsUnreliable?: boolean;
  expectMinIssues?: number;
}

export const RULE_CORPUS: CorpusFixture[] = [
  // —— Async submit ——
  {
    id: "async-submit-positive",
    family: "async-submit",
    kind: "positive",
    description: "Save button with onClick but no pending guard",
    code: `import { Button } from "@/components/ui/button"
export function SaveRow({ onSave }: { onSave: () => Promise<void> }) {
  return <Button onClick={() => onSave()}>Save changes</Button>
}`,
    expectIssueIds: ["state-async-submit-guard", "state-loading"],
  },
  {
    id: "async-submit-negative",
    family: "async-submit",
    kind: "negative",
    description: "Submit button already disables + aria-busy while pending",
    code: `import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
export function SaveRow({ isPending, onSave }: { isPending: boolean; onSave: () => void }) {
  return (
    <Button onClick={onSave} disabled={isPending} aria-busy={isPending} className="hover:bg-primary/90 focus-visible:ring-2">
      {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {isPending ? "Saving…" : "Save changes"}
    </Button>
  )
}`,
    forbidIssueIds: ["state-async-submit-guard", "state-loading"],
  },

  // —— Data list retry / empty ——
  {
    id: "list-retry-positive",
    family: "data-list",
    kind: "positive",
    description: "Projects card maps rows with no error/retry",
    code: `import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
export function Projects({ projects }: { projects: { id: string; name: string }[] }) {
  return (
    <Card>
      <CardHeader><CardTitle>Projects</CardTitle></CardHeader>
      <CardContent>
        {projects.map((p) => <div key={p.id}>{p.name}</div>)}
        <Button>Refresh</Button>
      </CardContent>
    </Card>
  )
}`,
    expectIssueIds: ["state-list-retry", "state-empty"],
  },
  {
    id: "list-retry-negative",
    family: "data-list",
    kind: "negative",
    description: "List handles loading, empty, error+retry",
    code: `import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
export function Projects({
  projects, isLoading, error, onRetry,
}: {
  projects: { id: string; name: string }[]
  isLoading?: boolean
  error?: Error | null
  onRetry: () => void
}) {
  if (isLoading) return <Card><CardContent>Loading…</CardContent></Card>
  if (error) {
    return (
      <Card>
        <CardContent>
          <p className="text-destructive">{error.message}</p>
          <Button onClick={onRetry}>Retry</Button>
        </CardContent>
      </Card>
    )
  }
  if (projects.length === 0) {
    return <Card><CardContent><p>No projects yet. Empty state.</p></CardContent></Card>
  }
  return (
    <Card>
      <CardHeader><CardTitle>Projects</CardTitle></CardHeader>
      <CardContent>
        {projects.map((p) => <div key={p.id}>{p.name}</div>)}
      </CardContent>
    </Card>
  )
}`,
    forbidIssueIds: ["state-list-retry", "state-empty", "state-loading", "state-error"],
  },

  // —— Search / filter ——
  {
    id: "search-no-results-positive",
    family: "search-filter",
    kind: "positive",
    description: "Filter input + map without no-results",
    code: `import { Input } from "@/components/ui/input"
export function MemberSearch({ query, results }: { query: string; results: { id: string; name: string }[] }) {
  return (
    <div>
      <Input value={query} placeholder="Search members" aria-label="Search members" />
      {results.map((r) => <div key={r.id}>{r.name}</div>)}
    </div>
  )
}`,
    expectIssueIds: ["state-search-no-results"],
  },
  {
    id: "search-no-results-negative",
    family: "search-filter",
    kind: "negative",
    description: "Search with no-results + clear",
    code: `import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
export function MemberSearch({
  query, results, isSearching, onClear,
}: {
  query: string
  results: { id: string; name: string }[]
  isSearching: boolean
  onClear: () => void
}) {
  return (
    <div aria-busy={isSearching}>
      <Input value={query} placeholder="Search members" aria-label="Search" className="focus-visible:ring-2" />
      {results.length === 0 ? (
        <div>
          <p>No results for “{query}”.</p>
          <Button variant="ghost" onClick={onClear}>Clear search</Button>
        </div>
      ) : (
        results.map((r) => <div key={r.id}>{r.name}</div>)
      )}
    </div>
  )
}`,
    forbidIssueIds: ["state-search-no-results"],
  },

  // —— Destructive confirm ——
  {
    id: "destructive-positive",
    family: "destructive",
    kind: "positive",
    description: "Destructive button without confirmation",
    code: `import { Button } from "@/components/ui/button"
export function DeleteMember({ onDelete }: { onDelete: () => void }) {
  return <Button variant="destructive" onClick={onDelete} className="hover:bg-destructive/90 focus-visible:ring-2" disabled={false}>Delete member</Button>
}`,
    expectIssueIds: ["state-destructive-confirm"],
  },
  {
    id: "destructive-negative",
    family: "destructive",
    kind: "negative",
    description: "AlertDialog confirmation present",
    code: `import { Button } from "@/components/ui/button"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
export function DeleteMember({ onDelete }: { onDelete: () => void }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" className="hover:bg-destructive/90 focus-visible:ring-2">Delete member</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete this member?</AlertDialogTitle>
          <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onDelete}>Delete</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}`,
    forbidIssueIds: ["state-destructive-confirm"],
  },

  // —— Pagination ——
  {
    id: "pagination-positive",
    family: "pagination",
    kind: "positive",
    description: "Load more without loading-next / end",
    code: `import { Button } from "@/components/ui/button"
export function Feed({ items, onLoadMore }: { items: { id: string }[]; onLoadMore: () => void }) {
  return (
    <div>
      {items.map((i) => <div key={i.id}>{i.id}</div>)}
      <Button onClick={onLoadMore}>Load more</Button>
    </div>
  )
}`,
    expectIssueIds: ["state-pagination-loading"],
  },
  {
    id: "pagination-negative",
    family: "pagination",
    kind: "negative",
    description: "Infinite list with fetching + end-of-list",
    code: `import { Button } from "@/components/ui/button"
export function Feed({
  items, hasMore, isFetchingNext, onLoadMore,
}: {
  items: { id: string }[]
  hasMore: boolean
  isFetchingNext: boolean
  onLoadMore: () => void
}) {
  return (
    <div>
      {items.map((i) => <div key={i.id}>{i.id}</div>)}
      {hasMore ? (
        <Button disabled={isFetchingNext} onClick={onLoadMore} className="focus-visible:ring-2">
          {isFetchingNext ? "Loading…" : "Load more"}
        </Button>
      ) : (
        <p>You've reached the end.</p>
      )}
    </div>
  )
}`,
    forbidIssueIds: ["state-pagination-loading"],
  },

  // —— Dialog / Sheet composition ——
  {
    id: "dialog-title-positive",
    family: "overlay-a11y",
    kind: "positive",
    description: "DialogContent without DialogTitle",
    code: `import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
export function SettingsDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild><Button>Settings</Button></DialogTrigger>
      <DialogContent><p>Body only</p></DialogContent>
    </Dialog>
  )
}`,
    expectTitleIncludes: ["Dialog missing DialogTitle"],
    forbidTitleIncludes: ["Dialog missing accessible description"],
  },
  {
    id: "sheet-title-positive",
    family: "overlay-a11y",
    kind: "positive",
    description: "SheetContent without SheetTitle",
    code: `import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
export function FiltersSheet() {
  return (
    <Sheet>
      <SheetTrigger asChild><Button>Filters</Button></SheetTrigger>
      <SheetContent><p>Filters go here</p></SheetContent>
    </Sheet>
  )
}`,
    expectTitleIncludes: ["Sheet missing SheetTitle"],
  },
  {
    id: "dialog-complete-negative",
    family: "overlay-a11y",
    kind: "negative",
    description: "Dialog with title + description should not flag those gaps",
    code: `import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
export function SettingsDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild><Button className="hover:bg-accent focus-visible:ring-2" disabled={false}>Settings</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>Manage preferences.</DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  )
}`,
    forbidTitleIncludes: [
      "Dialog missing DialogTitle",
      "Dialog missing DialogDescription",
      "Dialog missing accessible description",
    ],
  },
  {
    id: "aschild-risk-positive",
    family: "overlay-a11y",
    kind: "positive",
    description: "asChild wrapping a div",
    code: `import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
export function BadTrigger() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <div>Open</div>
      </DialogTrigger>
      <DialogContent><DialogTitle>Ok</DialogTitle></DialogContent>
    </Dialog>
  )
}`,
    expectTitleIncludes: ["asChild trigger composition risk"],
  },

  // —— Keys / clickable ——
  {
    id: "missing-key-positive",
    family: "static-jsx",
    kind: "positive",
    description: "map without key",
    code: `export function List({ items }: { items: string[] }) {
  return <ul>{items.map((item) => <li>{item}</li>)}</ul>
}`,
    expectIssueIds: ["pattern-missing-key"],
  },
  {
    id: "missing-key-negative",
    family: "static-jsx",
    kind: "false-positive",
    description: "map with stable key must not flag missing-key",
    code: `export function List({ items }: { items: { id: string; label: string }[] }) {
  return <ul>{items.map((item) => <li key={item.id}>{item.label}</li>)}</ul>
}`,
    forbidIssueIds: ["pattern-missing-key"],
  },
  {
    id: "clickable-div-positive",
    family: "static-jsx",
    kind: "positive",
    description: "div onClick without keyboard support",
    code: `export function Row() {
  return <div onClick={() => console.log("x")}>Open</div>
}`,
    expectTitleIncludes: ["Clickable non-interactive element"],
  },
  {
    id: "clickable-div-negative",
    family: "static-jsx",
    kind: "false-positive",
    description: "Button onClick must not flag clickable div rule",
    code: `import { Button } from "@/components/ui/button"
export function Row({ onOpen }: { onOpen: () => void }) {
  return <Button onClick={onOpen} className="hover:bg-accent focus-visible:ring-2" disabled={false}>Open</Button>
}`,
    forbidTitleIncludes: ["Clickable non-interactive element"],
  },

  // —— Select ——
  {
    id: "select-value-positive",
    family: "select",
    kind: "positive",
    description: "SelectTrigger without SelectValue",
    code: `import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select"
export function ThemeSelect({ themes }: { themes: string[] }) {
  return (
    <Select>
      <SelectTrigger />
      <SelectContent>
        {themes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
      </SelectContent>
    </Select>
  )
}`,
    expectTitleIncludes: ["Select missing SelectValue"],
  },

  // —— Parser recovery ——
  {
    id: "parser-recovery-locations",
    family: "parser-recovery",
    kind: "parser-recovery",
    description: "Broken JSX still analyzes; locations unreliable",
    code: `import { Button } from "@/components/ui/button"
export function Broken({ onSave }: { onSave: () => void }) {
  return (
    <Button onClick={onSave
      Save
    </Button>
  )
}`,
    expectLocationsUnreliable: true,
    expectMinIssues: 1,
  },

  // —— Ambiguous / low confidence ——
  {
    id: "ambiguous-raw-button",
    family: "patterns",
    kind: "ambiguous",
    description: "Native button may flag low-confidence pattern only",
    code: `export function Chip({ onClick }: { onClick: () => void }) {
  return <button type="button" className="px-2" onClick={onClick}>Chip</button>
}`,
    expectAnyIssueIds: ["pattern-raw-button"],
  },

  // —— Form field errors ——
  {
    id: "form-field-error-positive",
    family: "forms",
    kind: "positive",
    description: "Form inputs without field error UI",
    code: `import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
export function InviteForm() {
  return (
    <form>
      <Input type="email" placeholder="Email" />
      <Button type="submit">Invite</Button>
    </form>
  )
}`,
    expectIssueIds: ["state-form-field-error", "pattern-form-submit"],
  },
  {
    id: "form-field-error-negative",
    family: "forms",
    kind: "negative",
    description: "Form with aria-invalid + FormMessage style errors",
    code: `import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
export function InviteForm({
  error, isPending, onSubmit,
}: {
  error?: string
  isPending: boolean
  onSubmit: (e: React.FormEvent) => void
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-2">
      <Label htmlFor="email">Email</Label>
      <Input
        id="email"
        type="email"
        aria-invalid={!!error}
        aria-describedby={error ? "email-error" : undefined}
        disabled={isPending}
        className="focus-visible:ring-2"
      />
      {error && <p id="email-error" role="alert">{error}</p>}
      <Button type="submit" disabled={isPending} aria-busy={isPending}>
        {isPending ? "Sending…" : "Invite"}
      </Button>
    </form>
  )
}`,
    forbidIssueIds: ["state-form-field-error", "pattern-form-submit"],
  },
];
