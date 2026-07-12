import type { NormalizedEvidenceItem, ReleaseRef } from "./types";

/** Deterministic fixture clock for seeded demos. */
export const FIXTURE_NOW = "2026-07-11T12:00:00.000Z";

function item(
  partial: Omit<NormalizedEvidenceItem, "collectedAt"> & { collectedAt?: string }
): NormalizedEvidenceItem {
  return {
    collectedAt: FIXTURE_NOW,
    ...partial,
  };
}

/**
 * Seeded evidence for a release candidate.
 * Ready path when version does not include "blocked"; blocked path otherwise.
 */
export function buildFixtureEvidence(release: ReleaseRef): NormalizedEvidenceItem[] {
  const repo = release.repository ?? "acme/release-room";
  const pr = release.prNumber ?? 42;
  const issue = release.linearIssueId ?? "SHE-60";
  const blocked =
    (release.version ?? "").toLowerCase().includes("blocked") ||
    release.id.toLowerCase().includes("blocked");

  const github: NormalizedEvidenceItem[] = [
    item({
      id: `github:pr:${pr}`,
      provider: "github",
      category: "code",
      outcome: "pass",
      title: `PR #${pr} review complete`,
      summary: blocked
        ? `Pull request #${pr} on ${repo} has required reviews but CI is red.`
        : `Pull request #${pr} on ${repo} is approved with required reviews.`,
      externalId: String(pr),
      sourceLinks: [
        {
          label: `PR #${pr}`,
          url: `https://github.com/${repo}/pull/${pr}`,
        },
      ],
      metadata: {
        changedFiles: 12,
        additions: 340,
        deletions: 88,
        reviewState: "APPROVED",
      },
    }),
    item({
      id: `github:checks:${pr}`,
      provider: "github",
      category: "test",
      outcome: blocked ? "fail" : "pass",
      title: blocked ? "Required checks failing" : "Required checks passing",
      summary: blocked
        ? "lint, typecheck, and build reported failures on the head SHA."
        : "lint, typecheck, and build are green on the head SHA.",
      externalId: `checks-${pr}`,
      sourceLinks: [
        {
          label: "Checks",
          url: `https://github.com/${repo}/pull/${pr}/checks`,
        },
      ],
      metadata: {
        checks: blocked
          ? [
              { name: "lint", conclusion: "failure" },
              { name: "typecheck", conclusion: "success" },
              { name: "build", conclusion: "failure" },
            ]
          : [
              { name: "lint", conclusion: "success" },
              { name: "typecheck", conclusion: "success" },
              { name: "build", conclusion: "success" },
            ],
      },
    }),
    item({
      id: `github:files:${pr}`,
      provider: "github",
      category: "security",
      outcome: "pass",
      title: "Changed files scanned",
      summary: "No secrets or lockfile-only risk patterns in the PR diff summary.",
      externalId: `files-${pr}`,
      sourceLinks: [
        {
          label: "Files changed",
          url: `https://github.com/${repo}/pull/${pr}/files`,
        },
      ],
      metadata: {
        paths: [
          "lib/release-room/integrations/",
          "app/api/integrations/",
          "docs/integrations.md",
        ],
      },
    }),
  ];

  const linear: NormalizedEvidenceItem[] = [
    item({
      id: `linear:issue:${issue}`,
      provider: "linear",
      category: "intent",
      outcome: "pass",
      title: `${issue} intent captured`,
      summary:
        "Issue describes adapter boundaries for GitHub, Linear, Vercel, and signed webhooks.",
      externalId: issue,
      sourceLinks: [
        {
          label: issue,
          url: `https://linear.app/issue/${issue}`,
        },
      ],
      metadata: {
        state: "In Progress",
        priority: 2,
      },
    }),
    item({
      id: `linear:ac:${issue}`,
      provider: "linear",
      category: "intent",
      outcome: blocked ? "pending" : "pass",
      title: "Acceptance criteria",
      summary: blocked
        ? "Acceptance criteria present but one criterion remains unchecked."
        : "Seeded release refreshes from fixtures; live providers activate via env vars.",
      externalId: `${issue}-ac`,
      sourceLinks: [
        {
          label: "Acceptance criteria",
          url: `https://linear.app/issue/${issue}#acceptance`,
        },
      ],
      metadata: {
        criteria: [
          { text: "Fixture refresh works without credentials", done: true },
          {
            text: "Live providers activate through environment variables",
            done: !blocked,
          },
        ],
      },
    }),
  ];

  const deploymentId = release.vercelDeploymentId ?? "dpl_fixture_001";
  const vercel: NormalizedEvidenceItem[] = [
    item({
      id: `vercel:deployment:${deploymentId}`,
      provider: "vercel",
      category: "deployment",
      outcome: blocked ? "fail" : "pass",
      title: blocked ? "Preview deployment failed" : "Preview deployment ready",
      summary: blocked
        ? "Latest Vercel preview build failed; no healthy preview URL."
        : "Latest Vercel preview is READY with a public preview URL.",
      externalId: deploymentId,
      sourceLinks: [
        {
          label: "Preview",
          url: blocked
            ? `https://vercel.com/${repo}/deployments`
            : `https://${release.id}-preview.vercel.app`,
        },
      ],
      metadata: {
        state: blocked ? "ERROR" : "READY",
        target: "preview",
        projectId: release.vercelProjectId ?? "prj_fixture",
      },
    }),
    item({
      id: `vercel:visual:${deploymentId}`,
      provider: "vercel",
      category: "visual",
      outcome: blocked ? "skipped" : "pass",
      title: blocked ? "Preview visual check skipped" : "Preview visual check",
      summary: blocked
        ? "Skipped because the preview deployment is not healthy."
        : "Preview URL responds and matches the seeded release candidate.",
      externalId: `visual-${deploymentId}`,
      sourceLinks: [
        {
          label: "Preview URL",
          url: `https://${release.id}-preview.vercel.app`,
        },
      ],
    }),
  ];

  return [...github, ...linear, ...vercel];
}

/** Default seeded release used by refresh demos. */
export const SEEDED_RELEASE: ReleaseRef = {
  id: "rc-demo-ready",
  repository: "acme/release-room",
  branch: "main",
  prNumber: 42,
  linearIssueId: "SHE-60",
  vercelProjectId: "prj_fixture",
  vercelDeploymentId: "dpl_fixture_001",
  version: "0.1.0-ready",
};

export const SEEDED_BLOCKED_RELEASE: ReleaseRef = {
  id: "rc-demo-blocked",
  repository: "acme/release-room",
  branch: "release/blocked",
  prNumber: 43,
  linearIssueId: "SHE-61",
  vercelProjectId: "prj_fixture",
  vercelDeploymentId: "dpl_fixture_002",
  version: "0.1.0-blocked",
};
