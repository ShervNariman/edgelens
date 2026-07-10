import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Circle,
  ClipboardList,
  ExternalLink,
  Gauge,
  ListTodo,
  Radar,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  commandCenterData,
  type AgentName,
  type ChecklistStatus,
  type IssueStatus,
  type SprintMetric,
} from "@/lib/command-center-data";
import { cn } from "@/lib/utils";

function statusBadgeClass(status: IssueStatus | ChecklistStatus): string {
  switch (status) {
    case "done":
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
    case "in_progress":
      return "border-sky-500/30 bg-sky-500/10 text-sky-300";
    case "in_review":
      return "border-violet-500/30 bg-violet-500/10 text-violet-300";
    case "blocked":
      return "border-destructive/35 bg-destructive/10 text-destructive";
    default:
      return "border-border bg-muted/40 text-muted-foreground";
  }
}

function statusLabel(status: IssueStatus | ChecklistStatus): string {
  switch (status) {
    case "done":
      return "Done";
    case "in_progress":
      return "In progress";
    case "in_review":
      return "In review";
    case "blocked":
      return "Blocked";
    default:
      return "Todo";
  }
}

function severityBadgeClass(severity: "high" | "medium" | "low"): string {
  if (severity === "high") {
    return "border-destructive/35 bg-destructive/10 text-destructive";
  }
  if (severity === "medium") {
    return "border-amber-500/30 bg-amber-500/10 text-amber-300";
  }
  return "border-border bg-muted/40 text-muted-foreground";
}

function metricToneClass(tone: SprintMetric["tone"]): string {
  if (tone === "good") return "text-emerald-400";
  if (tone === "warn") return "text-amber-300";
  if (tone === "bad") return "text-destructive";
  return "text-foreground";
}

function progressBarClass(tone: SprintMetric["tone"]): string {
  if (tone === "good") return "bg-emerald-500/80";
  if (tone === "warn") return "bg-amber-400/80";
  if (tone === "bad") return "bg-destructive/80";
  return "bg-foreground/70";
}

function capacityLabel(capacity: "light" | "steady" | "heavy"): string {
  if (capacity === "heavy") return "Heavy";
  if (capacity === "light") return "Light";
  return "Steady";
}

function capacityBadgeClass(capacity: "light" | "steady" | "heavy"): string {
  if (capacity === "heavy") {
    return "border-amber-500/30 bg-amber-500/10 text-amber-300";
  }
  if (capacity === "light") {
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";
  }
  return "border-sky-500/30 bg-sky-500/10 text-sky-300";
}

function agentAccent(name: AgentName): string {
  if (name === "Sherv") return "border-l-emerald-500/60";
  if (name === "Cursor") return "border-l-sky-500/60";
  return "border-l-violet-500/60";
}

function ProgressBar({
  value,
  tone,
}: {
  value: number;
  tone: SprintMetric["tone"];
}) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div
      className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={cn("h-full rounded-full transition-all", progressBarClass(tone))}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}

function ChecklistIcon({ status }: { status: ChecklistStatus }) {
  if (status === "done") {
    return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />;
  }
  if (status === "blocked") {
    return <AlertTriangle className="h-3.5 w-3.5 text-destructive" />;
  }
  if (status === "in_progress") {
    return <Gauge className="h-3.5 w-3.5 text-sky-300" />;
  }
  return <Circle className="h-3.5 w-3.5 text-muted-foreground" />;
}

export function CommandCenterDashboard() {
  const data = commandCenterData;
  const doneCount = data.issues.filter((i) => i.status === "done").length;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/60">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-4 px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
              <Radar className="h-3.5 w-3.5 text-emerald-400" />
              <span>internal.ops</span>
              <span className="text-emerald-400/80">/</span>
              <span>command-center</span>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="outline" className="font-mono">
                Snapshot {data.updatedAt}
              </Badge>
              <Link
                href="/analyzer"
                className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1 transition-colors hover:bg-muted"
              >
                Analyzer
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>

          <div className="space-y-1.5">
            <h1 className="font-heading text-2xl font-semibold tracking-tight sm:text-3xl">
              EdgeLens Command Center
            </h1>
            <p className="max-w-3xl text-sm text-muted-foreground sm:text-base">
              {data.sprintName} — {data.sprintGoal}
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-[1440px] flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        {/* Sprint status cards */}
        <section aria-labelledby="sprint-status-heading" className="space-y-3">
          <div className="flex items-center gap-2">
            <Gauge className="h-4 w-4 text-muted-foreground" />
            <h2
              id="sprint-status-heading"
              className="text-sm font-medium tracking-wide text-muted-foreground uppercase"
            >
              Sprint status
            </h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {data.metrics.map((metric) => (
              <Card key={metric.id} size="sm" className="bg-card/60">
                <CardHeader className="gap-0.5">
                  <CardDescription>{metric.label}</CardDescription>
                  <CardTitle
                    className={cn(
                      "font-mono text-2xl tabular-nums",
                      metricToneClass(metric.tone)
                    )}
                  >
                    {metric.value}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {typeof metric.progress === "number" ? (
                    <ProgressBar value={metric.progress} tone={metric.tone} />
                  ) : null}
                  <p className="text-xs text-muted-foreground">{metric.detail}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
          {/* Issue progress table */}
          <section aria-labelledby="issue-progress-heading" className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-muted-foreground" />
                <h2
                  id="issue-progress-heading"
                  className="text-sm font-medium tracking-wide text-muted-foreground uppercase"
                >
                  Issue progress
                </h2>
              </div>
              <span className="font-mono text-xs text-muted-foreground">
                {doneCount}/{data.issues.length} done
              </span>
            </div>
            <Card size="sm" className="overflow-hidden bg-card/60 p-0">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead className="border-b border-border/60 bg-muted/30 text-xs text-muted-foreground">
                    <tr>
                      <th className="px-4 py-2.5 font-medium">Issue</th>
                      <th className="px-4 py-2.5 font-medium">Status</th>
                      <th className="px-4 py-2.5 font-medium">Priority</th>
                      <th className="px-4 py-2.5 font-medium">Owner</th>
                      <th className="px-4 py-2.5 font-medium">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.issues.map((issue) => (
                      <tr
                        key={issue.id}
                        className="border-b border-border/40 last:border-0"
                      >
                        <td className="px-4 py-3 align-top">
                          <a
                            href={issue.href}
                            target="_blank"
                            rel="noreferrer"
                            className="group inline-flex max-w-[280px] flex-col gap-0.5"
                          >
                            <span className="font-mono text-xs text-emerald-400/90">
                              {issue.id}
                            </span>
                            <span className="text-sm text-foreground group-hover:underline">
                              {issue.title}
                            </span>
                          </a>
                        </td>
                        <td className="px-4 py-3 align-top">
                          <Badge
                            variant="outline"
                            className={statusBadgeClass(issue.status)}
                          >
                            {statusLabel(issue.status)}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 align-top">
                          <span className="font-mono text-xs text-muted-foreground">
                            {issue.priority}
                          </span>
                        </td>
                        <td className="px-4 py-3 align-top text-sm">
                          {issue.owner}
                        </td>
                        <td className="px-4 py-3 align-top text-xs text-muted-foreground">
                          {issue.notes}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </section>

          {/* Launch blockers */}
          <section aria-labelledby="blockers-heading" className="space-y-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-300" />
              <h2
                id="blockers-heading"
                className="text-sm font-medium tracking-wide text-muted-foreground uppercase"
              >
                Launch blockers
              </h2>
            </div>
            <div className="space-y-3">
              {data.blockers.map((blocker) => (
                <Card key={blocker.id} size="sm" className="bg-card/60">
                  <CardHeader className="gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        variant="outline"
                        className={severityBadgeClass(blocker.severity)}
                      >
                        {blocker.severity}
                      </Badge>
                      {blocker.relatedIssue ? (
                        <span className="font-mono text-xs text-muted-foreground">
                          {blocker.relatedIssue}
                        </span>
                      ) : null}
                      <span className="text-xs text-muted-foreground">
                        Owner: {blocker.owner}
                      </span>
                    </div>
                    <CardTitle className="text-sm leading-snug">
                      {blocker.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      {blocker.detail}
                    </p>
                  </CardContent>
                </Card>
              ))}
              {data.blockers.length === 0 ? (
                <Card size="sm" className="bg-card/60">
                  <CardContent className="py-4 text-sm text-muted-foreground">
                    No open launch blockers.
                  </CardContent>
                </Card>
              ) : null}
            </div>
          </section>
        </div>

        {/* Release readiness checklist */}
        <section aria-labelledby="checklist-heading" className="space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            <h2
              id="checklist-heading"
              className="text-sm font-medium tracking-wide text-muted-foreground uppercase"
            >
              Release readiness
            </h2>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {data.checklist.map((group) => (
              <Card key={group.id} size="sm" className="bg-card/60">
                <CardHeader>
                  <CardTitle className="text-sm">{group.area}</CardTitle>
                  <CardDescription>
                    {
                      group.items.filter((item) => item.status === "done")
                        .length
                    }
                    /{group.items.length} complete
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2.5">
                  {group.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-start gap-2 border-t border-border/40 pt-2.5 first:border-0 first:pt-0"
                    >
                      <ChecklistIcon status={item.status} />
                      <div className="min-w-0 flex-1 space-y-1">
                        <p className="text-xs leading-snug text-foreground">
                          {item.label}
                        </p>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Badge
                            variant="outline"
                            className={cn(
                              "h-4 px-1.5 text-[10px]",
                              statusBadgeClass(item.status)
                            )}
                          >
                            {statusLabel(item.status)}
                          </Badge>
                          {item.note ? (
                            <span className="font-mono text-[10px] text-muted-foreground">
                              {item.note}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Agent workload */}
        <section aria-labelledby="agents-heading" className="space-y-3">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <h2
              id="agents-heading"
              className="text-sm font-medium tracking-wide text-muted-foreground uppercase"
            >
              Agent workload
            </h2>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {data.agents.map((agent) => (
              <Card
                key={agent.name}
                size="sm"
                className={cn(
                  "border-l-2 bg-card/60",
                  agentAccent(agent.name)
                )}
              >
                <CardHeader className="gap-1">
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle>{agent.name}</CardTitle>
                    <Badge
                      variant="outline"
                      className={capacityBadgeClass(agent.capacity)}
                    >
                      {capacityLabel(agent.capacity)}
                    </Badge>
                  </div>
                  <CardDescription>{agent.role}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    {agent.focus}
                  </p>
                  <Separator />
                  <div className="space-y-1.5">
                    <p className="text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
                      Active issues
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {agent.activeIssues.map((issueId) => (
                        <Badge
                          key={issueId}
                          variant="outline"
                          className="font-mono text-[10px]"
                        >
                          {issueId}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Next actions */}
        <section aria-labelledby="next-actions-heading" className="space-y-3">
          <div className="flex items-center gap-2">
            <ListTodo className="h-4 w-4 text-muted-foreground" />
            <h2
              id="next-actions-heading"
              className="text-sm font-medium tracking-wide text-muted-foreground uppercase"
            >
              Next actions
            </h2>
          </div>
          <Card size="sm" className="bg-card/60">
            <CardContent className="divide-y divide-border/50 p-0">
              {data.nextActions.map((action, index) => (
                <div
                  key={action.id}
                  className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-start sm:justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs text-muted-foreground">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <p className="text-sm font-medium text-foreground">
                        {action.title}
                      </p>
                      <Badge variant="outline" className="font-mono text-[10px]">
                        {action.priority}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {action.detail}
                    </p>
                  </div>
                  <Badge variant="secondary" className="w-fit shrink-0">
                    {action.owner}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        <footer className="border-t border-border/50 pt-4 pb-2">
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span>Hardcoded sprint snapshot — no Linear/GitHub API.</span>
            <span className="hidden sm:inline">·</span>
            <a
              href="https://linear.app/sherv-nariman"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 hover:text-foreground"
            >
              Linear workspace
              <ExternalLink className="h-3 w-3" />
            </a>
            <span>·</span>
            <Link href="/record/edgelens" className="hover:text-foreground">
              Recording route
            </Link>
          </p>
        </footer>
      </main>
    </div>
  );
}
