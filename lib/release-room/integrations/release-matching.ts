/**
 * Release-candidate matching for provider events.
 *
 * Loop 1 (SHE-94): never silently attach evidence to the wrong candidate.
 * Unmatched and ambiguous events are rejected with actionable errors.
 */

import { defaultReleaseRegistry, type ReleaseRegistry } from "./release-registry";
import type { NativeProvider, ReleaseRef } from "./types";
import { IntegrationError } from "./types";

export type MatchStatus = "matched" | "unmatched" | "ambiguous";

export interface MatchHints {
  /** Explicit override (generic webhook / caller) */
  releaseId?: string | null;
  repository?: string | null;
  prNumber?: number | null;
  linearIssueId?: string | null;
  vercelDeploymentId?: string | null;
  vercelProjectId?: string | null;
  branch?: string | null;
}

export interface MatchResult {
  status: MatchStatus;
  release: ReleaseRef | null;
  /** Candidates considered when ambiguous */
  candidates: ReleaseRef[];
  confidence: "exact" | "strong" | "weak" | "none";
  reason: string;
}

function normalizeRepo(value: string | null | undefined): string | null {
  if (!value) return null;
  return value.trim().toLowerCase().replace(/^https?:\/\/github\.com\//, "");
}

function scoreCandidate(
  release: ReleaseRef,
  provider: NativeProvider | "webhook" | "editor",
  hints: MatchHints
): { score: number; confidence: MatchResult["confidence"]; reason: string } {
  if (hints.releaseId && hints.releaseId === release.id) {
    return { score: 100, confidence: "exact", reason: `Exact releaseId ${release.id}` };
  }

  let score = 0;
  const reasons: string[] = [];

  if (provider === "github" || provider === "webhook") {
    const hintRepo = normalizeRepo(hints.repository);
    const releaseRepo = normalizeRepo(release.repository);
    if (hintRepo && releaseRepo && hintRepo === releaseRepo) {
      score += 40;
      reasons.push("repository");
    }
    if (
      hints.prNumber != null &&
      release.prNumber != null &&
      hints.prNumber === release.prNumber
    ) {
      score += 50;
      reasons.push(`pr #${hints.prNumber}`);
    }
    if (
      hints.branch &&
      release.branch &&
      hints.branch.toLowerCase() === release.branch.toLowerCase()
    ) {
      score += 10;
      reasons.push("branch");
    }
  }

  if (provider === "linear" || provider === "webhook") {
    if (
      hints.linearIssueId &&
      release.linearIssueId &&
      hints.linearIssueId.toUpperCase() === release.linearIssueId.toUpperCase()
    ) {
      score += 80;
      reasons.push(`linear ${hints.linearIssueId}`);
    }
  }

  if (provider === "vercel" || provider === "webhook") {
    if (
      hints.vercelDeploymentId &&
      release.vercelDeploymentId &&
      hints.vercelDeploymentId === release.vercelDeploymentId
    ) {
      score += 90;
      reasons.push(`deployment ${hints.vercelDeploymentId}`);
    }
    if (
      hints.vercelProjectId &&
      release.vercelProjectId &&
      hints.vercelProjectId === release.vercelProjectId
    ) {
      score += 40;
      reasons.push("vercel project");
    }
  }

  if (score >= 80) {
    return { score, confidence: "strong", reason: reasons.join(", ") || "strong match" };
  }
  if (score >= 40) {
    return { score, confidence: "weak", reason: reasons.join(", ") || "weak match" };
  }
  return { score, confidence: "none", reason: "no overlapping identifiers" };
}

/**
 * Match provider event hints against the known release registry.
 * Requires at least a strong match (score >= 80) or an exact releaseId.
 */
export function matchReleaseCandidate(options: {
  provider: NativeProvider | "webhook" | "editor";
  hints: MatchHints;
  registry?: ReleaseRegistry;
  /** Minimum score to accept a non-exact match (default 80). */
  minScore?: number;
}): MatchResult {
  const registry = options.registry ?? defaultReleaseRegistry;
  const minScore = options.minScore ?? 80;
  const candidates = registry.list();

  if (options.hints.releaseId) {
    const exact = registry.get(options.hints.releaseId);
    if (exact) {
      return {
        status: "matched",
        release: exact,
        candidates: [exact],
        confidence: "exact",
        reason: `Exact releaseId ${exact.id}`,
      };
    }
    return {
      status: "unmatched",
      release: null,
      candidates: [],
      confidence: "none",
      reason: `releaseId "${options.hints.releaseId}" is not registered`,
    };
  }

  const scored = candidates
    .map((release) => {
      const result = scoreCandidate(release, options.provider, options.hints);
      return { release, ...result };
    })
    .filter((row) => row.score >= minScore)
    .sort((a, b) => b.score - a.score);

  if (scored.length === 0) {
    return {
      status: "unmatched",
      release: null,
      candidates: [],
      confidence: "none",
      reason:
        "No registered release candidate matched provider identifiers (repository/PR, Linear issue, or Vercel deployment).",
    };
  }

  const top = scored[0];
  const tied = scored.filter((row) => row.score === top.score);
  if (tied.length > 1) {
    return {
      status: "ambiguous",
      release: null,
      candidates: tied.map((row) => row.release),
      confidence: top.confidence,
      reason: `Ambiguous match across ${tied.map((row) => row.release.id).join(", ")}`,
    };
  }

  return {
    status: "matched",
    release: top.release,
    candidates: [top.release],
    confidence: top.confidence,
    reason: top.reason,
  };
}

/** Throw IntegrationError for unmatched/ambiguous results. */
export function assertMatchedRelease(match: MatchResult): ReleaseRef {
  if (match.status === "matched" && match.release) {
    return match.release;
  }
  if (match.status === "ambiguous") {
    throw new IntegrationError(
      "release_match_ambiguous",
      match.reason,
      422,
      {
        candidateIds: match.candidates.map((c) => c.id),
        confidence: match.confidence,
      }
    );
  }
  throw new IntegrationError(
    "release_match_unmatched",
    match.reason,
    422,
    { confidence: match.confidence }
  );
}
