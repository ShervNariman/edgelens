/**
 * Dashboard KPI computation for the live founder command center.
 */

import type { EvidenceItem, ReleaseCandidate } from "@/lib/db/types";
import type { DashboardKpis } from "@/lib/live/types";

/** Sources treated as required proofs for completion %. */
const REQUIRED_SOURCES = new Set(["github", "linear", "vercel"]);

export function isRequiredProof(item: EvidenceItem): boolean {
  return REQUIRED_SOURCES.has(item.source);
}

export function requiredProofStats(evidence: EvidenceItem[]): {
  total: number;
  passed: number;
} {
  const required = evidence.filter(isRequiredProof);
  const passed = required.filter((item) => item.status === "pass").length;
  return { total: required.length, passed };
}

/**
 * A release waits on human action when blocked or pending with incomplete proofs.
 */
export function waitingForHumanSince(
  release: ReleaseCandidate,
  nowMs: number,
): string | null {
  if (release.decision === "READY") {
    return null;
  }

  const humanAudit = [...release.audit]
    .reverse()
    .find(
      (event) =>
        event.action === "decision.evaluated" ||
        event.action === "release.created" ||
        event.action.startsWith("evidence."),
    );

  const since = humanAudit?.at ?? release.updatedAt;
  const sinceMs = Date.parse(since);
  if (Number.isNaN(sinceMs) || sinceMs > nowMs) {
    return release.updatedAt;
  }
  return since;
}

export function computeKpis(releases: ReleaseCandidate[], nowIso: string): DashboardKpis {
  const nowMs = Date.parse(nowIso);
  const activeCandidates = releases.length;
  const blockedCandidates = releases.filter((r) => r.decision === "BLOCKED").length;

  let requiredTotal = 0;
  let requiredPassed = 0;
  const waits: number[] = [];

  for (const release of releases) {
    const stats = requiredProofStats(release.evidence);
    requiredTotal += stats.total;
    requiredPassed += stats.passed;

    const since = waitingForHumanSince(release, nowMs);
    if (since) {
      const waitMs = Math.max(0, nowMs - Date.parse(since));
      waits.push(waitMs);
    }
  }

  const requiredProofCompletion =
    requiredTotal === 0 ? 100 : Math.round((requiredPassed / requiredTotal) * 100);

  const avgWaitForHumanMs =
    waits.length === 0
      ? null
      : Math.round(waits.reduce((sum, value) => sum + value, 0) / waits.length);

  return {
    activeCandidates,
    blockedCandidates,
    requiredProofCompletion,
    avgWaitForHumanMs,
    waitingForHuman: waits.length,
  };
}

export function formatDuration(ms: number | null): string {
  if (ms === null) return "—";
  const minutes = Math.floor(ms / 60_000);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const rem = minutes % 60;
  if (hours < 48) return rem === 0 ? `${hours}h` : `${hours}h ${rem}m`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}
