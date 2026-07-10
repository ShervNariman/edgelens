"use client";

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
  type AgentWorkload,
  type BlockerSeverity,
  type ChecklistStatus,
  type IssueStatus,
  type NextAction,
  type SprintMetric,
} from "@/lib/command-center-data";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  CheckCircle2,
  Circle,
  CircleDashed,
  LayoutDashboard,
  ListTodo,
  Radar,
  Users,
} from "lucide-react";

function statusBadgeClass(status: IssueStatus | ChecklistStatus): string {
  switch (status) {
    case "done":
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-200";
    case "in_progress":
      return "border-sky-500/30 bg-sky-500/10 text-sky-200";
    case "in_review":
      return "border-violet-500/30 bg-violet-500/10 text-violet-200";
    case "partial":
      return "border-amber-500/30 bg-amber-500/10 text-amber-200";
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
    case "partial":
      return "Partial";
    case "blocked":
      return "Blocked";
    case "todo":
      return "Todo";
    default:
      return status;
  }
}

function severityBadgeClass(severity: BlockerSeverity): string {
  if (severity === "high") {
    return "border-destructive/35 bg-destructive/10 text-destructive";
  }
  if (severity === "medium") {
    return "border-amber-500/30 bg-amber-500/10 text-amber-200";
  }
  return "border-border bg-muted/40 text-muted-foreground";
}

function metricToneClass(tone: SprintMetric["tone"]): string {
  if (tone === "success") return "text-emerald-400";
  if (tone === "warning") return "text-amber-300";
  if (tone === "danger") return "text-destructive";
  return "text-foreground";
}

function progressBarTone(tone: SprintMetric["tone"]): string {
  if (tone === "success") return "bg-emerald-500";
  if (tone === "warning") return "bg-amber-400";
  if (tone === "danger") return "bg-destructive";
  return "bg-foreground/70";
}

function capacityLabel(capacity: AgentWorkload["capacity"]): string {
  if (capacity === "available") return "Available";
  if (capacity === "focused") return "Focused";
  return "At capacity";
}

function capacityBadgeClass(capacity: AgentWorkload["capacity"]): string {
  if (capacity === "available") {
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-200";
  }
  if (capacity === "focused") {
    return "border-sky-500/30 bg-sky-500/10 text-sky-200";
  }
  return "border-amber-500/30 bg-amber-500/10 text-amber-200";
}

function urgencyBadgeClass(urgency: NextAction["urgency"]): string {
  if (urgency === "now") {
    return "border-destructive/35 bg-destructive/10 text-destructive";
  }
  if (urgency === "soon") {
    return "border-amber-500/30 bg-amber-500/10 text-amber-200";
  }
  return "border-border bg-muted/40 text-muted-foreground";
}

function ChecklistIcon({ status }: { status: ChecklistStatus }) {
  if (status === "done") {
    return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />;
  }
  if (status === "partial") {
    return <CircleDashed className="h-3.5 w-3.5 text-amber-300" />;
  }
  if (status === "blocked") {
    return <AlertTriangle className="h-3.5 w-3.5 text-destructive" />;
  }
  return <Circle className="h-3.5 w-3.5 text-muted-foreground" />;
}

function ProgressBar({
  value,
  tone = "neutral",
}: {
  value: number;
  tone?: SprintMetric["tone"];
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
        className={cn("h-full rounded-full transition-all", progressBarTone(tone))}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}

export function CommandCenterDashboard() {
  const data = commandCenterData;
  const doneCount = data.issues.filter((i) => i.status === "done").length;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/60">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-3 px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center gap-2 font-mono text-xs text-muted-foreground">
            <LayoutDashboard className="h-3.5 w-3.5 text-emerald-400" />
            <span>internal.ops</span>
            <span className="text-emerald-400/80">|</span>
            <span>snapshot {data.updatedAt}</span>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-1">
              <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                EdgeLens Command Center
              </h1>
              <p className="max-w-2xl text-sm text-muted-foreground">
                {data.sprintName} — {data.sprintGoal}
              </p>
            </div>
            <Badge variant="outline" className="w-fit font-mono text-[11px]">
              {doneCount}/{data.issues.length} issues done
            </Badge>
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-[1440px] flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        {/* Sprint status */}
        <section aria-labelledby="sprint-status-heading" className="space-y-3">
          <h2
            id="sprint-status-heading"
            className="font-mono text-xs tracking-wide text-muted-foreground uppercase"
          >
            Sprint status
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {data.metrics.map((metric) => (
              <Card key={metric.id} size="sm">
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
          <section aria-labelledby="issues-heading" className="space-y-3">
            <h2
              id="issues-heading"
              className="font-mono text-xs tracking-wide text-muted-foreground uppercase"
            >
              Issue progress
            </h2>
            <Card size="sm" className="overflow-hidden py-0">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead className="border-b border-border/60 bg-muted/30 text-xs text-muted-foreground">
                    <tr>
                      <th className="px-4 py-2.5 font-medium">Issue</th>
                      <th className="px-4 py-2.5 font-medium">Status</th>
                      <th className="px-4 py-2.5 font-medium">Owner</th>
                      <th className="px-4 py-2.5 font-medium">Pri</th>
                      <th className="px-4 py-2.5 font-medium">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.issues.map((issue) => (
                      <tr
                        key={issue.id}
                        className="border-b border-border/40 last:border-0"
                      >
                        <td className="px-4 py-2.5 align-top">
                          <div className="space-y-0.5">
                            {issue.href ? (
                              <a
                                href={issue.href}
                                target="_blank"
                                rel="noreferrer"
                                className="font-mono text-xs text-emerald-400 hover:underline"
                              >
                                {issue.id}
                              </a>
                            ) : (
                              <span className="font-mono text-xs text-emerald-400">
                                {issue.id}
                              </span>
                            )}
                            <p className="max-w-xs text-foreground">
                              {issue.title}
                            </p>
                          </div>
                        </td>
                        <td className="px-4 py-2.5 align-top">
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[11px]",
                              statusBadgeClass(issue.status)
                            )}
                          >
                            {statusLabel(issue.status)}
                          </Badge>
                        </td>
                        <td className="px-4 py-2.5 align-top text-muted-foreground">
                          {issue.owner}
                        </td>
                        <td className="px-4 py-2.5 align-top font-mono text-xs text-muted-foreground">
                          {issue.priority}
                        </td>
                        <td className="px-4 py-2.5 align-top text-xs text-muted-foreground">
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
            <h2
              id="blockers-heading"
              className="flex items-center gap-2 font-mono text-xs tracking-wide text-muted-foreground uppercase"
            >
              <Radar className="h-3.5 w-3.5" />
              Launch blockers
            </h2>
            <div className="space-y-3">
              {data.blockers.length === 0 ? (
                <Card size="sm">
                  <CardContent className="text-sm text-muted-foreground">
                    No open blockers.
                  </CardContent>
                </Card>
              ) : (
                data.blockers.map((blocker) => (
                  <Card key={blocker.id} size="sm">
                    <CardHeader className="gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[11px] capitalize",
                            severityBadgeClass(blocker.severity)
                          )}
                        >
                          {blocker.severity}
                        </Badge>
                        {blocker.relatedIssue ? (
                          <span className="font-mono text-[11px] text-muted-foreground">
                            {blocker.relatedIssue}
                          </span>
                        ) : null}
                        <span className="text-[11px] text-muted-foreground">
                          · {blocker.owner}
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
                ))
              )}
            </div>
          </section>
        </div>

        {/* Release readiness checklist */}
        <section aria-labelledby="checklist-heading" className="space-y-3">
          <h2
            id="checklist-heading"
            className="font-mono text-xs tracking-wide text-muted-foreground uppercase"
          >
            Release readiness
          </h2>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {data.checklist.map((group) => {
              const done = group.items.filter((i) => i.status === "done").length;
              const pct = Math.round((done / group.items.length) * 100);
              return (
                <Card key={group.id} size="sm">
                  <CardHeader className="gap-2">
                    <div className="flex items-center justify-between gap-2">
                      <CardTitle className="text-sm">{group.area}</CardTitle>
                      <span className="font-mono text-[11px] text-muted-foreground tabular-nums">
                        {done}/{group.items.length}
                      </span>
                    </div>
                    <ProgressBar
                      value={pct}
                      tone={
                        pct === 100
                          ? "success"
                          : pct >= 50
                            ? "warning"
                            : "danger"
                      }
                    />
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {group.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-start gap-2 text-xs"
                      >
                        <ChecklistIcon status={item.status} />
                        <div className="min-w-0 flex-1 space-y-0.5">
                          <p className="leading-snug text-foreground">
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
              );
            })}
          </div>
        </section>

        {/* Agent workload */}
        <section aria-labelledby="agents-heading" className="space-y-3">
          <h2
            id="agents-heading"
            className="flex items-center gap-2 font-mono text-xs tracking-wide text-muted-foreground uppercase"
          >
            <Users className="h-3.5 w-3.5" />
            Agent workload
          </h2>
          <div className="grid gap-3 md:grid-cols-3">
            {data.agents.map((agent) => (
              <Card key={agent.id} size="sm">
                <CardHeader className="gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <CardTitle>{agent.name}</CardTitle>
                      <CardDescription className="mt-0.5">
                        {agent.role}
                      </CardDescription>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[11px]",
                        capacityBadgeClass(agent.capacity)
                      )}
                    >
                      {capacityLabel(agent.capacity)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-xs text-muted-foreground">{agent.focus}</p>
                  <Separator />
                  <div className="space-y-1.5">
                    <p className="font-mono text-[10px] tracking-wide text-muted-foreground uppercase">
                      Active
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {agent.activeIssues.map((id) => (
                        <Badge
                          key={id}
                          variant="outline"
                          className="font-mono text-[11px]"
                        >
                          {id}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="font-mono text-[10px] tracking-wide text-muted-foreground uppercase">
                      Next up
                    </p>
                    <p className="text-xs leading-snug text-foreground">
                      {agent.nextUp}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Next actions */}
        <section aria-labelledby="next-actions-heading" className="space-y-3">
          <h2
            id="next-actions-heading"
            className="flex items-center gap-2 font-mono text-xs tracking-wide text-muted-foreground uppercase"
          >
            <ListTodo className="h-3.5 w-3.5" />
            Next actions
          </h2>
          <Card size="sm" className="py-0">
            <ul className="divide-y divide-border/50">
              {data.nextActions.map((item) => (
                <li
                  key={item.id}
                  className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0 space-y-1">
                    <p className="text-sm text-foreground">{item.action}</p>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span>{item.owner}</span>
                      {item.relatedIssue ? (
                        <>
                          <span aria-hidden>·</span>
                          <span className="font-mono">{item.relatedIssue}</span>
                        </>
                      ) : null}
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn(
                      "w-fit capitalize text-[11px]",
                      urgencyBadgeClass(item.urgency)
                    )}
                  >
                    {item.urgency}
                  </Badge>
                </li>
              ))}
            </ul>
          </Card>
        </section>

        <p className="pb-4 font-mono text-[11px] text-muted-foreground">
          Hardcoded snapshot — no Linear/GitHub API. Update{" "}
          <code className="text-foreground/80">lib/command-center-data.ts</code>{" "}
          when sprint status changes.
        </p>
      </main>
    </div>
  );
}
