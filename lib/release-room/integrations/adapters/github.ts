import {
  getIntegrationEnv,
  githubLiveEnabled,
  type IntegrationEnv,
} from "../config";
import { buildFixtureEvidence } from "../fixtures";
import type {
  AdapterContext,
  AdapterResult,
  EvidenceAdapter,
  NormalizedEvidenceItem,
} from "../types";
import { IntegrationError } from "../types";

type Json = Record<string, unknown>;

async function githubFetch(
  path: string,
  token: string,
  fetchImpl: typeof fetch
): Promise<Json | Json[]> {
  const response = await fetchImpl(`https://api.github.com${path}`, {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "release-room-integrations",
    },
  });

  if (!response.ok) {
    throw new IntegrationError(
      "github_api_error",
      "GitHub API request failed.",
      response.status >= 500 ? 502 : 400,
      { status: response.status, path }
    );
  }

  return (await response.json()) as Json | Json[];
}

function parseRepo(
  releaseRepo: string | undefined,
  env: IntegrationEnv
): { owner: string; repo: string } | null {
  if (env.githubOwner && env.githubRepo) {
    return { owner: env.githubOwner, repo: env.githubRepo };
  }
  if (releaseRepo && releaseRepo.includes("/")) {
    const [owner, repo] = releaseRepo.split("/", 2);
    if (owner && repo) return { owner, repo };
  }
  return null;
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" ? value : fallback;
}

/**
 * GitHub adapter — repository / PR / changed files / checks / reviews.
 * Falls back to fixtures when GITHUB_TOKEN is absent.
 */
export class GitHubAdapter implements EvidenceAdapter {
  readonly provider = "github" as const;

  constructor(private readonly env: IntegrationEnv = getIntegrationEnv()) {}

  isLiveConfigured(): boolean {
    return githubLiveEnabled(this.env);
  }

  async collect(ctx: AdapterContext): Promise<AdapterResult> {
    const useFixture = ctx.forceFixture || !this.isLiveConfigured();
    if (useFixture) {
      const evidence = buildFixtureEvidence(ctx.release).filter(
        (item) => item.provider === "github"
      );
      return {
        provider: "github",
        mode: "fixture",
        evidence,
        note: "GitHub fixture adapter — no GITHUB_TOKEN configured.",
      };
    }

    try {
      const evidence = await this.collectLive(ctx);
      return {
        provider: "github",
        mode: "live",
        evidence,
        note: "GitHub live adapter refreshed repository/PR evidence.",
      };
    } catch (error) {
      // Fail closed: do not leak tokens; surface a pending/fail evidence item.
      const message =
        error instanceof IntegrationError
          ? error.message
          : "GitHub live collection failed.";
      const now = ctx.now ?? new Date().toISOString();
      const fallback: NormalizedEvidenceItem = {
        id: `github:error:${ctx.release.id}`,
        provider: "github",
        category: "code",
        outcome: "fail",
        title: "GitHub adapter failure",
        summary: message,
        externalId: `error-${ctx.release.id}`,
        sourceLinks: [],
        collectedAt: now,
      };
      return {
        provider: "github",
        mode: "live",
        evidence: [fallback],
        note: "GitHub live adapter failed closed.",
      };
    }
  }

  private async collectLive(ctx: AdapterContext): Promise<NormalizedEvidenceItem[]> {
    const token = this.env.githubToken;
    if (!token) {
      throw new IntegrationError("github_token_missing", "GITHUB_TOKEN missing.", 503);
    }

    const parsed = parseRepo(ctx.release.repository, this.env);
    if (!parsed) {
      throw new IntegrationError(
        "github_repo_missing",
        "Set GITHUB_OWNER/GITHUB_REPO or release.repository.",
        400
      );
    }

    const fetchImpl = ctx.fetchImpl ?? fetch;
    const now = ctx.now ?? new Date().toISOString();
    const { owner, repo } = parsed;
    const prNumber = ctx.release.prNumber;

    if (!prNumber) {
      throw new IntegrationError(
        "github_pr_missing",
        "release.prNumber is required for live GitHub collection.",
        400
      );
    }

    const pr = (await githubFetch(
      `/repos/${owner}/${repo}/pulls/${prNumber}`,
      token,
      fetchImpl
    )) as Json;

    const files = (await githubFetch(
      `/repos/${owner}/${repo}/pulls/${prNumber}/files?per_page=100`,
      token,
      fetchImpl
    )) as Json[];

    const reviews = (await githubFetch(
      `/repos/${owner}/${repo}/pulls/${prNumber}/reviews`,
      token,
      fetchImpl
    )) as Json[];

    const checks = (await githubFetch(
      `/repos/${owner}/${repo}/commits/${asString(pr.head && (pr.head as Json).sha)}/check-runs`,
      token,
      fetchImpl
    )) as Json;

    const checkRuns = Array.isArray((checks as Json).check_runs)
      ? ((checks as Json).check_runs as Json[])
      : [];

    const approved = reviews.some(
      (review) => asString(review.state) === "APPROVED"
    );
    const changesRequested = reviews.some(
      (review) => asString(review.state) === "CHANGES_REQUESTED"
    );
    const failingChecks = checkRuns.filter(
      (run) =>
        asString(run.conclusion) === "failure" ||
        asString(run.conclusion) === "timed_out"
    );
    const pendingChecks = checkRuns.filter(
      (run) =>
        asString(run.status) !== "completed" ||
        asString(run.conclusion) === "neutral"
    );

    const prUrl = asString(pr.html_url, `https://github.com/${owner}/${repo}/pull/${prNumber}`);
    const items: NormalizedEvidenceItem[] = [
      {
        id: `github:pr:${prNumber}`,
        provider: "github",
        category: "code",
        outcome: changesRequested ? "fail" : approved ? "pass" : "pending",
        title: `PR #${prNumber} reviews`,
        summary: changesRequested
          ? "Changes requested on the pull request."
          : approved
            ? "Required review approval present."
            : "Awaiting required review approval.",
        externalId: String(prNumber),
        sourceLinks: [{ label: `PR #${prNumber}`, url: prUrl }],
        collectedAt: now,
        metadata: {
          reviewCount: reviews.length,
          approved,
          changesRequested,
          changedFiles: files.length,
          additions: asNumber(pr.additions),
          deletions: asNumber(pr.deletions),
        },
      },
      {
        id: `github:checks:${prNumber}`,
        provider: "github",
        category: "test",
        outcome:
          failingChecks.length > 0
            ? "fail"
            : pendingChecks.length > 0
              ? "pending"
              : "pass",
        title: "GitHub checks",
        summary:
          failingChecks.length > 0
            ? `${failingChecks.length} check(s) failing.`
            : pendingChecks.length > 0
              ? `${pendingChecks.length} check(s) still running.`
              : "Required checks completed successfully.",
        externalId: `checks-${prNumber}`,
        sourceLinks: [{ label: "Checks", url: `${prUrl}/checks` }],
        collectedAt: now,
        metadata: {
          total: checkRuns.length,
          failing: failingChecks.map((run) => asString(run.name)),
        },
      },
      {
        id: `github:files:${prNumber}`,
        provider: "github",
        category: "security",
        outcome: "pass",
        title: "Changed files",
        summary: `${files.length} file(s) changed in PR #${prNumber}.`,
        externalId: `files-${prNumber}`,
        sourceLinks: [{ label: "Files changed", url: `${prUrl}/files` }],
        collectedAt: now,
        metadata: {
          paths: files.slice(0, 50).map((file) => asString(file.filename)),
        },
      },
    ];

    return items;
  }
}
