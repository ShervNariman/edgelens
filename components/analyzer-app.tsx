"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  AnalysisReport,
  AxeViolation,
  ComponentState,
} from "@/types/analysis";
import { analyzeComponent } from "@/lib/analyze";
import { CODE_EXAMPLES, findExampleByCode, type CodeExample } from "@/examples";
import { Hero } from "@/components/hero";
import { CodeInputPanel } from "@/components/code-input-panel";
import { ResultsPanel } from "@/components/results-panel";
import { PreviewPane } from "@/components/preview-pane";
import { SiteFooter } from "@/components/site-footer";
import { PreviewErrorBoundary } from "@/components/preview-error-boundary";
import { ErrorBoundary } from "@/components/error-boundary";
import { cn } from "@/lib/utils";
import {
  DEMO_STORY,
  HERO_SUPPORT,
  LIMITATION_COPY,
} from "@/lib/product-copy";

/** Launch demo: happy-path form that forgets loading/error/disabled states. */
const RECORDING_EXAMPLE_ID = "login-form";

export interface AnalyzerAppProps {
  /**
   * `recording` strips chrome and auto-loads the launch demo for
   * /record/edgelens screen-capture. Default preserves /analyzer.
   */
  mode?: "default" | "recording";
}

function resolveInitialExample(mode: "default" | "recording"): CodeExample {
  if (mode === "recording") {
    return (
      CODE_EXAMPLES.find((ex) => ex.id === RECORDING_EXAMPLE_ID) ??
      CODE_EXAMPLES[0]
    );
  }
  return CODE_EXAMPLES[0];
}

export function AnalyzerApp({ mode = "default" }: AnalyzerAppProps) {
  const isRecording = mode === "recording";
  const analyzerRef = useRef<HTMLElement>(null);
  const autoAnalyzedRef = useRef(false);
  const initialExample = resolveInitialExample(mode);

  const [code, setCode] = useState(initialExample.code);
  const [selectedExample, setSelectedExample] = useState<CodeExample | null>(
    initialExample
  );
  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [forcedState, setForcedState] = useState<ComponentState>("default");
  const [pendingAxe, setPendingAxe] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scrollToAnalyzer = useCallback(() => {
    analyzerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const handleCodeChange = useCallback((value: string) => {
    setCode(value);
    setSelectedExample(findExampleByCode(value) ?? null);
    setReport(null);
  }, []);

  const handleSelectExample = useCallback((example: CodeExample) => {
    setSelectedExample(example);
    setCode(example.code);
    setReport(null);
    setForcedState("default");
  }, []);

  const handleAnalyze = useCallback(() => {
    setIsAnalyzing(true);
    setError(null);
    setPendingAxe(false);

    window.setTimeout(() => {
      try {
        const next = analyzeComponent(code);
        setReport(next);
        setForcedState("default");
        setPendingAxe(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Analysis failed");
        setReport(null);
      } finally {
        setIsAnalyzing(false);
      }
    }, isRecording ? 180 : 350);
  }, [code, isRecording]);

  const handleAxeResults = useCallback((violations: AxeViolation[]) => {
    setPendingAxe(false);
    setReport((prev) => {
      if (!prev) return prev;
      try {
        return analyzeComponent(prev.sourceCode, { axeViolations: violations });
      } catch (err) {
        console.error("[EdgeLens] axe merge failed", err);
        return {
          ...prev,
          axeViolations: violations,
          previewDomChecked: true,
        };
      }
    });
  }, []);

  // Recording route: auto-analyze the preloaded demo once on mount (client-only).
  useEffect(() => {
    if (!isRecording || autoAnalyzedRef.current) return;
    if (!code.trim()) return;
    autoAnalyzedRef.current = true;

    setIsAnalyzing(true);
    setError(null);
    setPendingAxe(false);

    const timer = window.setTimeout(() => {
      try {
        const next = analyzeComponent(code);
        setReport(next);
        setForcedState("default");
        setPendingAxe(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Analysis failed");
        setReport(null);
      } finally {
        setIsAnalyzing(false);
      }
    }, 120);

    return () => window.clearTimeout(timer);
  }, [isRecording, code]);

  return (
    <ErrorBoundary fallbackTitle="EdgeLens hit a runtime error">
      <div
        className={cn(
          "min-h-screen bg-background text-foreground",
          isRecording &&
            "bg-[radial-gradient(ellipse_at_top,_oklch(0.28_0.04_160_/_0.35),_transparent_55%)]"
        )}
      >
        {isRecording ? (
          <header className="border-b border-border/40 bg-background/70 backdrop-blur-md">
            <div className="mx-auto flex h-9 max-w-[1600px] items-center justify-between px-4 sm:px-6 xl:px-8">
              <div className="flex items-center gap-2 font-mono text-sm">
                <span className="text-emerald-400">›</span>
                <span>edgelens</span>
                <span className="hidden text-muted-foreground/70 sm:inline">
                  · record
                </span>
              </div>
              <p className="font-mono text-[10px] text-muted-foreground/80">
                launch capture
              </p>
            </div>
          </header>
        ) : (
          <header className="sticky top-0 z-40 border-b border-border/50 bg-background/80 backdrop-blur-md">
            <div className="mx-auto flex h-11 max-w-7xl items-center justify-between px-4 sm:px-6">
              <div className="flex items-center gap-2 font-mono text-sm">
                <span className="text-emerald-400">›</span>
                <span>edgelens</span>
              </div>
              <button
                type="button"
                onClick={scrollToAnalyzer}
                className="text-xs text-muted-foreground transition-colors hover:text-foreground"
              >
                Analyzer
              </button>
            </div>
          </header>
        )}

        {!isRecording && <Hero onTryDemo={scrollToAnalyzer} compact />}

        <main
          id="analyzer"
          ref={analyzerRef}
          className={cn(
            "scroll-mt-14",
            isRecording
              ? "mx-auto max-w-[1600px] px-4 py-4 sm:px-6 sm:py-5 xl:px-8"
              : "mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8"
          )}
        >
          {isRecording ? (
            <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
              <div className="space-y-1">
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-emerald-400/90">
                  happy path → force states → gaps → fixes
                </p>
                <h1 className="font-heading text-xl font-semibold tracking-tight sm:text-2xl">
                  EdgeLens
                </h1>
                <p className="max-w-2xl text-sm text-muted-foreground">
                  {DEMO_STORY}
                </p>
              </div>
              {report && (
                <div className="rounded-lg border border-border/60 bg-card/40 px-3 py-2 font-mono text-[11px] text-muted-foreground">
                  <span className="text-foreground">{report.componentName}</span>
                  <span className="mx-1.5 text-border">·</span>
                  <span>{report.primaryType}</span>
                  <span className="mx-1.5 text-border">·</span>
                  <span
                    className={
                      report.summary.score >= 50
                        ? "text-amber-400"
                        : "text-destructive"
                    }
                  >
                    score {report.summary.score}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
              <div className="space-y-1">
                <h2 className="font-heading text-xl font-semibold tracking-tight sm:text-2xl">
                  Analyzer
                </h2>
                <p className="max-w-2xl text-sm text-muted-foreground">
                  {HERO_SUPPORT}
                </p>
              </div>
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="mb-4 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
            >
              {error}
            </div>
          )}

          <div
            className={cn(
              "grid items-start",
              isRecording
                ? "gap-4 lg:grid-cols-12 lg:gap-5"
                : "gap-5 lg:grid-cols-12 lg:gap-6"
            )}
          >
            <section
              className={cn(
                "rounded-xl border border-border/70 bg-card/20 p-4 sm:p-5 lg:col-span-5",
                !isRecording &&
                  "lg:sticky lg:top-14 lg:max-h-[calc(100vh-4.5rem)] lg:overflow-y-auto",
                isRecording && "lg:max-h-[calc(100vh-5.5rem)] lg:overflow-y-auto"
              )}
            >
              <CodeInputPanel
                code={code}
                onChange={handleCodeChange}
                onAnalyze={handleAnalyze}
                isAnalyzing={isAnalyzing}
                selectedExample={selectedExample}
                onSelectExample={handleSelectExample}
                compact={isRecording}
              />
            </section>

            <section
              className={cn(
                "flex flex-col lg:col-span-7",
                isRecording ? "gap-4" : "gap-5"
              )}
            >
              <PreviewErrorBoundary>
                <PreviewPane
                  code={code}
                  componentName={report?.componentName ?? null}
                  primaryType={report?.primaryType ?? "Unknown"}
                  detectedComponents={report?.detectedComponents ?? []}
                  issues={report?.issues ?? []}
                  forcedState={forcedState}
                  onForceState={setForcedState}
                  runAxe={pendingAxe && Boolean(report)}
                  onAxeResults={handleAxeResults}
                />
              </PreviewErrorBoundary>

              <div className="rounded-xl border border-border/70 bg-card/20 p-4 sm:p-5">
                <div className="mb-4 flex items-center justify-between gap-2">
                  <h3 className="text-sm font-medium tracking-wide">
                    Analysis report
                  </h3>
                  {report && (
                    <span className="font-mono text-[10px] text-muted-foreground">
                      {report.componentName ?? "component"} ·{" "}
                      {report.primaryType}
                    </span>
                  )}
                </div>
                <ResultsPanel report={report} isAnalyzing={isAnalyzing} />
              </div>
            </section>
          </div>
        </main>

        {!isRecording && (
          <>
            <aside
              aria-label="Product limitations"
              className="mx-auto max-w-7xl px-4 pb-6 sm:px-6"
            >
              <p className="max-w-3xl text-[11px] leading-relaxed text-muted-foreground/90">
                {LIMITATION_COPY}
              </p>
            </aside>
            <SiteFooter />
          </>
        )}
      </div>
    </ErrorBoundary>
  );
}
