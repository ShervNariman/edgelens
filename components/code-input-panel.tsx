"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CODE_EXAMPLES, type CodeExample } from "@/examples";
import { captureEvent } from "@/lib/analytics";
import { ANALYZER_COPY } from "@/lib/product-copy";
import {
  formatSourceSize,
  getSourceSizeStatus,
  MAX_SOURCE_CHARS,
  WARN_SOURCE_CHARS,
} from "@/lib/source-limits";
import { cn } from "@/lib/utils";
import { Loader2, Sparkles } from "lucide-react";

interface CodeInputPanelProps {
  code: string;
  onChange: (value: string) => void;
  onAnalyze: () => void;
  isAnalyzing: boolean;
  selectedExample: CodeExample | null;
  onSelectExample: (example: CodeExample) => void;
  /** Tighter layout for /record/edgelens capture frames. */
  compact?: boolean;
  sourceHeadingId?: string;
}

export function CodeInputPanel({
  code,
  onChange,
  onAnalyze,
  isAnalyzing,
  selectedExample,
  onSelectExample,
  compact = false,
  sourceHeadingId = "analyzer-source-heading",
}: CodeInputPanelProps) {
  const sizeStatus = getSourceSizeStatus(code);
  const overLimit = sizeStatus === "over";
  const warnSize = sizeStatus === "warn";

  return (
    <div className={cn("flex h-full flex-col", compact ? "gap-2.5" : "gap-3")}>
      <div>
        <h3
          id={sourceHeadingId}
          className="text-sm font-medium tracking-wide text-foreground"
        >
          {ANALYZER_COPY.sourceTitle}
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">
          {compact
            ? ANALYZER_COPY.sourceHelpCompact
            : ANALYZER_COPY.sourceHelp}
        </p>
      </div>

      <div
        className="grid gap-1.5"
        role="group"
        aria-label="Demo examples"
      >
        {CODE_EXAMPLES.map((example) => {
          const active = selectedExample?.id === example.id;
          return (
            <button
              key={example.id}
              type="button"
              aria-pressed={active}
              onClick={() => {
                captureEvent("example_selected", { example_id: example.id });
                onSelectExample(example);
              }}
              className={cn(
                "rounded-lg border text-left transition-all duration-200",
                "hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                compact ? "px-2.5 py-1.5" : "px-3 py-2",
                active
                  ? "border-foreground/25 bg-foreground/[0.06] shadow-sm"
                  : "border-border/80 bg-background/40"
              )}
            >
              <span className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                <Sparkles
                  className={cn(
                    "h-3 w-3 shrink-0",
                    active ? "text-emerald-500" : "text-muted-foreground"
                  )}
                  aria-hidden
                />
                {example.label}
              </span>
              {!compact && (
                <span className="mt-0.5 block pl-[18px] text-[10px] leading-snug text-muted-foreground">
                  {example.description}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {selectedExample && (
        <div
          id="example-reveal-hint"
          className={cn(
            "rounded-lg border border-emerald-500/25 bg-emerald-500/8 text-xs leading-relaxed",
            compact ? "px-2.5 py-1.5" : "px-3 py-2"
          )}
        >
          <p className="font-medium text-emerald-900">
            {ANALYZER_COPY.exampleRevealLabel}
          </p>
          <p className="mt-0.5 text-muted-foreground">{selectedExample.reveals}</p>
          {!compact && (
            <p className="mt-1.5 font-mono text-[10px] text-emerald-800/80">
              {ANALYZER_COPY.exampleAnalyzeHint}
            </p>
          )}
        </div>
      )}

      <div className="flex min-h-0 flex-1 flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <Label htmlFor="component-source" className="sr-only">
            Component source code
          </Label>
          <p
            className={cn(
              "font-mono text-[10px]",
              overLimit
                ? "text-destructive"
                : warnSize
                  ? "text-amber-700"
                  : "text-muted-foreground"
            )}
            aria-live="polite"
          >
            {formatSourceSize(code.length)}
            {overLimit
              ? ` · max ${formatSourceSize(MAX_SOURCE_CHARS)}`
              : warnSize
                ? ` · soft limit ${formatSourceSize(WARN_SOURCE_CHARS)}`
                : ""}
          </p>
        </div>
        <Textarea
          id="component-source"
          value={code}
          onChange={(e) => onChange(e.target.value)}
          spellCheck={false}
          aria-invalid={overLimit || undefined}
          aria-describedby={
            overLimit || warnSize
              ? "source-size-message"
              : selectedExample
                ? "example-reveal-hint"
                : undefined
          }
          placeholder={`// Paste a React / shadcn component…\nexport function Example() {\n  return <Button>Click</Button>\n}`}
          className={cn(
            "ph-no-capture flex-1 resize-y font-mono text-xs leading-relaxed",
            compact
              ? "min-h-[160px] lg:min-h-[min(28vh,260px)]"
              : "min-h-[220px] lg:min-h-[min(42vh,380px)]",
            overLimit && "border-destructive/50"
          )}
        />
        {(overLimit || warnSize) && (
          <p
            id="source-size-message"
            className={cn(
              "text-xs",
              overLimit ? "text-destructive" : "text-amber-800"
            )}
            role={overLimit ? "alert" : undefined}
          >
            {overLimit ? ANALYZER_COPY.sourceOverLimit : ANALYZER_COPY.sourceWarn}
          </p>
        )}
      </div>

      <Button
        size={compact ? "default" : "lg"}
        className="w-full gap-2"
        onClick={() => {
          captureEvent("analysis_started", {
            source_kind: selectedExample ? "example" : "custom",
            example_id: selectedExample?.id ?? null,
          });
          onAnalyze();
        }}
        disabled={isAnalyzing || !code.trim() || overLimit}
      >
        {isAnalyzing ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" />
            Analyzing…
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" aria-hidden />
            Analyze
          </>
        )}
      </Button>
    </div>
  );
}
