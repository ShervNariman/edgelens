"use client";

import { useCallback, useRef, useState } from "react";
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

export function AnalyzerApp() {
  const analyzerRef = useRef<HTMLElement>(null);
  const [code, setCode] = useState(CODE_EXAMPLES[0].code);
  const [selectedExample, setSelectedExample] = useState<CodeExample | null>(
    CODE_EXAMPLES[0]
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
    }, 350);
  }, [code]);

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

  return (
    <ErrorBoundary fallbackTitle="EdgeLens hit a runtime error">
      <div className="min-h-screen bg-background text-foreground">
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

        <Hero onTryDemo={scrollToAnalyzer} compact />

        <main
          id="analyzer"
          ref={analyzerRef}
          className="mx-auto max-w-7xl scroll-mt-14 px-4 py-6 sm:px-6 sm:py-8"
        >
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div className="space-y-1">
              <h2 className="font-heading text-xl font-semibold tracking-tight sm:text-2xl">
                Analyzer
              </h2>
              <p className="max-w-xl text-sm text-muted-foreground">
                Paste Cursor/shadcn output → states, a11y, and copyable fixes.
                Client-side only.
              </p>
            </div>
          </div>

          {error && (
            <div
              role="alert"
              className="mb-4 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive"
            >
              {error}
            </div>
          )}

          <div className="grid items-start gap-5 lg:grid-cols-12 lg:gap-6">
            <section className="rounded-xl border border-border/70 bg-card/20 p-4 sm:p-5 lg:col-span-5 lg:sticky lg:top-14 lg:max-h-[calc(100vh-4.5rem)] lg:overflow-y-auto">
              <CodeInputPanel
                code={code}
                onChange={handleCodeChange}
                onAnalyze={handleAnalyze}
                isAnalyzing={isAnalyzing}
                selectedExample={selectedExample}
                onSelectExample={handleSelectExample}
              />
            </section>

            <section className="flex flex-col gap-5 lg:col-span-7">
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

        <SiteFooter />
      </div>
    </ErrorBoundary>
  );
}
