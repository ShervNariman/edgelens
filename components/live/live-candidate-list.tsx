"use client";

import Link from "next/link";
import { DecisionBadge } from "@/components/decision-badge";
import { cn } from "@/lib/utils";
import type { ReleaseStage, SnapshotCandidate } from "@/lib/live/types";

function stageTone(state: ReleaseStage["state"]): string {
  if (state === "pass") return "bg-[var(--color-ready)]";
  if (state === "blocked") return "bg-[var(--color-danger)]";
  if (state === "pending") return "bg-[#c48a2a]";
  return "bg-[var(--color-line)]";
}

function StageStrip({
  stages,
  currentId,
}: {
  stages: ReleaseStage[];
  currentId: string;
}) {
  return (
    <ol className="flex flex-wrap gap-2" aria-label="Evidence-derived release stages">
      {stages.map((stage) => (
        <li key={stage.id} className="flex items-center gap-2">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md border border-[var(--color-line)] px-2 py-1 text-xs",
              stage.id === currentId
                ? "border-[var(--color-ink)]/25 bg-[var(--color-wash)] font-semibold"
                : "bg-transparent text-[var(--color-muted)]",
            )}
            title={stage.detail}
          >
            <span
              className={cn("size-1.5 rounded-full", stageTone(stage.state))}
              aria-hidden
            />
            {stage.label}
            <span className="sr-only">
              {stage.state}
              {stage.id === currentId ? " (current)" : ""}
            </span>
          </span>
        </li>
      ))}
    </ol>
  );
}

export function LiveCandidateList({ candidates }: { candidates: SnapshotCandidate[] }) {
  if (candidates.length === 0) {
    return (
      <div
        role="status"
        className="rounded-xl border border-dashed border-[var(--color-line)] bg-[var(--color-paper)]/70 px-5 py-10 text-center"
      >
        <p className="font-[family-name:var(--font-display)] text-xl font-semibold">
          No release candidates
        </p>
        <p className="mt-2 text-sm text-[var(--color-muted)]">
          Seed the workspace or ingest the first webhook / editor event to populate the
          live board.
        </p>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {candidates.map((candidate) => (
        <li key={candidate.id}>
          <Link
            href={candidate.href}
            className="block rounded-xl border border-[var(--color-line)] bg-[var(--color-paper)]/90 p-5 transition-colors hover:bg-[var(--color-wash)] focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:outline-none"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <DecisionBadge decision={candidate.decision} />
                  <span className="font-mono text-xs text-[var(--color-muted)]">
                    {candidate.id} · {candidate.version}
                  </span>
                </div>
                <h3 className="font-[family-name:var(--font-display)] text-xl font-semibold tracking-tight">
                  {candidate.title}
                </h3>
                <p className="text-sm text-[var(--color-muted)]">{candidate.branch}</p>
              </div>
              <div className="text-right text-xs text-[var(--color-muted)]">
                <p>
                  Proofs {candidate.requiredProofs.passed}/
                  {candidate.requiredProofs.total}
                </p>
                <p className="mt-1">
                  Stage: {candidate.stage.label} · {candidate.stage.state}
                </p>
              </div>
            </div>

            <p className="mt-3 text-sm text-[var(--color-ink-soft)]">
              {candidate.blockers[0] ?? candidate.summary}
            </p>

            <div className="mt-4">
              <StageStrip stages={candidate.stages} currentId={candidate.stage.id} />
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
