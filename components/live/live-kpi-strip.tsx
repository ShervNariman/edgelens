"use client";

import { formatDuration } from "@/lib/live/kpis";
import type { DashboardKpis } from "@/lib/live/types";

function KpiCard({
  label,
  value,
  detail,
  action,
}: {
  label: string;
  value: string;
  detail: string;
  action: string;
}) {
  return (
    <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-paper)]/90 p-4">
      <p className="text-xs font-semibold tracking-[0.14em] text-[var(--color-muted)] uppercase">
        {label}
      </p>
      <p className="mt-2 font-[family-name:var(--font-display)] text-3xl font-semibold tracking-tight">
        {value}
      </p>
      <p className="mt-1 text-sm text-[var(--color-ink-soft)]">{detail}</p>
      <p className="mt-3 text-xs font-medium text-[var(--color-accent)]">{action}</p>
    </div>
  );
}

/**
 * KPI strip — every metric ties to a decision or action (no decorative charts).
 */
export function LiveKpiStrip({ kpis }: { kpis: DashboardKpis }) {
  return (
    <section aria-labelledby="kpi-title" className="space-y-3">
      <div>
        <h2
          id="kpi-title"
          className="font-[family-name:var(--font-display)] text-xl font-semibold tracking-tight"
        >
          Decision pulse
        </h2>
        <p className="mt-1 text-sm text-[var(--color-muted)]">
          Counts that drive go / no-go — each card points to a next action.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Active candidates"
          value={String(kpis.activeCandidates)}
          detail="Releases currently in the private workspace."
          action="Open a candidate to review evidence →"
        />
        <KpiCard
          label="Blocked candidates"
          value={String(kpis.blockedCandidates)}
          detail="Failing required evidence or explicit blocks."
          action="Resolve blockers or waive with rationale →"
        />
        <KpiCard
          label="Required proof completion"
          value={`${kpis.requiredProofCompletion}%`}
          detail="GitHub, Linear, and Vercel proofs currently passing."
          action="Refresh providers or capture missing proofs →"
        />
        <KpiCard
          label="Avg wait for human"
          value={formatDuration(kpis.avgWaitForHumanMs)}
          detail={
            kpis.waitingForHuman === 0
              ? "No candidates waiting on human action."
              : `${kpis.waitingForHuman} waiting on approve, fix, or exception.`
          }
          action="Clear the oldest waiting candidate first →"
        />
      </div>
    </section>
  );
}
