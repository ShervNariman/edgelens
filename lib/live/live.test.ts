import { describe, expect, it } from "vitest";
import { computeKpis, requiredProofStats } from "@/lib/live/kpis";
import { evaluateProviderHealth } from "@/lib/live/providers";
import { deriveReleaseStages } from "@/lib/live/stage";
import type { EvidenceItem, ReleaseCandidate } from "@/lib/db/types";

function evidence(
  partial: Partial<EvidenceItem> & Pick<EvidenceItem, "id" | "source" | "status">,
): EvidenceItem {
  return {
    title: partial.title ?? partial.id,
    summary: partial.summary ?? partial.id,
    collectedAt: partial.collectedAt ?? "2026-07-11T12:00:00.000Z",
    ...partial,
  };
}

describe("deriveReleaseStages", () => {
  it("marks engineering blocked from failing GitHub evidence", () => {
    const { current, stages } = deriveReleaseStages([
      evidence({
        id: "1",
        source: "linear",
        status: "pass",
        title: "Intent",
        summary: "ok",
      }),
      evidence({
        id: "2",
        source: "github",
        status: "fail",
        title: "CI",
        summary: "e2e failed",
      }),
    ]);

    expect(current.id).toBe("engineering");
    expect(current.state).toBe("blocked");
    expect(stages.find((s) => s.id === "intent")?.state).toBe("pass");
  });

  it("advances to decision when required stages pass", () => {
    const { current } = deriveReleaseStages([
      evidence({ id: "1", source: "linear", status: "pass" }),
      evidence({ id: "2", source: "github", status: "pass" }),
      evidence({ id: "3", source: "manual", status: "pass" }),
      evidence({ id: "4", source: "vercel", status: "pass" }),
    ]);
    expect(current.id).toBe("decision");
    expect(current.state).toBe("pass");
  });
});

describe("computeKpis", () => {
  it("computes required proof completion and waiters", () => {
    const releases: ReleaseCandidate[] = [
      {
        id: "rc_a",
        workspaceId: "ws",
        title: "A",
        version: "1",
        branch: "main",
        decision: "BLOCKED",
        summary: "blocked",
        evidence: [
          evidence({ id: "g", source: "github", status: "fail" }),
          evidence({ id: "l", source: "linear", status: "pass" }),
          evidence({ id: "v", source: "vercel", status: "pass" }),
        ],
        approvals: [],
        audit: [
          {
            id: "a1",
            at: "2026-07-11T10:00:00.000Z",
            actorEmail: "system@release-room.local",
            action: "decision.evaluated",
            detail: "blocked",
          },
        ],
        createdAt: "2026-07-11T09:00:00.000Z",
        updatedAt: "2026-07-11T10:00:00.000Z",
      },
      {
        id: "rc_b",
        workspaceId: "ws",
        title: "B",
        version: "1",
        branch: "main",
        decision: "READY",
        summary: "ready",
        evidence: [
          evidence({ id: "g2", source: "github", status: "pass" }),
          evidence({ id: "l2", source: "linear", status: "pass" }),
          evidence({ id: "v2", source: "vercel", status: "pass" }),
        ],
        approvals: [],
        audit: [],
        createdAt: "2026-07-11T09:00:00.000Z",
        updatedAt: "2026-07-11T11:00:00.000Z",
      },
    ];

    const kpis = computeKpis(releases, "2026-07-11T12:00:00.000Z");
    expect(kpis.activeCandidates).toBe(2);
    expect(kpis.blockedCandidates).toBe(1);
    expect(kpis.requiredProofCompletion).toBe(83);
    expect(kpis.waitingForHuman).toBe(1);
    expect(kpis.avgWaitForHumanMs).toBe(2 * 60 * 60 * 1000);
  });

  it("counts only github/linear/vercel as required proofs", () => {
    expect(
      requiredProofStats([
        evidence({ id: "1", source: "manual", status: "pass" }),
        evidence({ id: "2", source: "github", status: "pass" }),
      ]),
    ).toEqual({ total: 1, passed: 1 });
  });
});

describe("evaluateProviderHealth", () => {
  it("never reports connected when last success is stale", () => {
    const health = evaluateProviderHealth(
      {
        id: "github",
        lastSuccessAt: "2026-07-11T10:00:00.000Z",
        lastAttemptAt: "2026-07-11T10:00:00.000Z",
        lastError: null,
        mode: "fixture",
      },
      "2026-07-11T12:00:00.000Z",
    );
    expect(health.status).toBe("stale");
    expect(health.detail.toLowerCase()).toContain("outdated");
  });

  it("reports error when only failures exist", () => {
    const health = evaluateProviderHealth(
      {
        id: "vercel",
        lastSuccessAt: null,
        lastAttemptAt: "2026-07-11T12:00:00.000Z",
        lastError: "timeout",
        mode: "live",
      },
      "2026-07-11T12:00:00.000Z",
    );
    expect(health.status).toBe("error");
  });
});
