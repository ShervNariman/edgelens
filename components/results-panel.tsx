"use client";

import type {
  AnalysisIssue,
  AnalysisReport,
  IssueSeverity,
  IssueSource,
  SuggestedFix,
} from "@/types/analysis";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ANALYZER_COPY, CHECK_LAYERS } from "@/lib/product-copy";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  Check,
  Copy,
  Info,
  ShieldAlert,
} from "lucide-react";
import { useMemo, useState } from "react";

interface ResultsPanelProps {
  report: AnalysisReport | null;
  isAnalyzing: boolean;
  pendingAxe?: boolean;
  onAnnounce?: (message: string) => void;
}

function severityIcon(severity: IssueSeverity) {
  if (severity === "critical") {
    return <ShieldAlert className="h-3.5 w-3.5" aria-hidden />;
  }
  if (severity === "warning") {
    return <AlertTriangle className="h-3.5 w-3.5" aria-hidden />;
  }
  return <Info className="h-3.5 w-3.5" aria-hidden />;
}

function severityClass(severity: IssueSeverity) {
  if (severity === "critical") {
    return "border-destructive/35 bg-destructive/8";
  }
  if (severity === "warning") {
    return "border-amber-500/30 bg-amber-500/8";
  }
  return "border-border bg-muted/30";
}

function severityLabel(severity: IssueSeverity): "High" | "Medium" | "Low" {
  if (severity === "critical") return "High";
  if (severity === "warning") return "Medium";
  return "Low";
}

function sourceLabel(source: IssueSource): string {
  switch (source) {
    case "preview":
      return "Preview";
    case "state-rule":
      return "State rule";
    case "a11y-rule":
      return "A11y rule";
    default:
      return "Static";
  }
}

function sourceBadgeClass(source: IssueSource): string {
  switch (source) {
    case "preview":
      return "border-violet-500/30 bg-violet-500/10 text-violet-900 dark:text-violet-200";
    case "state-rule":
      return "border-sky-500/30 bg-sky-500/10 text-sky-900 dark:text-sky-200";
    case "a11y-rule":
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-900 dark:text-emerald-200";
    default:
      return "border-border bg-muted/40 text-muted-foreground";
  }
}

function scoreColor(score: number) {
  if (score >= 80) return "text-emerald-600 dark:text-emerald-400";
  if (score >= 50) return "text-amber-600 dark:text-amber-300";
  return "text-destructive";
}

function buildFindingsSummary(report: AnalysisReport): string {
  const { summary, stateCoverage, issues } = report;
  const missingRequired = stateCoverage.filter((s) => s.required && !s.present);
  const staticCount = issues.filter(
    (i) =>
      i.source !== "preview" &&
      (i.category === "accessibility" ||
        i.category === "pattern" ||
        i.category === "interaction")
  ).length;
  const previewCount = issues.filter((i) => i.source === "preview").length;

  if (summary.totalIssues === 0) {
    return "No issues flagged — state coverage and supporting checks look solid for this pass.";
  }

  const parts: string[] = [];
  if (missingRequired.length > 0) {
    parts.push(
      `${missingRequired.length} state gap${missingRequired.length === 1 ? "" : "s"} (${missingRequired
        .map((s) => s.state)
        .slice(0, 3)
        .join(", ")}${missingRequired.length > 3 ? "…" : ""})`
    );
  }
  if (staticCount > 0) {
    parts.push(
      `${staticCount} static JSX/shadcn finding${staticCount === 1 ? "" : "s"}`
    );
  }
  if (previewCount > 0) {
    parts.push(
      `${previewCount} preview DOM finding${previewCount === 1 ? "" : "s"}`
    );
  }

  return parts.join(" · ") || `${summary.totalIssues} findings to review`;
}

export function ResultsPanel({
  report,
  isAnalyzing,
  pendingAxe = false,
  onAnnounce,
}: ResultsPanelProps) {
  const findingsSummary = useMemo(
    () => (report ? buildFindingsSummary(report) : ""),
    [report]
  );
  const issueById = useMemo(() => {
    const map = new Map<string, AnalysisIssue>();
    if (!report) return map;
    for (const issue of report.issues) map.set(issue.id, issue);
    return map;
  }, [report]);

  if (isAnalyzing) {
    return (
      <EmptyShell>
        <div
          className="flex min-h-[280px] flex-col items-center justify-center gap-3 py-12"
          aria-busy="true"
        >
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent motion-reduce:animate-none" />
          <p className="font-mono text-sm text-muted-foreground">
            {ANALYZER_COPY.analyzing}
          </p>
          <div className="mt-2 grid w-full max-w-md grid-cols-2 gap-2 opacity-60 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-16 animate-pulse rounded-xl border border-border/60 bg-muted/40 motion-reduce:animate-none"
              />
            ))}
          </div>
        </div>
      </EmptyShell>
    );
  }

  if (!report) {
    return (
      <EmptyShell>
        <div className="flex min-h-[280px] flex-col items-center justify-center gap-2 py-12 text-center">
          <p className="text-sm font-medium text-foreground">
            {ANALYZER_COPY.noAnalysisYet}
          </p>
          <p className="max-w-sm text-xs text-muted-foreground">
            {ANALYZER_COPY.noAnalysisHint}
          </p>
        </div>
      </EmptyShell>
    );
  }

  const {
    summary,
    issues,
    stateCoverage,
    a11yTree,
    axeViolations = [],
    previewDomChecked = false,
    suggestedFixes,
    detectedComponents,
    componentName,
    primaryType,
    parseErrors,
  } = report;

  const missingRequired = stateCoverage.filter((s) => s.required && !s.present);
  const stateIssues = issues.filter(
    (i) => i.category === "missing-state" || i.source === "state-rule"
  );
  const staticIssues = issues.filter(
    (i) =>
      i.source !== "preview" &&
      i.category !== "missing-state" &&
      i.source !== "state-rule"
  );
  const previewIssues = issues.filter((i) => i.source === "preview");
  const previewChecked = previewDomChecked || previewIssues.length > 0;

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
        <Stat
          label="Score"
          value={`${summary.score}`}
          valueClass={scoreColor(summary.score)}
          hint="/ 100"
        />
        <Stat
          label="States"
          value={`${summary.statesCovered}`}
          hint={`/ ${summary.statesTotal}`}
        />
        <Stat label="Issues" value={`${summary.totalIssues}`} />
        <Stat label="Components" value={`${summary.componentsDetected}`} />
      </div>
      <p className="text-[11px] leading-relaxed text-muted-foreground">
        {ANALYZER_COPY.scoreDisclaimer}
      </p>

      <div className="rounded-xl border border-sky-500/25 bg-sky-500/5 px-4 py-3">
        <p className="text-[11px] font-medium uppercase tracking-wider text-sky-900">
          {ANALYZER_COPY.stateHeroLabel}
        </p>
        <p className="mt-1.5 text-sm leading-relaxed text-foreground">
          {findingsSummary}
        </p>
        {missingRequired.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {missingRequired.map((s) => (
              <Badge
                key={s.state}
                variant="outline"
                className="border-sky-500/30 bg-sky-500/10 font-mono text-[10px] text-sky-900 dark:text-sky-100"
              >
                {s.state}
              </Badge>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-border/60 bg-muted/20 px-4 py-3">
        <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          Check layers
        </p>
        <ul className="mt-2 grid gap-1.5 text-xs text-muted-foreground sm:grid-cols-2">
          <li className="flex gap-2">
            <span className="text-emerald-500">1</span>
            <span>
              <span className="text-foreground/85">State completeness</span>
              {" — "}
              {missingRequired.length > 0
                ? `${missingRequired.length} gap${missingRequired.length === 1 ? "" : "s"}`
                : "coverage reviewed"}
            </span>
          </li>
          <li className="flex gap-2">
            <span className="text-emerald-500">2</span>
            <span>
              <span className="text-foreground/85">Static JSX / shadcn</span>
              {" — "}
              {staticIssues.length} finding
              {staticIssues.length === 1 ? "" : "s"}
            </span>
          </li>
          <li className="flex gap-2">
            <span
              className={
                previewChecked ? "text-emerald-500" : "text-muted-foreground/60"
              }
            >
              3
            </span>
            <span>
              <span className="text-foreground/85">Preview DOM</span>
              {" — "}
              {pendingAxe
                ? ANALYZER_COPY.previewDomPending
                : previewChecked
                  ? `${previewIssues.length || axeViolations.length} finding${
                      (previewIssues.length || axeViolations.length) === 1
                        ? ""
                        : "s"
                    }`
                  : "pending after Analyze"}
            </span>
          </li>
          <li className="flex gap-2">
            <span className="text-emerald-500">4</span>
            <span>
              <span className="text-foreground/85">Rule-based fixes</span>
              {" — "}
              {suggestedFixes.length} template
              {suggestedFixes.length === 1 ? "" : "s"}
            </span>
          </li>
        </ul>
        <p className="mt-2 font-mono text-[10px] text-muted-foreground/80">
          {componentName ? `${componentName} · ${primaryType}` : primaryType}
          {parseErrors.length > 0 ? " · parse recovery notes" : ""}
        </p>
      </div>

      <Tabs defaultValue="states" className="w-full">
        <TabsList
          aria-label="Analysis report layers"
          className="grid h-auto w-full grid-cols-2 gap-1 sm:grid-cols-4"
        >
          <TabsTrigger value="states" className="text-xs sm:text-sm">
            {CHECK_LAYERS.states.short}
            {missingRequired.length > 0 && (
              <span className="ml-1.5 font-mono text-[10px] opacity-70">
                {missingRequired.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="static" className="text-xs sm:text-sm">
            {CHECK_LAYERS.static.short}
            {staticIssues.length > 0 && (
              <span className="ml-1.5 font-mono text-[10px] opacity-70">
                {staticIssues.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="preview" className="text-xs sm:text-sm">
            {CHECK_LAYERS.preview.short}
            {(previewIssues.length > 0 || axeViolations.length > 0) && (
              <span className="ml-1.5 font-mono text-[10px] opacity-70">
                {previewIssues.length || axeViolations.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="fixes" className="text-xs sm:text-sm">
            {CHECK_LAYERS.fixes.short}
            {suggestedFixes.length > 0 && (
              <span className="ml-1.5 font-mono text-[10px] opacity-70">
                {suggestedFixes.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="states" className="mt-4 space-y-4">
          <div>
            <p className="text-sm font-medium text-foreground">
              {CHECK_LAYERS.states.label}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              {CHECK_LAYERS.states.blurb} Force states in the live preview to see
              what the happy path hid.
            </p>
          </div>

          {stateIssues.length > 0 && (
            <div className="space-y-2.5">
              {stateIssues.map((issue) => (
                <IssueCard key={issue.id} issue={issue} />
              ))}
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            Green = detected in source · Blue = not implemented · Gray = optional
          </p>
          <div className="grid gap-2.5 sm:grid-cols-2">
            {stateCoverage.map((s) => (
              <div
                key={s.state}
                className={cn(
                  "rounded-xl border px-4 py-3.5 transition-colors",
                  s.present
                    ? "border-emerald-500/30 bg-emerald-500/5"
                    : s.required
                      ? "border-sky-500/30 bg-sky-500/8"
                      : "border-border bg-muted/20"
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-sm font-medium">{s.state}</span>
                  <Badge
                    variant={s.present ? "secondary" : "outline"}
                    className={cn(
                      "text-[10px]",
                      !s.present &&
                        s.required &&
                        "border-sky-500/30 text-sky-800 dark:text-sky-200"
                    )}
                  >
                    {s.present
                      ? "in source"
                      : s.required
                        ? "not implemented"
                        : "optional"}
                  </Badge>
                </div>
                {s.evidence ? (
                  <p className="mt-2 truncate font-mono text-[10px] text-muted-foreground">
                    matched: {s.evidence}
                  </p>
                ) : !s.present ? (
                  <p className="mt-2 text-xs text-muted-foreground">
                    No evidence found in the pasted source.
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="static" className="mt-4 space-y-4">
          <div>
            <p className="text-sm font-medium text-foreground">
              {CHECK_LAYERS.static.label}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              {CHECK_LAYERS.static.blurb} Supporting risk detection — not a full
              accessibility audit.
            </p>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {detectedComponents.length === 0 ? (
              <Badge variant="outline">No shadcn primitives detected</Badge>
            ) : (
              detectedComponents.map((c) => (
                <Badge
                  key={`${c.type}-${c.name}`}
                  variant="secondary"
                  className="font-mono text-[11px]"
                >
                  {c.name}
                </Badge>
              ))
            )}
          </div>

          <div className="space-y-2.5">
            {staticIssues.length === 0 ? (
              <p className="text-sm text-emerald-600 dark:text-emerald-400">
                No static JSX/shadcn issues flagged.
              </p>
            ) : (
              staticIssues.map((issue) => (
                <IssueCard key={issue.id} issue={issue} />
              ))
            )}
          </div>

          {parseErrors.length > 0 && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3">
              <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                Parse notes
              </p>
              <div className="mt-2 space-y-1 font-mono text-xs text-muted-foreground">
                {parseErrors.map((e) => (
                  <p key={e}>{e}</p>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="preview" className="mt-4 space-y-5">
          <div>
            <p className="text-sm font-medium text-foreground">
              {CHECK_LAYERS.preview.label}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              {CHECK_LAYERS.preview.blurb} Supporting risk detection — does not
              certify WCAG compliance.
            </p>
          </div>

          <section className="space-y-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Preview DOM checks
              </p>
              <Badge
                variant="outline"
                className="border-violet-500/30 bg-violet-500/10 font-mono text-[10px] text-violet-900 dark:text-violet-200"
              >
                Preview
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground">
              axe-core on the simulated preview DOM — not your raw pasted JSX.
            </p>
            {pendingAxe ? (
              <p className="text-sm text-muted-foreground" aria-busy="true">
                {ANALYZER_COPY.previewDomPending}
              </p>
            ) : !previewChecked ? (
              <p className="text-sm text-muted-foreground">
                Preview DOM checks run automatically after Analyze.
              </p>
            ) : previewIssues.length === 0 && axeViolations.length === 0 ? (
              <p className="text-sm text-emerald-600 dark:text-emerald-400">
                No preview DOM violations detected.
              </p>
            ) : previewIssues.length > 0 ? (
              previewIssues.map((issue) => (
                <IssueCard key={issue.id} issue={issue} />
              ))
            ) : (
              axeViolations.map((v) => (
                <div
                  key={v.id}
                  className="rounded-xl border border-violet-500/25 bg-violet-500/5 px-4 py-3"
                >
                  <div className="flex flex-wrap items-center gap-1.5">
                    <p className="text-sm font-medium">{v.help}</p>
                    <Badge
                      variant="outline"
                      className="border-violet-500/30 bg-violet-500/10 font-mono text-[10px] text-violet-900 dark:text-violet-200"
                    >
                      Preview
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {v.description}
                  </p>
                  <p className="mt-2 font-mono text-[10px] text-muted-foreground">
                    {v.id} · impact={v.impact ?? "n/a"} · nodes={v.nodes}
                  </p>
                </div>
              ))
            )}
          </section>

          <Separator />

          <div>
            <p className="mb-2.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Approximate a11y tree
            </p>
            <ul className="space-y-2 font-mono text-xs">
              {a11yTree.map((node, idx) => (
                <li
                  key={`${node.role}-${idx}`}
                  className={cn(
                    "rounded-xl border px-4 py-3",
                    node.issues.length
                      ? "border-destructive/35 bg-destructive/5"
                      : "border-border bg-card/40"
                  )}
                >
                  <span className="text-emerald-600 dark:text-emerald-400">
                    {node.role}
                  </span>
                  <span className="text-muted-foreground">
                    {" "}
                    &quot;{node.name}&quot;
                  </span>
                  {node.tag && (
                    <span className="text-muted-foreground"> · {node.tag}</span>
                  )}
                  {node.issues.length > 0 && (
                    <ul className="mt-2 space-y-1 text-destructive">
                      {node.issues.map((i) => (
                        <li key={i}>↳ {i}</li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </TabsContent>

        <TabsContent value="fixes" className="mt-4 space-y-4">
          <div>
            <p className="text-sm font-medium text-foreground">
              {CHECK_LAYERS.fixes.label}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              {CHECK_LAYERS.fixes.blurb}
            </p>
          </div>
          {suggestedFixes.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No suggested fixes for this run.
            </p>
          ) : (
            suggestedFixes.map((fix) => (
              <FixCard
                key={fix.id}
                fix={fix}
                issue={issueById.get(fix.issueId)}
                onAnnounce={onAnnounce}
              />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function IssueCard({ issue }: { issue: AnalysisIssue }) {
  return (
    <article
      className={cn(
        "rounded-xl border px-4 py-3 transition-colors",
        severityClass(issue.severity)
      )}
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 text-foreground/80">
          {severityIcon(issue.severity)}
        </span>
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex flex-wrap items-center gap-1.5">
            <h3 className="text-sm font-medium text-foreground">{issue.title}</h3>
            <Badge variant="outline" className="font-mono text-[10px]">
              {severityLabel(issue.severity)}
            </Badge>
            <Badge
              variant="outline"
              className={cn("font-mono text-[10px]", sourceBadgeClass(issue.source))}
            >
              {sourceLabel(issue.source)}
            </Badge>
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {issue.description}
          </p>
          <p className="text-xs text-foreground/80">
            <span className="text-muted-foreground">Suggestion: </span>
            {issue.suggestion}
          </p>
        </div>
      </div>
    </article>
  );
}

function Stat({
  label,
  value,
  valueClass,
  hint,
}: {
  label: string;
  value: string;
  valueClass?: string;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-border/70 bg-card/50 px-3.5 py-3">
      <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p
        className={cn(
          "mt-1 font-mono text-2xl font-semibold tracking-tight",
          valueClass
        )}
      >
        {value}
        {hint && (
          <span className="ml-1 text-sm font-normal text-muted-foreground">
            {hint}
          </span>
        )}
      </p>
    </div>
  );
}

function EmptyShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-[320px] items-center justify-center rounded-xl border border-dashed border-border/70 bg-card/20">
      {children}
    </div>
  );
}

async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fall through to legacy path.
  }

  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

function FixCard({
  fix,
  issue,
  onAnnounce,
}: {
  fix: SuggestedFix;
  issue?: AnalysisIssue;
  onAnnounce?: (message: string) => void;
}) {
  const [copied, setCopied] = useState<"after" | "before" | null>(null);
  const [copyError, setCopyError] = useState(false);

  const problem = fix.problem || issue?.title || fix.title;
  const why =
    fix.whyItMatters ||
    issue?.description ||
    "Improves interaction clarity and reduces common accessibility risks.";
  const suggestion =
    fix.suggestion || fix.description || issue?.suggestion || "";

  const copy = async (text: string, which: "after" | "before") => {
    const ok = await copyText(text);
    if (!ok) {
      setCopyError(true);
      onAnnounce?.(ANALYZER_COPY.copyFailed);
      window.setTimeout(() => setCopyError(false), 2000);
      return;
    }
    setCopyError(false);
    setCopied(which);
    onAnnounce?.(ANALYZER_COPY.copiedFix);
    window.setTimeout(() => setCopied(null), 1500);
  };

  return (
    <article className="overflow-hidden rounded-xl border border-border/80 bg-card/40">
      <div className="space-y-3 border-b border-border/60 px-4 py-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h3 className="text-sm font-semibold text-foreground">{fix.title}</h3>
          <div className="flex flex-wrap gap-1.5">
            {issue && (
              <>
                <Badge variant="outline" className="font-mono text-[10px]">
                  {severityLabel(issue.severity)}
                </Badge>
                <Badge
                  variant="outline"
                  className={cn(
                    "font-mono text-[10px]",
                    sourceBadgeClass(issue.source)
                  )}
                >
                  {sourceLabel(issue.source)}
                </Badge>
              </>
            )}
          </div>
        </div>

        <dl className="space-y-2.5 text-sm">
          <div>
            <dt className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Problem
            </dt>
            <dd className="mt-0.5 text-foreground/90">{problem}</dd>
          </div>
          <div>
            <dt className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Why it matters
            </dt>
            <dd className="mt-0.5 leading-relaxed text-muted-foreground">{why}</dd>
          </div>
          <div>
            <dt className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              Suggested fix
            </dt>
            <dd className="mt-0.5 leading-relaxed text-foreground/90">
              {suggestion}
            </dd>
          </div>
        </dl>
      </div>

      <div className="grid gap-0 md:grid-cols-2">
        {fix.before && (
          <div className="border-b border-border/60 md:border-r md:border-b-0">
            <div className="flex items-center justify-between gap-2 px-4 py-2.5">
              <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                Before
              </span>
              <Button
                type="button"
                size="xs"
                variant="ghost"
                className="gap-1.5"
                aria-label={
                  copied === "before"
                    ? "Copied before snippet"
                    : "Copy before snippet"
                }
                onClick={() => void copy(fix.before!, "before")}
              >
                {copied === "before" ? (
                  <Check className="h-3.5 w-3.5" aria-hidden />
                ) : (
                  <Copy className="h-3.5 w-3.5" aria-hidden />
                )}
                {copied === "before" ? "Copied" : "Copy"}
              </Button>
            </div>
            <pre className="overflow-x-auto bg-muted/30 px-4 pb-4 font-mono text-[11px] leading-relaxed text-muted-foreground">
              <code>{fix.before}</code>
            </pre>
          </div>
        )}

        <div className={cn(!fix.before && "md:col-span-2")}>
          <div className="flex items-center justify-between gap-2 px-4 py-2.5">
            <span className="text-[11px] font-medium uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
              {fix.before ? "After" : "Suggested code"}
            </span>
            <Button
              type="button"
              size="xs"
              variant="outline"
              className="gap-1.5"
              aria-label={
                copied === "after" ? "Copied after snippet" : "Copy after snippet"
              }
              onClick={() => void copy(fix.after, "after")}
            >
              {copied === "after" ? (
                <Check className="h-3.5 w-3.5" aria-hidden />
              ) : (
                <Copy className="h-3.5 w-3.5" aria-hidden />
              )}
              {copied === "after" ? "Copied" : "Copy"}
            </Button>
          </div>
          <pre className="overflow-x-auto bg-emerald-500/5 px-4 pb-4 font-mono text-[11px] leading-relaxed text-foreground/85">
            <code>{fix.after}</code>
          </pre>
        </div>
      </div>
      {copyError && (
        <p className="border-t border-destructive/30 bg-destructive/5 px-4 py-2 text-xs text-destructive" role="alert">
          {ANALYZER_COPY.copyFailed}
        </p>
      )}
    </article>
  );
}
