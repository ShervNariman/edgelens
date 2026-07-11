/**
 * Build the lightweight internal live snapshot for the founder command center.
 */

import { getDatabase } from "@/lib/db";
import { LIVE_CLIENT_STALE_AFTER_MS, LIVE_POLL_INTERVAL_MS } from "@/lib/live/constants";
import { computeKpis, requiredProofStats, waitingForHumanSince } from "@/lib/live/kpis";
import { evaluateProviderHealth } from "@/lib/live/providers";
import { deriveReleaseStages } from "@/lib/live/stage";
import { getLiveState } from "@/lib/live/store";
import type { LiveSnapshot, SnapshotCandidate } from "@/lib/live/types";
import type { ReleaseCandidate } from "@/lib/db/types";

function blockersFor(release: ReleaseCandidate): string[] {
  return release.evidence
    .filter((item) => item.status === "fail")
    .map((item) => item.summary);
}

function toCandidate(release: ReleaseCandidate, nowIso: string): SnapshotCandidate {
  const { stages, current } = deriveReleaseStages(release.evidence);
  const proofs = requiredProofStats(release.evidence);
  const nowMs = Date.parse(nowIso);

  return {
    id: release.id,
    title: release.title,
    version: release.version,
    branch: release.branch,
    decision: release.decision,
    summary: release.summary,
    updatedAt: release.updatedAt,
    stage: current,
    stages,
    blockers: blockersFor(release),
    requiredProofs: proofs,
    waitingForHumanSince: waitingForHumanSince(release, nowMs),
    href: `/app/releases/${release.id}`,
  };
}

export async function buildLiveSnapshot(
  nowIso = new Date().toISOString(),
): Promise<LiveSnapshot> {
  const db = getDatabase();
  const [workspace, releases, live] = await Promise.all([
    db.getWorkspace(),
    db.listReleases(),
    getLiveState(),
  ]);

  const providers = live.providers.map((record) =>
    evaluateProviderHealth(record, nowIso),
  );
  const providerErrorCount = providers.filter((p) => p.status === "error").length;
  const degraded = providers.some(
    (p) => p.status === "degraded" || p.status === "stale" || p.status === "error",
  );

  let freshness: LiveSnapshot["freshness"] = "fresh";
  if (releases.length === 0) {
    freshness = "empty";
  } else if (providerErrorCount > 0 && providers.every((p) => p.status === "error")) {
    freshness = "error";
  } else if (providers.some((p) => p.status === "stale")) {
    freshness = "stale";
  }

  return {
    generatedAt: nowIso,
    serverNow: nowIso,
    pollIntervalMs: LIVE_POLL_INTERVAL_MS,
    staleAfterMs: LIVE_CLIENT_STALE_AFTER_MS,
    freshness,
    workspace: {
      id: workspace.id,
      name: workspace.name,
      slug: workspace.slug,
    },
    kpis: computeKpis(releases, nowIso),
    providers,
    candidates: releases.map((release) => toCandidate(release, nowIso)),
    events: live.events,
    providerErrorCount,
    degraded,
  };
}
