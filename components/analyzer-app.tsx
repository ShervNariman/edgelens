"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  AnalysisReport,
  AxeViolation,
  ComponentState,
} from "@/types/analysis";
import { analyzeComponent } from "@/lib/analyze";
import { captureEvent } from "@/lib/analytics";
import { CODE_EXAMPLES, findExampleByCode, type CodeExample } from "@/examples";
import { Hero } from "@/components/hero";
import {
  CodeInputPanel,
  type LocalFileMeta,
} from "@/components/code-input-panel";
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
  PRIVACY_LOCAL_ONLY,
} from "@/lib/product-copy";
import type { LocalFileError, SourceOrigin } from "@/lib/local-file";
import { sourceKindForAnalytics } from "@/lib/local-file";

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
  const [sourceOrigin, setSourceOrigin] = useState<SourceOrigin>("example");
  const [localFile, setLocalFile] = useState<LocalFileMeta | null>(null);
  const [fileError, setFileError] = useState<LocalFileError | null>(null);
  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [forcedState, setForcedState] = useState<ComponentState>("default");
  const [pendingAxe, setPendingAxe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const scrollToAnalyzer = useCallback(() => {
    analyzerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const handleCodeChange = useCallback((value: string) => {
    setCode(value);
    const matched = findExampleByCode(value);
    setSelectedExample(matched ?? null);
    setSourceOrigin(matched ? "example" : "pasted");
    setLocalFile(null);
    setReport(null);
    setError(null);
    setStatusMessage(null);
  }, []);

  const handleSelectExample = useCallback((example: CodeExample) => {
    setSelectedExample(example);
    setCode(example.code);
    setSourceOrigin("example");
    setLocalFile(null);
    setReport(null);
    setForcedState("default");
    setError(null);
    setFileError(null);
    setStatusMessage(`Loaded example “${example.label}”.`);
  }, []);

  const handleLocalFileLoaded = useCallback(
    (payload: {
      code: string;
      fileName: string;
      extension: string;
      byteLength: number;
      sizeBand: string;
    }) => {
      setCode(payload.code);
      setSelectedExample(null);
      setSourceOrigin("local-file");
      setLocalFile({
        fileName: payload.fileName,
        extension: payload.extension,
        byteLength: payload.byteLength,
        sizeBand: payload.sizeBand,
      });
      setReport(null);
      setForcedState("default");
      setError(null);
      setFileError(null);
      setStatusMessage("Local file loaded in this browser. Click Analyze.");
    },
    []
  );

  const handleForceState = useCallback((state: ComponentState) => {
    setForcedState(state);
    if (state !== "default") {
      captureEvent("state_forced", { state });
    }
  }, []);

  const handleAnalyze = useCallback(() => {
    if (!code.trim()) {
      setError("Source is empty. Load a local file, paste code, or pick an example.");
      setFileError({
        code: "empty",
        message:
          "Source is empty. Open a local file, paste a component, or load an example.",
      });
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    setFileError(null);
    setPendingAxe(false);
    setStatusMessage("Running deterministic pre-flight checks…");

    window.setTimeout(() => {
      try {
        const next = analyzeComponent(code);
        setReport(next);
        setForcedState("default");
        setPendingAxe(true);
        const gaps = next.stateCoverage.filter((s) => s.required && !s.present)
          .length;
        setStatusMessage(
          next.parseErrors.length > 0
            ? `Analysis complete with parse recovery notes · ${next.summary.totalIssues} findings.`
            : gaps > 0
              ? `Analysis complete · ${gaps} state gap${gaps === 1 ? "" : "s"} to review.`
              : `Analysis complete · score ${next.summary.score}.`
        );
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Unexpected analysis failure";
        setError(message);
        setReport(null);
        setStatusMessage(null);
        captureEvent("analysis_failed", {
          source_kind: sourceKindForAnalytics(sourceOrigin),
          reason: "unexpected_error",
        });
      } finally {
        setIsAnalyzing(false);
      }
    }, isRecording ? 180 : 350);
  }, [code, isRecording, sourceOrigin]);

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
        setStatusMessage("Recording demo analyzed.");
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
                <p className="max-w-2xl text-[11px] text-muted-foreground/90">
                  {PRIVACY_LOCAL_ONLY}
                </p>
              </div>
            </div>
          )}

          <div className="sr-only" aria-live="polite" aria-atomic="true">
            {statusMessage}
          </div>

          {error && (
            <div
              role="alert"
              className="mb-4 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
            >
              <p className="font-medium">Unexpected error</p>
              <p className="mt-1">{error}</p>
              <p className="mt-2 text-xs text-destructive/90">
                Try a smaller file, fix syntax, or load a built-in example.
              </p>
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
                sourceOrigin={sourceOrigin}
                localFile={localFile}
                onLocalFileLoaded={handleLocalFileLoaded}
                fileError={fileError}
                onFileError={setFileError}
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
                  onForceState={handleForceState}
                  runAxe={pendingAxe && Boolean(report)}
                  onAxeResults={handleAxeResults}
                />
              </PreviewErrorBoundary>

              <div className="rounded-xl border border-border/70 bg-card/20 p-4 sm:p-5">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-medium tracking-wide">
                    Analysis report
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 font-mono text-[10px] text-muted-foreground">
                    <span className="rounded border border-border/60 bg-muted/30 px-1.5 py-0.5">
                      {sourceOrigin === "local-file"
                        ? "local file"
                        : sourceOrigin === "example"
                          ? "example"
                          : "pasted"}
                    </span>
                    {report && (
                      <span>
                        {report.componentName ?? "component"} ·{" "}
                        {report.primaryType}
                      </span>
                    )}
                  </div>
                </div>
                <ResultsPanel
                  report={report}
                  isAnalyzing={isAnalyzing}
                  sourceOrigin={sourceOrigin}
                  hasSource={Boolean(code.trim())}
                />
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
