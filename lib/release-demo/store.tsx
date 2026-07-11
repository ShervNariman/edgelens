"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  applyDecisionToRelease,
  newId,
  recomputeStatus,
} from "@/lib/release-demo/decision";
import { DEMO_ACTOR, SEED_RELEASES } from "@/lib/release-demo/seed";
import type {
  DecisionAction,
  EvidenceItem,
  ManualEvidenceInput,
  ReleaseCandidate,
} from "@/types/release";

interface ReleaseRoomStore {
  releases: ReleaseCandidate[];
  getRelease: (slug: string) => ReleaseCandidate | undefined;
  refreshEvidence: (slug: string) => void;
  captureEvidence: (slug: string, input: ManualEvidenceInput) => void;
  updateEvidenceStatus: (
    slug: string,
    evidenceId: string,
    status: EvidenceItem["status"],
    note?: string,
  ) => void;
  decide: (
    slug: string,
    action: DecisionAction,
    rationale: string,
  ) => void;
}

const ReleaseRoomContext = createContext<ReleaseRoomStore | null>(null);

function appendAudit(
  release: ReleaseCandidate,
  kind: ReleaseCandidate["auditTrail"][number]["kind"],
  summary: string,
  detail?: string,
): ReleaseCandidate {
  const at = new Date().toISOString();
  const event = {
    id: newId("aud"),
    at,
    actor: DEMO_ACTOR,
    kind,
    summary,
    detail,
    immutable: true as const,
  };
  const activity = {
    id: newId("act"),
    at,
    actor: DEMO_ACTOR,
    summary,
  };
  return {
    ...release,
    updatedAt: at,
    auditTrail: [...release.auditTrail, event],
    recentActivity: [activity, ...release.recentActivity].slice(0, 8),
  };
}

export function ReleaseRoomProvider({ children }: { children: ReactNode }) {
  const [releases, setReleases] = useState<ReleaseCandidate[]>(SEED_RELEASES);

  const getRelease = useCallback(
    (slug: string) => releases.find((r) => r.slug === slug || r.id === slug),
    [releases],
  );

  const patchRelease = useCallback(
    (slug: string, updater: (r: ReleaseCandidate) => ReleaseCandidate) => {
      setReleases((prev) =>
        prev.map((r) => (r.slug === slug || r.id === slug ? updater(r) : r)),
      );
    },
    [],
  );

  const refreshEvidence = useCallback(
    (slug: string) => {
      patchRelease(slug, (release) => {
        const at = new Date().toISOString();
        const evidence = release.evidence.map((item) => {
          if (item.status === "missing") return item;
          return { ...item, refreshedAt: at };
        });
        const next = applyDecisionToRelease(
          release,
          recomputeStatus(evidence),
          evidence,
        );
        return appendAudit(
          next,
          "evidence_refreshed",
          "Refreshed connected evidence sources",
          "GitHub, Linear, Vercel, and CI adapters polled (demo).",
        );
      });
    },
    [patchRelease],
  );

  const captureEvidence = useCallback(
    (slug: string, input: ManualEvidenceInput) => {
      patchRelease(slug, (release) => {
        const at = new Date().toISOString();
        const item: EvidenceItem = {
          id: newId("ev"),
          group: input.group,
          title: input.title.trim(),
          summary: input.summary.trim(),
          status: input.status,
          required: Boolean(input.required),
          owner: input.owner.trim() || DEMO_ACTOR,
          sourceKind: "manual",
          sourceLabel: input.sourceLabel.trim() || "Manual capture",
          sourceUrl: input.sourceUrl?.trim() || undefined,
          collectedAt: at,
          refreshedAt: at,
        };
        const evidence = [...release.evidence, item];
        const next = applyDecisionToRelease(
          release,
          recomputeStatus(evidence),
          evidence,
        );
        return appendAudit(
          next,
          "evidence_captured",
          `Captured manual evidence · ${item.title}`,
          item.summary,
        );
      });
    },
    [patchRelease],
  );

  const updateEvidenceStatus = useCallback(
    (
      slug: string,
      evidenceId: string,
      status: EvidenceItem["status"],
      note?: string,
    ) => {
      patchRelease(slug, (release) => {
        const at = new Date().toISOString();
        const evidence = release.evidence.map((item) =>
          item.id === evidenceId
            ? { ...item, status, refreshedAt: at }
            : item,
        );
        const target = evidence.find((e) => e.id === evidenceId);
        const next = applyDecisionToRelease(
          release,
          recomputeStatus(evidence),
          evidence,
        );
        return appendAudit(
          next,
          "evidence_refreshed",
          `Updated ${target?.title ?? "evidence"} → ${status}`,
          note,
        );
      });
    },
    [patchRelease],
  );

  const decide = useCallback(
    (slug: string, action: DecisionAction, rationale: string) => {
      const trimmed = rationale.trim();
      if (!trimmed) return;

      patchRelease(slug, (release) => {
        let evidence = release.evidence;
        let status = release.status;
        let kind: ReleaseCandidate["auditTrail"][number]["kind"] = "note";
        let summary = "";

        if (action === "approve") {
          status = "READY";
          kind = "approved";
          summary = "Approved for release";
        } else if (action === "block") {
          status = "BLOCKED";
          kind = "blocked";
          summary = "Explicitly blocked";
        } else {
          status = "WARNING";
          kind = "approved_with_exception";
          summary = "Approved with exception";
          evidence = evidence.map((item) => {
            if (
              item.required &&
              (item.status === "fail" || item.status === "missing")
            ) {
              return { ...item, status: "waived" as const };
            }
            return item;
          });
          status = recomputeStatus(evidence);
          if (status === "READY") status = "WARNING";
        }

        const next = applyDecisionToRelease(release, status, evidence);
        return appendAudit(next, kind, summary, trimmed);
      });
    },
    [patchRelease],
  );

  const value = useMemo(
    () => ({
      releases,
      getRelease,
      refreshEvidence,
      captureEvidence,
      updateEvidenceStatus,
      decide,
    }),
    [
      releases,
      getRelease,
      refreshEvidence,
      captureEvidence,
      updateEvidenceStatus,
      decide,
    ],
  );

  return (
    <ReleaseRoomContext.Provider value={value}>
      {children}
    </ReleaseRoomContext.Provider>
  );
}

export function useReleaseRoom(): ReleaseRoomStore {
  const ctx = useContext(ReleaseRoomContext);
  if (!ctx) {
    throw new Error("useReleaseRoom must be used within ReleaseRoomProvider");
  }
  return ctx;
}
