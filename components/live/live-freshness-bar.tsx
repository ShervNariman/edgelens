"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function formatClock(ms: number | null): string {
  if (ms === null) return "—";
  return new Intl.DateTimeFormat("en-US", {
    timeStyle: "medium",
    timeZone: "UTC",
  }).format(new Date(ms));
}

export function LiveFreshnessBar({
  lastFetchedAt,
  nextRefreshAt,
  paused,
  clientStale,
  serverFreshness,
  degraded,
  providerErrorCount,
  error,
  onPause,
  onResume,
  onRefresh,
  refreshing,
}: {
  lastFetchedAt: number | null;
  nextRefreshAt: number | null;
  paused: boolean;
  clientStale: boolean;
  serverFreshness: "fresh" | "stale" | "error" | "empty";
  degraded: boolean;
  providerErrorCount: number;
  error: string | null;
  onPause: () => void;
  onResume: () => void;
  onRefresh: () => void;
  refreshing: boolean;
}) {
  const stale = clientStale || serverFreshness === "stale";
  const errored = Boolean(error) || serverFreshness === "error";

  let tone = "border-[var(--color-line)] bg-[var(--color-paper)]/90";
  let label = "Live";
  if (paused) {
    label = "Paused";
  } else if (errored) {
    tone = "border-[var(--color-danger)]/30 bg-[var(--color-danger-bg)]";
    label = "Provider error";
  } else if (stale) {
    tone = "border-[#c48a2a]/35 bg-[#f5e6c8]";
    label = "Stale";
  } else if (degraded || providerErrorCount > 0) {
    tone = "border-[#c48a2a]/25 bg-[#f8f0df]";
    label = "Degraded";
  }

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-xl border px-4 py-3 sm:flex-row sm:items-center sm:justify-between",
        tone,
      )}
      role="status"
      aria-live="polite"
    >
      <div className="min-w-0 space-y-1">
        <p className="text-sm font-semibold tracking-tight">
          {label}
          <span className="mx-2 text-[var(--color-line)]">·</span>
          <span className="font-normal text-[var(--color-ink-soft)]">
            Last updated {formatClock(lastFetchedAt)} UTC
          </span>
        </p>
        <p className="text-xs text-[var(--color-muted)]">
          {paused
            ? "Automatic refresh paused. Resume to keep the board current."
            : stale
              ? "Data may be outdated — dashboard will not imply freshness."
              : errored
                ? (error ?? "One or more providers failed. Manual refresh available.")
                : `Next refresh ${formatClock(nextRefreshAt)} UTC · visibility-aware polling`}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={onRefresh}
          disabled={refreshing}
          aria-label="Refresh live snapshot now"
        >
          {refreshing ? "Refreshing…" : "Refresh now"}
        </Button>
        {paused ? (
          <Button
            type="button"
            size="sm"
            variant="primary"
            onClick={onResume}
            aria-label="Resume automatic live refresh"
          >
            Resume
          </Button>
        ) : (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={onPause}
            aria-label="Pause automatic live refresh"
          >
            Pause
          </Button>
        )}
      </div>
    </div>
  );
}
