"use client";

import { useState, useTransition } from "react";
import { LiveActivityRail } from "@/components/live/live-activity-rail";
import { LiveCandidateList } from "@/components/live/live-candidate-list";
import { LiveDashboardSkeleton } from "@/components/live/live-dashboard-skeleton";
import { LiveFreshnessBar } from "@/components/live/live-freshness-bar";
import { LiveKpiStrip } from "@/components/live/live-kpi-strip";
import { ProviderHealthRail } from "@/components/live/provider-health-rail";
import { Button } from "@/components/ui/button";
import { useLiveSnapshot } from "@/hooks/use-live-snapshot";

export function LiveDashboard({
  workspaceName,
  ownerEmail,
}: {
  workspaceName: string;
  ownerEmail: string;
}) {
  const live = useLiveSnapshot();
  const [demoPending, startDemo] = useTransition();
  const [demoMessage, setDemoMessage] = useState<string | null>(null);

  const simulateEditorEvent = () => {
    startDemo(async () => {
      setDemoMessage(null);
      const releaseId =
        live.snapshot?.candidates.find((c) => c.decision === "BLOCKED")?.id ??
        live.snapshot?.candidates[0]?.id;

      const response = await fetch("/api/internal/events", {
        method: "POST",
        credentials: "same-origin",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          kind: "editor",
          provider: "editor",
          title: "Cursor agent evidence submitted",
          summary:
            "Signed editor run attached CI fix notes and requested human re-check.",
          releaseId,
          actor: ownerEmail,
          evidence: releaseId
            ? {
                source: "manual",
                title: "Editor agent evidence",
                summary:
                  "Agent attached local verification notes for the failing e2e path.",
                status: "warn",
              }
            : undefined,
        }),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as {
          message?: string;
        } | null;
        setDemoMessage(body?.message ?? "Failed to ingest demo event");
        return;
      }

      setDemoMessage("Editor evidence event ingested — waiting for next poll.");
      await live.refresh();
    });
  };

  if (live.status === "loading" && !live.snapshot) {
    return <LiveDashboardSkeleton />;
  }

  if (live.status === "error" && !live.snapshot) {
    return (
      <div
        role="alert"
        className="rounded-xl border border-[var(--color-danger)]/30 bg-[var(--color-danger-bg)] px-5 py-8"
      >
        <h1 className="font-[family-name:var(--font-display)] text-2xl font-semibold">
          Live snapshot unavailable
        </h1>
        <p className="mt-2 text-sm text-[var(--color-ink-soft)]">
          {live.error ?? "The internal snapshot endpoint failed."}
        </p>
        <div className="mt-4">
          <Button type="button" onClick={() => void live.refresh()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const snapshot = live.snapshot;
  if (!snapshot) {
    return <LiveDashboardSkeleton />;
  }

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <p className="text-xs font-semibold tracking-[0.18em] text-[var(--color-muted)] uppercase">
          Founder command center · {workspaceName}
        </p>
        <h1 className="font-[family-name:var(--font-display)] text-4xl tracking-tight">
          Live release board
        </h1>
        <p className="max-w-2xl text-[var(--color-muted)]">
          Automatic refresh with provider freshness. New webhook and editor evidence
          appear without a reload — and the board never pretends stale data is fresh.
        </p>
      </header>

      <LiveFreshnessBar
        lastFetchedAt={live.lastFetchedAt}
        nextRefreshAt={live.nextRefreshAt}
        paused={live.paused}
        clientStale={live.clientStale}
        serverFreshness={snapshot.freshness}
        degraded={snapshot.degraded}
        providerErrorCount={snapshot.providerErrorCount}
        error={live.error}
        onPause={live.pause}
        onResume={live.resume}
        onRefresh={() => void live.refresh()}
        refreshing={live.status === "loading"}
      />

      {live.clientStale || snapshot.freshness === "stale" ? (
        <div
          role="status"
          className="rounded-lg border border-[#c48a2a]/30 bg-[#f5e6c8] px-4 py-3 text-sm text-[#8a5a00]"
        >
          Showing last known snapshot. Timestamps above reflect when data was last
          confirmed — treat decisions cautiously until refresh succeeds.
        </div>
      ) : null}

      {snapshot.providerErrorCount > 0 ? (
        <div
          role="alert"
          className="rounded-lg border border-[var(--color-danger)]/25 bg-[var(--color-danger-bg)] px-4 py-3 text-sm"
        >
          {snapshot.providerErrorCount} provider
          {snapshot.providerErrorCount === 1 ? "" : "s"} in error. Open provider health
          below before approving a release.
        </div>
      ) : null}

      <LiveKpiStrip kpis={snapshot.kpis} />

      <ProviderHealthRail providers={snapshot.providers} />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.9fr)]">
        <section aria-labelledby="candidates-title" className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2
                id="candidates-title"
                className="font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight"
              >
                Candidates
              </h2>
              <p className="mt-1 text-sm text-[var(--color-muted)]">
                Stage chips are derived from evidence — not decorative bars.
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={simulateEditorEvent}
              disabled={demoPending}
            >
              {demoPending ? "Ingesting…" : "Simulate editor event"}
            </Button>
          </div>
          {demoMessage ? (
            <p className="text-sm text-[var(--color-accent)]" role="status">
              {demoMessage}
            </p>
          ) : null}
          <LiveCandidateList candidates={snapshot.candidates} />
        </section>

        <LiveActivityRail events={snapshot.events} />
      </div>
    </div>
  );
}
