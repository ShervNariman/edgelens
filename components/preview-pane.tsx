"use client";

import { useEffect, useRef } from "react";
import type {
  AnalysisIssue,
  AxeViolation,
  ComponentState,
  DetectedComponent,
  DetectedComponentType,
} from "@/types/analysis";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { runAxeOnElement } from "@/lib/axe-runner";
import { buildPreviewMeta, type PreviewMeta } from "@/lib/preview-meta";
import { cn } from "@/lib/utils";
import {
  AlertCircle,
  Check,
  ChevronDown,
  FolderOpen,
  Inbox,
  Loader2,
  RefreshCw,
  Save,
  Settings,
} from "lucide-react";

const SIMULATABLE: ComponentState[] = [
  "default",
  "hover",
  "focus",
  "active",
  "disabled",
  "loading",
  "error",
  "empty",
];

/** Short, helpful copy when simulating a state not found in source. */
const STATE_GUIDANCE: Record<ComponentState, string> = {
  default: "Baseline appearance when no interaction is applied.",
  hover: "Add hover: utilities or rely on shadcn primitive hover styles.",
  focus: "Add focus-visible:ring styles for keyboard users.",
  active: "Use active: or data-[state=active] for pressed/selected feedback.",
  disabled: "Support a disabled prop with muted opacity and pointer-events-none.",
  loading: "Expose isLoading — disable the control and show a spinner.",
  error: "Surface validation/failure with aria-invalid or a destructive Alert.",
  empty: "Guard empty collections with a placeholder before mapping items.",
};

interface PreviewPaneProps {
  code: string;
  componentName: string | null;
  primaryType: DetectedComponentType;
  detectedComponents?: DetectedComponent[];
  issues?: AnalysisIssue[];
  forcedState: ComponentState;
  onForceState: (state: ComponentState) => void;
  onAxeResults?: (violations: AxeViolation[]) => void;
  runAxe?: boolean;
}

export function PreviewPane({
  code,
  componentName,
  primaryType,
  detectedComponents = [],
  issues = [],
  forcedState,
  onForceState,
  onAxeResults,
  runAxe = false,
}: PreviewPaneProps) {
  const previewRef = useRef<HTMLDivElement>(null);
  const hasCode = Boolean(code.trim());

  let meta: PreviewMeta;
  try {
    meta = buildPreviewMeta(
      code,
      componentName,
      detectedComponents.length
        ? detectedComponents
        : primaryType !== "Unknown"
          ? [{ name: primaryType, type: primaryType, props: [], hasChildren: true }]
          : [],
      issues
    );
    if (primaryType !== "Unknown") {
      meta = { ...meta, primaryType };
    }
  } catch (err) {
    console.error("[EdgeLens] preview meta failed", err);
    meta = {
      componentName,
      primaryType: primaryType !== "Unknown" ? primaryType : "Button",
      label: "Action",
      buttonVariant: "default",
      buttonSize: "default",
      isIconOnly: false,
      hasLoadingProp: false,
      placeholder: "Select an option",
      title: componentName ?? "Component preview",
      description: "Simulated shadcn preview — force states below.",
      missingStates: [],
      a11yIssues: [],
      detectedNames: detectedComponents.map((c) => c.name),
    };
  }

  useEffect(() => {
    if (!runAxe || !previewRef.current || !onAxeResults) return;

    let cancelled = false;
    const el = previewRef.current;

    const timer = window.setTimeout(async () => {
      try {
        const violations = await runAxeOnElement(el);
        if (!cancelled) onAxeResults(violations);
      } catch (err) {
        console.error("[EdgeLens] axe run failed", err);
        if (!cancelled) onAxeResults([]);
      }
    }, 120);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [runAxe, forcedState, meta.primaryType, code, onAxeResults]);

  const notImplemented = new Set(meta.missingStates);
  for (const issue of issues) {
    if (issue.category === "missing-state" && issue.state) {
      notImplemented.add(issue.state);
    }
  }

  const currentNotImplemented =
    forcedState !== "default" && notImplemented.has(forcedState);

  const implementedCount = SIMULATABLE.filter((s) => !notImplemented.has(s)).length;
  const gapCount = notImplemented.size;

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border/70 bg-card/30 p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Live preview
          </p>
          <p className="truncate font-mono text-sm text-foreground">
            {meta.componentName ?? "AnonymousComponent"}
            <span className="text-muted-foreground"> · </span>
            <span className="text-foreground/80">{meta.primaryType}</span>
            <span className="text-muted-foreground"> · </span>
            <span className="text-foreground/90">{forcedState}</span>
            {currentNotImplemented ? (
              <span className="text-muted-foreground">
                {" "}
                · <span className="text-sky-600 dark:text-sky-400">not in source</span>
              </span>
            ) : (
              <span className="text-muted-foreground">
                {" "}
                · <span className="text-emerald-700 dark:text-emerald-400">detected</span>
              </span>
            )}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {meta.a11yIssues.length > 0 && (
            <Badge variant="destructive" className="font-mono text-[10px]">
              {meta.a11yIssues.length} a11y
            </Badge>
          )}
          {gapCount > 0 && (
            <Badge
              variant="outline"
              className="border-sky-500/30 bg-sky-500/10 font-mono text-[10px] text-sky-800 dark:text-sky-200"
            >
              {gapCount} not implemented
            </Badge>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-emerald-500" aria-hidden />
            in source ({implementedCount})
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span
              className="size-1.5 rounded-full border border-sky-500/80 bg-transparent"
              aria-hidden
            />
            simulate only ({gapCount})
          </span>
        </div>

        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Force preview state">
          {SIMULATABLE.map((state) => {
            const isGap = notImplemented.has(state);
            const isSelected = forcedState === state;
            return (
              <button
                key={state}
                type="button"
                onClick={() => onForceState(state)}
                aria-pressed={isSelected}
                title={
                  isGap
                    ? `${state} — not found in source (preview simulation)`
                    : `${state} — found in source`
                }
                className={cn(
                  "inline-flex h-7 items-center gap-1.5 rounded-md border px-2.5 font-mono text-[11px] font-medium transition-all duration-200",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                  // Selected
                  isSelected &&
                    "border-foreground/20 bg-foreground text-background shadow-sm scale-[1.03]",
                  // Present in source, not selected
                  !isSelected &&
                    !isGap &&
                    "border-border bg-background text-foreground hover:bg-muted hover:border-foreground/20",
                  // Not in source, not selected — soft sky outline, high contrast text
                  !isSelected &&
                    isGap &&
                    "border-sky-600/35 bg-sky-500/10 text-sky-950 dark:border-sky-400/40 dark:bg-sky-500/15 dark:text-sky-100 hover:bg-sky-500/20",
                  // Selected + gap — keep selected look, add subtle sky ring
                  isSelected && isGap && "ring-2 ring-sky-500/35 ring-offset-1 ring-offset-background"
                )}
              >
                <span
                  className={cn(
                    "size-1.5 shrink-0 rounded-full transition-colors duration-200",
                    isSelected && !isGap && "bg-emerald-400",
                    isSelected && isGap && "bg-sky-300",
                    !isSelected && !isGap && "bg-emerald-500",
                    !isSelected && isGap && "border border-sky-600/70 bg-transparent dark:border-sky-300/80"
                  )}
                  aria-hidden
                />
                {state}
              </button>
            );
          })}
        </div>
      </div>

      {currentNotImplemented && hasCode && (
        <div className="rounded-lg border border-sky-500/25 bg-sky-500/8 px-3 py-2 text-xs text-foreground/90 dark:bg-sky-500/10">
          <p>
            <span className="font-medium text-sky-900 dark:text-sky-100">
              Simulating {forcedState}
            </span>
            <span className="text-muted-foreground">
              {" "}
              — not in source. {STATE_GUIDANCE[forcedState]}
            </span>
          </p>
        </div>
      )}

      <div
        ref={previewRef}
        className={cn(
          "relative flex min-h-[260px] flex-col overflow-hidden rounded-lg border border-dashed p-4 sm:p-6 transition-all duration-300",
          "bg-[linear-gradient(180deg,oklch(0.97_0_0),oklch(0.94_0_0))] dark:bg-[linear-gradient(180deg,oklch(0.18_0_0),oklch(0.14_0_0))]",
          meta.a11yIssues.length > 0 && "ring-1 ring-destructive/35",
          currentNotImplemented && "border-sky-500/35",
          forcedState === "error" && "border-destructive/40",
          forcedState === "loading" && "border-sky-500/30"
        )}
      >
        {meta.a11yIssues.length > 0 && hasCode && (
          <div className="pointer-events-none z-10 mb-4 flex w-full flex-wrap gap-1.5">
            {meta.a11yIssues.slice(0, 2).map((issue) => (
              <span
                key={issue}
                className="max-w-full rounded-md border border-destructive/40 bg-destructive/15 px-2 py-1 font-mono text-[10px] leading-snug text-destructive break-words dark:text-red-100"
              >
                {issue}
              </span>
            ))}
          </div>
        )}

        {!hasCode ? (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-center text-sm text-muted-foreground">
              Paste code and analyze to simulate states.
            </p>
          </div>
        ) : (
          <div
            key={`${meta.primaryType}-${forcedState}`}
            className="flex w-full flex-1 items-center justify-center transition-all duration-300 ease-out"
            style={{
              animation: "edgelens-preview-in 220ms ease-out",
            }}
          >
            <div className="w-full max-w-sm">
              <ComponentPreview meta={meta} state={forcedState} />
            </div>
          </div>
        )}
      </div>

      <p className="text-center text-[10px] text-muted-foreground">
        Previewing <span className="font-mono text-foreground/80">{forcedState}</span>
      </p>

      {meta.detectedNames.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {meta.detectedNames.slice(0, 6).map((name) => (
            <Badge key={name} variant="secondary" className="font-mono text-[10px]">
              {name}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

function ComponentPreview({
  meta,
  state,
}: {
  meta: PreviewMeta;
  state: ComponentState;
}) {
  switch (meta.primaryType) {
    case "Select":
    case "DropdownMenu":
      return <SelectPreview meta={meta} state={state} />;
    case "Card":
    case "Form":
      return <CardPreview meta={meta} state={state} />;
    case "Dialog":
      return <DialogPreview meta={meta} state={state} />;
    case "Input":
    case "Textarea":
      return <InputPreview meta={meta} state={state} />;
    case "Button":
    default:
      return <ButtonPreview meta={meta} state={state} />;
  }
}

function stateFlags(state: ComponentState) {
  return {
    isDisabled: state === "disabled" || state === "loading",
    isLoading: state === "loading",
    isHover: state === "hover",
    isFocus: state === "focus",
    isActive: state === "active",
    isError: state === "error",
    isEmpty: state === "empty",
  };
}

function ButtonPreview({
  meta,
  state,
}: {
  meta: PreviewMeta;
  state: ComponentState;
}) {
  const { isDisabled, isLoading, isHover, isFocus, isActive, isError, isEmpty } =
    stateFlags(state);

  if (isEmpty) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border/70 bg-card/30 px-6 py-10 text-center transition-all duration-300">
        <Inbox className="h-8 w-8 text-muted-foreground/50" />
        <div>
          <p className="text-sm font-medium text-foreground">No action available</p>
          <p className="mt-1 text-xs text-muted-foreground">Empty state — nothing to render</p>
        </div>
      </div>
    );
  }

  const showIcon = meta.isIconOnly || /save/i.test(meta.label);
  const label = isLoading
    ? "Saving…"
    : isError
      ? "Try again"
      : meta.isIconOnly
        ? null
        : meta.label;

  return (
    <div className="flex flex-col items-center gap-5 transition-all duration-300">
      <div
        className={cn(
          "relative flex items-center justify-center rounded-2xl px-8 py-6 transition-all duration-300",
          isHover && "bg-white/[0.03]",
          isFocus && "bg-emerald-500/5",
          isError && "bg-destructive/5",
          isDisabled && "opacity-60"
        )}
      >
        {/* Outer focus halo */}
        {isFocus && (
          <span className="pointer-events-none absolute -inset-3 rounded-2xl border-2 border-emerald-400/60 shadow-[0_0_0_6px_oklch(0.7_0.15_160/0.15)] transition-all duration-300" />
        )}

        <Button
          type="button"
          variant={isError ? "destructive" : meta.buttonVariant}
          size={
            meta.isIconOnly && !isLoading && !isError
              ? "icon"
              : meta.buttonSize === "icon"
                ? "lg"
                : meta.buttonSize === "default"
                  ? "lg"
                  : meta.buttonSize
          }
          disabled={isDisabled}
          aria-busy={isLoading || undefined}
          className={cn(
            "relative z-10 gap-2 transition-all duration-300 ease-out",
            isHover &&
              !isDisabled &&
              "scale-110 -translate-y-1 bg-primary/85 shadow-[0_12px_28px_-6px_rgba(0,0,0,0.55)]",
            isFocus &&
              "ring-4 ring-emerald-400/50 ring-offset-2 ring-offset-background scale-105",
            isActive &&
              "translate-y-1 scale-90 shadow-none brightness-90",
            isDisabled && !isLoading && "grayscale-[0.4] opacity-40 cursor-not-allowed",
            isLoading && "min-w-[8.5rem] cursor-wait opacity-80",
            isError &&
              "scale-105 shadow-[0_0_0_4px_oklch(0.55_0.2_25/0.25)] bg-destructive text-white hover:bg-destructive"
          )}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : showIcon ? (
            <Save className="h-4 w-4" />
          ) : null}
          {label}
        </Button>
      </div>

      <div className="space-y-1.5 text-center transition-all duration-300">
        <p className="font-mono text-[11px] text-muted-foreground">
          {isHover && "↑ lifted · shadow · scale 110%"}
          {isFocus && "◎ strong focus ring"}
          {isActive && "↓ pressed · scale 90%"}
          {isDisabled && !isLoading && "⊘ muted · non-interactive"}
          {isLoading && "⟳ spinner · waiting"}
          {isError && "✕ destructive variant"}
          {state === "default" &&
            (meta.isIconOnly
              ? "icon button · default"
              : `${meta.buttonVariant} · ${meta.buttonSize}`)}
        </p>
        {isError && (
          <p
            className="flex items-center justify-center gap-1.5 text-xs font-medium text-destructive"
            role="alert"
          >
            <AlertCircle className="h-3.5 w-3.5" />
            Action failed — retry or show an error toast
          </p>
        )}
      </div>
    </div>
  );
}

function SelectPreview({
  meta,
  state,
}: {
  meta: PreviewMeta;
  state: ComponentState;
}) {
  const { isDisabled, isLoading, isHover, isFocus, isActive, isError, isEmpty } =
    stateFlags(state);

  if (isEmpty) {
    return (
      <div className="flex w-full flex-col items-center gap-3 rounded-xl border border-dashed border-border/80 bg-card/40 px-4 py-10 text-center transition-all duration-300">
        <Inbox className="h-7 w-7 text-muted-foreground/50" />
        <div>
          <p className="text-sm font-medium">No options available</p>
          <p className="mt-1 text-xs text-muted-foreground">Empty select — guard before mapping items</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[280px] space-y-2 transition-all duration-300">
      <Label className={cn("transition-colors duration-300", isError && "text-destructive")}>
        Theme
      </Label>
      <button
        type="button"
        disabled={isDisabled}
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-lg border border-input bg-background/80 px-3 text-sm transition-all duration-300 ease-out",
          isHover &&
            !isDisabled &&
            "-translate-y-0.5 border-foreground/25 bg-muted/70 shadow-lg shadow-black/20",
          isFocus && "border-emerald-400 ring-4 ring-emerald-400/40",
          isActive && "translate-y-0.5 bg-muted scale-[0.98]",
          isError && "border-destructive ring-4 ring-destructive/30",
          isDisabled && "cursor-not-allowed opacity-40 grayscale-[0.3]",
          isLoading && "cursor-wait opacity-80"
        )}
      >
        <span
          className={cn(
            "truncate transition-colors duration-300",
            !isLoading && "text-muted-foreground",
            isLoading && "text-sky-300"
          )}
        >
          {isLoading ? "Loading options…" : meta.placeholder}
        </span>
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin text-sky-300" />
        ) : (
          <ChevronDown
            className={cn(
              "h-4 w-4 opacity-50 transition-transform duration-300",
              (isFocus || isActive) && "rotate-180 opacity-80"
            )}
          />
        )}
      </button>

      {(isFocus || isActive) && !isDisabled && !isLoading && (
        <div className="overflow-hidden rounded-lg border border-border bg-popover shadow-[0_12px_32px_-8px_rgba(0,0,0,0.55)] transition-all duration-300">
          {["System", "Light", "Dark"].map((opt, i) => (
            <div
              key={opt}
              className={cn(
                "flex items-center justify-between px-3 py-2.5 text-sm transition-colors duration-200",
                i === 0 && "bg-accent text-accent-foreground",
                isHover && i === 1 && "bg-muted/70",
                isActive && i === 0 && "bg-primary/20"
              )}
            >
              {opt}
              {i === 0 && <Check className="h-3.5 w-3.5" />}
            </div>
          ))}
        </div>
      )}

      {isError && (
        <p className="flex items-center gap-1.5 text-xs font-medium text-destructive">
          <AlertCircle className="h-3.5 w-3.5" />
          Please select a theme.
        </p>
      )}
    </div>
  );
}

function CardPreview({
  meta,
  state,
}: {
  meta: PreviewMeta;
  state: ComponentState;
}) {
  const { isDisabled, isLoading, isHover, isFocus, isActive, isError, isEmpty } =
    stateFlags(state);

  return (
    <Card
      className={cn(
        "w-full max-w-sm overflow-hidden transition-all duration-300 ease-out",
        isHover &&
          "-translate-y-1.5 shadow-[0_16px_40px_-12px_rgba(0,0,0,0.65)] ring-1 ring-foreground/15",
        isFocus && "ring-4 ring-emerald-400/45 ring-offset-2 ring-offset-background",
        isActive && "translate-y-0.5 scale-[0.98] shadow-none",
        isError && "ring-2 ring-destructive/60 border-destructive/40",
        isDisabled && "pointer-events-none opacity-40 grayscale-[0.35]",
        isEmpty && "ring-1 ring-dashed ring-border",
        isLoading && "ring-1 ring-sky-500/30"
      )}
    >
      <CardHeader
        className={cn(
          "border-b transition-colors duration-300",
          isError && "border-destructive/30 bg-destructive/5",
          isLoading && "bg-sky-500/5",
          isEmpty && "bg-muted/20"
        )}
      >
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle>{meta.title}</CardTitle>
            <CardDescription>
              {isLoading
                ? "Fetching latest data…"
                : isEmpty
                  ? "Nothing here yet"
                  : isError
                    ? "Something went wrong"
                    : meta.description}
            </CardDescription>
          </div>
          {isLoading && (
            <Badge variant="outline" className="font-mono text-[10px] text-sky-300">
              loading
            </Badge>
          )}
          {isError && (
            <Badge variant="destructive" className="font-mono text-[10px]">
              error
            </Badge>
          )}
          {isEmpty && (
            <Badge variant="outline" className="font-mono text-[10px] text-amber-200">
              empty
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-4 transition-all duration-300">
        {isLoading ? (
          <div className="space-y-3 py-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="flex items-center justify-between gap-3 rounded-lg border border-border/40 px-3 py-2.5"
              >
                <div className="flex flex-1 flex-col gap-2">
                  <div
                    className="h-3 rounded-md bg-muted/80 animate-pulse"
                    style={{ width: `${70 - i * 12}%`, animationDelay: `${i * 120}ms` }}
                  />
                  <div
                    className="h-2 rounded-md bg-muted/50 animate-pulse"
                    style={{ width: `${45 - i * 8}%`, animationDelay: `${i * 120 + 60}ms` }}
                  />
                </div>
                <div
                  className="h-6 w-12 rounded-md bg-muted/60 animate-pulse"
                  style={{ animationDelay: `${i * 100}ms` }}
                />
              </div>
            ))}
            <div className="flex items-center justify-center gap-2 pt-2 text-xs text-sky-300/90">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Loading projects…
            </div>
          </div>
        ) : isEmpty ? (
          <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border/80 bg-muted/10 px-4 py-10 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-muted/40">
              <FolderOpen className="h-6 w-6 text-muted-foreground/70" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">No projects yet</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Create your first project to get started.
              </p>
            </div>
            <Button size="sm" variant="outline" className="mt-1">
              Create project
            </Button>
          </div>
        ) : isError ? (
          <div className="flex flex-col gap-3 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-5">
            <div className="flex items-start gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-destructive/20">
                <AlertCircle className="h-4 w-4 text-destructive" />
              </div>
              <div>
                <p className="text-sm font-medium text-destructive">Failed to load projects</p>
                <p className="mt-1 text-xs text-destructive/80">
                  Network error or server unavailable. Check your connection and retry.
                </p>
              </div>
            </div>
            <Button size="sm" variant="destructive" className="w-fit gap-1.5">
              <RefreshCw className="h-3.5 w-3.5" />
              Retry
            </Button>
          </div>
        ) : (
          <ul className="space-y-2">
            {["EdgeLens", "AuditKit", "StateForge"].map((name, i) => (
              <li
                key={name}
                className={cn(
                  "flex items-center justify-between rounded-lg border border-border/60 px-3 py-2.5 text-sm transition-all duration-300",
                  isHover &&
                    i === 0 &&
                    "translate-x-0.5 border-foreground/20 bg-muted/60 shadow-sm",
                  isHover && i !== 0 && "opacity-70",
                  isActive && i === 0 && "border-primary/40 bg-primary/10",
                  isFocus && i === 0 && "ring-2 ring-emerald-400/40"
                )}
              >
                <span className="font-medium">{name}</span>
                <Button
                  size="xs"
                  variant={isHover && i === 0 ? "default" : "outline"}
                  disabled={isDisabled}
                  className="transition-all duration-300"
                >
                  Open
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>

      <CardFooter
        className={cn(
          "justify-end gap-2 transition-all duration-300",
          isEmpty && "opacity-40",
          isError && "border-destructive/20"
        )}
      >
        <Button
          size="sm"
          variant="outline"
          disabled={isDisabled || isLoading || isEmpty}
          className={cn(
            "transition-all duration-300",
            isFocus && "ring-2 ring-emerald-400/50"
          )}
        >
          Cancel
        </Button>
        <Button
          size="sm"
          disabled={isDisabled || isLoading || isEmpty}
          variant={isError ? "destructive" : "default"}
          className={cn(
            "gap-1.5 transition-all duration-300",
            isHover && !isDisabled && !isLoading && "scale-105 shadow-md",
            isActive && "scale-95"
          )}
        >
          {isLoading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : isError ? (
            <RefreshCw className="h-3.5 w-3.5" />
          ) : null}
          {isLoading
            ? "Refreshing…"
            : isError
              ? "Retry"
              : meta.label === "Action"
                ? "Refresh"
                : meta.label}
        </Button>
      </CardFooter>
    </Card>
  );
}

function DialogPreview({
  meta,
  state,
}: {
  meta: PreviewMeta;
  state: ComponentState;
}) {
  const { isDisabled, isLoading, isHover, isFocus, isError, isEmpty } =
    stateFlags(state);

  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-4">
      <div className="flex justify-center">
        <Button
          variant="outline"
          size="sm"
          disabled={isDisabled}
          className={cn(
            "transition-all duration-200",
            isHover && "bg-muted",
            isFocus && "ring-3 ring-ring/50"
          )}
        >
          <Settings className="h-4 w-4" />
          Open dialog
        </Button>
      </div>

      <div
        className={cn(
          "w-full rounded-xl border border-border bg-popover p-4 shadow-xl transition-all duration-200",
          isFocus && "ring-3 ring-ring/40",
          isError && "border-destructive/50",
          isDisabled && "opacity-50"
        )}
        role="dialog"
        aria-labelledby="preview-dialog-title"
      >
        <div className="space-y-1">
          <p id="preview-dialog-title" className="text-sm font-medium">
            {meta.title}
          </p>
          <p className="text-xs text-muted-foreground">{meta.description}</p>
        </div>
        <Separator className="my-3" />

        {isEmpty ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            Nothing to configure.
          </p>
        ) : isLoading ? (
          <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Saving…
          </div>
        ) : (
          <div className="space-y-2">
            <Label>Preference</Label>
            <div
              className={cn(
                "flex h-9 items-center justify-between rounded-lg border border-input px-3 text-sm text-muted-foreground transition-all",
                isHover && "bg-muted/40",
                isError && "border-destructive"
              )}
            >
              {meta.placeholder}
              <ChevronDown className="h-4 w-4 opacity-50" />
            </div>
            {isError && (
              <p className="text-xs text-destructive">Fix validation errors before saving.</p>
            )}
          </div>
        )}

        <div className="mt-4 flex justify-end gap-2">
          <Button size="sm" variant="outline" disabled={isDisabled || isLoading}>
            Cancel
          </Button>
          <Button size="sm" disabled={isDisabled || isLoading}>
            {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}

function InputPreview({
  meta,
  state,
}: {
  meta: PreviewMeta;
  state: ComponentState;
}) {
  const { isDisabled, isLoading, isHover, isFocus, isError, isEmpty } =
    stateFlags(state);

  return (
    <div className="mx-auto w-full max-w-[280px] space-y-2">
      <Label htmlFor="preview-input" className={cn(isError && "text-destructive")}>
        {meta.label === "Action" ? "Email" : meta.label}
      </Label>
      <div className="relative">
        <input
          id="preview-input"
          disabled={isDisabled || isLoading}
          aria-invalid={isError || undefined}
          placeholder={isEmpty ? "" : meta.placeholder}
          defaultValue={isEmpty ? "" : isError ? "bad@" : "you@company.com"}
          className={cn(
            "flex h-9 w-full rounded-lg border border-input bg-background/80 px-3 text-sm transition-all duration-200 outline-none",
            isHover && !isDisabled && "bg-muted/40",
            isFocus && "border-ring ring-3 ring-ring/40",
            isError && "border-destructive ring-3 ring-destructive/25",
            (isDisabled || isLoading) && "cursor-not-allowed opacity-50"
          )}
        />
        {isLoading && (
          <Loader2 className="absolute top-2.5 right-3 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>
      {isError && (
        <p className="text-xs text-destructive" role="alert">
          Enter a valid email address.
        </p>
      )}
      {isEmpty && (
        <p className="text-xs text-muted-foreground">Field is empty.</p>
      )}
    </div>
  );
}
