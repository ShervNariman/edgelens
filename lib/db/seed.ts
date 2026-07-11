import type {
  Approval,
  AuditEvent,
  DatabaseSnapshot,
  EvidenceItem,
  Owner,
  ReleaseCandidate,
  Workspace,
} from "@/lib/db/types";

function iso(daysAgo = 0, hours = 12): string {
  const date = new Date("2026-07-10T12:00:00.000Z");
  date.setUTCDate(date.getUTCDate() - daysAgo);
  date.setUTCHours(hours, 0, 0, 0);
  return date.toISOString();
}

export const DEMO_WORKSPACE: Workspace = {
  id: "ws_demo_private",
  name: "Release Room Demo",
  slug: "release-room-demo",
  isPrivate: true,
  createdAt: iso(30),
};

export const DEMO_OWNER: Owner = {
  id: "user_owner",
  email: "owner@release-room.local",
  displayName: "Private Owner",
};

const readyEvidence: EvidenceItem[] = [
  {
    id: "ev_gh_checks",
    source: "github",
    title: "CI checks",
    summary: "lint, typecheck, unit, and build are green on the release branch.",
    status: "pass",
    url: "https://github.com/example/app/actions",
    collectedAt: iso(1, 10),
  },
  {
    id: "ev_linear_intent",
    source: "linear",
    title: "Linear acceptance",
    summary: "SHE-58 foundation acceptance criteria marked complete.",
    status: "pass",
    url: "https://linear.app/example/issue/SHE-58",
    collectedAt: iso(1, 11),
  },
  {
    id: "ev_vercel_preview",
    source: "vercel",
    title: "Preview deployment",
    summary: "Preview URL healthy; smoke route returns 200.",
    status: "pass",
    url: "https://release-room-demo.vercel.app",
    collectedAt: iso(0, 9),
  },
  {
    id: "editor:run_demo_seed:complete",
    source: "editor",
    title: "Cursor run completed",
    summary:
      "SHE-58 scaffold polish · model grok-4.5 · branch cursor/she-58-release-room-scaffold-c3bb · checks: lint, typecheck, test",
    status: "pass",
    collectedAt: iso(0, 10),
  },
];

const blockedEvidence: EvidenceItem[] = [
  {
    id: "ev_gh_fail",
    source: "github",
    title: "CI checks",
    summary: "Playwright e2e failed on chromium smoke.",
    status: "fail",
    url: "https://github.com/example/app/actions/runs/1",
    collectedAt: iso(0, 8),
  },
  {
    id: "ev_policy",
    source: "fixture",
    title: "Risk policy",
    summary: "High-risk change set requires exception or green e2e.",
    status: "warn",
    collectedAt: iso(0, 8),
  },
];

function release(partial: Omit<ReleaseCandidate, "workspaceId">): ReleaseCandidate {
  return {
    ...partial,
    workspaceId: DEMO_WORKSPACE.id,
  };
}

export function createSeedSnapshot(ownerEmail = DEMO_OWNER.email): DatabaseSnapshot {
  const owner: Owner = {
    ...DEMO_OWNER,
    email: ownerEmail,
  };

  const ready: ReleaseCandidate = release({
    id: "rc_ready_001",
    title: "Foundation scaffold",
    version: "0.1.0",
    branch: "cursor/she-58-release-room-scaffold-c3bb",
    decision: "READY",
    summary:
      "Private MVP foundation is ready: auth boundary, local DB, seeded workspace, and CI.",
    evidence: readyEvidence,
    approvals: [],
    audit: [
      {
        id: "audit_ready_created",
        at: iso(1, 9),
        actorEmail: owner.email,
        action: "release.created",
        detail: "Seeded READY candidate for demo walkthrough.",
      },
      {
        id: "audit_ready_editor",
        at: iso(0, 10),
        actorEmail: "editor:cursor@release-room.local",
        action: "editor.complete",
        detail:
          "SHE-58 scaffold polish · model grok-4.5 · branch cursor/she-58-release-room-scaffold-c3bb · checks: lint, typecheck, test",
      },
    ],
    createdAt: iso(1, 9),
    updatedAt: iso(0, 9),
  });

  const blocked: ReleaseCandidate = release({
    id: "rc_blocked_001",
    title: "Policy engine spike",
    version: "0.1.1-rc.1",
    branch: "feat/policy-engine",
    decision: "BLOCKED",
    summary: "Blocked on failing e2e evidence until exception or fix lands.",
    evidence: blockedEvidence,
    approvals: [],
    audit: [
      {
        id: "audit_blocked_created",
        at: iso(0, 7),
        actorEmail: owner.email,
        action: "release.created",
        detail: "Seeded BLOCKED candidate to exercise decision UI.",
      },
      {
        id: "audit_blocked_decision",
        at: iso(0, 8),
        actorEmail: "system@release-room.local",
        action: "decision.evaluated",
        detail: "Deterministic policy returned BLOCKED (failed CI evidence).",
      },
    ],
    createdAt: iso(0, 7),
    updatedAt: iso(0, 8),
  });

  return {
    workspace: DEMO_WORKSPACE,
    owner,
    releases: [ready, blocked],
  };
}

export function newId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`;
}

export function stampApproval(input: Omit<Approval, "id" | "createdAt">): Approval {
  return {
    ...input,
    id: newId("appr"),
    createdAt: new Date().toISOString(),
  };
}

export function stampAudit(input: Omit<AuditEvent, "id" | "at">): AuditEvent {
  return {
    ...input,
    id: newId("audit"),
    at: new Date().toISOString(),
  };
}
