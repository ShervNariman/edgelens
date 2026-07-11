/**
 * Live founder command center snapshot types (SHE-71).
 */

import type { DecisionStatus, EvidenceSource, ReleaseCandidate } from "@/lib/db/types";

export const LIVE_PROVIDERS = [
  "github",
  "linear",
  "vercel",
  "editor",
  "webhook",
] as const;

export type LiveProvider = (typeof LIVE_PROVIDERS)[number];

/** Connection freshness for an evidence provider. */
export type ProviderHealthStatus =
  "connected" | "degraded" | "stale" | "error" | "unknown";

export type LiveEventKind =
  "webhook" | "editor" | "provider_refresh" | "decision" | "system";

export interface ProviderHealth {
  id: LiveProvider;
  label: string;
  status: ProviderHealthStatus;
  /** Last successful observation (ISO). */
  lastSuccessAt: string | null;
  /** Last attempt (ISO), success or failure. */
  lastAttemptAt: string | null;
  /** Human-readable detail — never implies fresh when stale/error. */
  detail: string;
  mode: "live" | "fixture";
}

export interface LiveEvent {
  id: string;
  at: string;
  kind: LiveEventKind;
  provider: LiveProvider | "system";
  releaseId?: string;
  title: string;
  summary: string;
  actor?: string;
}

/** Release stage derived from evidence coverage — not a hard-coded bar. */
export type ReleaseStageId =
  "intent" | "engineering" | "experience" | "deployment" | "decision";

export interface ReleaseStage {
  id: ReleaseStageId;
  label: string;
  /** pass | pending | blocked — derived from evidence for this stage. */
  state: "pass" | "pending" | "blocked" | "empty";
  detail: string;
  evidenceCount: number;
}

export interface DashboardKpis {
  activeCandidates: number;
  blockedCandidates: number;
  /** 0–100 share of required proofs that currently pass. */
  requiredProofCompletion: number;
  /** Average milliseconds waiting for human action; null when none waiting. */
  avgWaitForHumanMs: number | null;
  /** Releases waiting on human approve / exception / fix. */
  waitingForHuman: number;
}

export interface SnapshotCandidate {
  id: string;
  title: string;
  version: string;
  branch: string;
  decision: DecisionStatus;
  summary: string;
  updatedAt: string;
  stage: ReleaseStage;
  stages: ReleaseStage[];
  blockers: string[];
  requiredProofs: { total: number; passed: number };
  waitingForHumanSince: string | null;
  href: string;
}

export type SnapshotFreshness = "fresh" | "stale" | "error" | "empty";

export interface LiveSnapshot {
  generatedAt: string;
  /** Server clock used for freshness math. */
  serverNow: string;
  pollIntervalMs: number;
  staleAfterMs: number;
  freshness: SnapshotFreshness;
  workspace: {
    id: string;
    name: string;
    slug: string;
  };
  kpis: DashboardKpis;
  providers: ProviderHealth[];
  candidates: SnapshotCandidate[];
  events: LiveEvent[];
  /** Overall provider error count for banner states. */
  providerErrorCount: number;
  /** True when any provider is stale or degraded. */
  degraded: boolean;
}

export interface IngestLiveEventInput {
  kind: Extract<LiveEventKind, "webhook" | "editor" | "provider_refresh">;
  provider: LiveProvider;
  title: string;
  summary: string;
  releaseId?: string;
  actor?: string;
  /** Optional evidence mutation applied to a release when present. */
  evidence?: {
    source: EvidenceSource;
    title: string;
    summary: string;
    status: "pass" | "fail" | "warn" | "info";
    url?: string;
  };
}

export type { ReleaseCandidate };
