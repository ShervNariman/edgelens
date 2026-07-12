"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import type { AnalysisReport } from "@/types/analysis";
import { buildShervOSReviewSummary } from "@/lib/sherv-os-summary";
import { Button } from "@/components/ui/button";

interface AIExplanationPanelProps {
  report: AnalysisReport | null;
}

interface AIExplanationResponse {
  explanation?: unknown;
  error?: unknown;
  requestId?: unknown;
  routing?: {
    provider?: unknown;
    model?: unknown;
    capability?: unknown;
    usedFallback?: unknown;
  };
}

type RequestState = "idle" | "loading" | "success" | "error";

function readErrorMessage(payload: AIExplanationResponse): string {
  return typeof payload.error === "string" && payload.error.trim()
    ? payload.error
    : "Optional AI explanation is temporarily unavailable.";
}

export function AIExplanationPanel({ report }: AIExplanationPanelProps) {
  const [state, setState] = useState<RequestState>("idle");
  const [explanation, setExplanation] = useState("");
  const [error, setError] = useState("");
  const [metadata, setMetadata] = useState<{
    provider?: string;
    model?: string;
    requestId?: string;
  }>({});

  useEffect(() => {
    setState("idle");
    setExplanation("");
    setError("");
    setMetadata({});
  }, [report?.id]);

  if (!report) return null;
  const activeReport = report;

  async function handleExplain() {
    setState("loading");
    setError("");

    try {
      const response = await fetch("/api/sherv-os/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          report: buildShervOSReviewSummary(activeReport),
        }),
      });

      const payload = (await response.json()) as AIExplanationResponse;
      if (!response.ok) {
        throw new Error(readErrorMessage(payload));
      }

      if (typeof payload.explanation !== "string" || !payload.explanation.trim()) {
        throw new Error("Sherv OS returned an empty explanation.");
      }

      setExplanation(payload.explanation.trim());
      setMetadata({
        ...(typeof payload.routing?.provider === "string"
          ? { provider: payload.routing.provider }
          : {}),
        ...(typeof payload.routing?.model === "string"
          ? { model: payload.routing.model }
          : {}),
        ...(typeof payload.requestId === "string"
          ? { requestId: payload.requestId }
          : {}),
      });
      setState("success");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Optional AI explanation is temporarily unavailable.",
      );
      setState("error");
    }
  }

  return (
    <section
      aria-labelledby="ai-explanation-title"
      className="rounded-xl border border-violet-500/25 bg-violet-500/5 p-4 sm:p-5"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-violet-500" aria-hidden="true" />
            <h3 id="ai-explanation-title" className="text-sm font-medium">
              Optional AI explanation
            </h3>
          </div>
          <p className="max-w-2xl text-xs leading-relaxed text-muted-foreground">
            EdgeLens keeps the deterministic report as the source of truth. This
            sends only the score, state gaps, and normalized finding summaries to
            Sherv OS—never source code, filenames, raw DOM, or accessibility trees.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleExplain}
          disabled={state === "loading"}
          className="shrink-0 border-violet-500/30 bg-background/60"
        >
          {state === "loading" ? "Explaining…" : "Explain findings"}
        </Button>
      </div>

      <div className="mt-4" aria-live="polite">
        {state === "idle" && (
          <p className="text-xs text-muted-foreground">
            Nothing is sent until you choose Explain findings.
          </p>
        )}

        {state === "loading" && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
            Asking Sherv OS to explain the existing report…
          </div>
        )}

        {state === "error" && (
          <div
            role="alert"
            className="rounded-lg border border-destructive/35 bg-destructive/8 px-3 py-2.5 text-xs text-destructive"
          >
            {error}
          </div>
        )}

        {state === "success" && (
          <div className="space-y-3">
            <div className="whitespace-pre-wrap rounded-lg border border-border/60 bg-background/55 px-4 py-3 text-sm leading-relaxed text-foreground">
              {explanation}
            </div>
            <div className="flex flex-wrap gap-x-3 gap-y-1 font-mono text-[10px] text-muted-foreground">
              <span>AI explanation · not a new deterministic check</span>
              {metadata.provider && <span>provider {metadata.provider}</span>}
              {metadata.model && <span>model {metadata.model}</span>}
              {metadata.requestId && <span>request {metadata.requestId}</span>}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
