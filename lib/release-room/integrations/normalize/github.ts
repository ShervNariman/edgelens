import type {
  IntegrationEvidenceOutcome,
  NormalizedEvidenceItem,
  ProviderEventEnvelope,
  SourceLink,
} from "../types";
import { IntegrationError } from "../types";
import { hashPayload } from "../secrets";
import {
  githubCheckRunKey,
  githubChecksKey,
  githubCheckSuiteKey,
  githubPrKey,
  githubPushKey,
  githubReviewKey,
} from "../evidence-keys";

type Json = Record<string, unknown>;

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function asNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function asObj(value: unknown): Json | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Json)
    : null;
}

function outcomeFromConclusion(
  conclusion: string | null,
  status: string | null
): IntegrationEvidenceOutcome {
  const normalized = (conclusion ?? "").toLowerCase();
  if (normalized === "success" || normalized === "neutral" || normalized === "skipped") {
    return normalized === "skipped" ? "skipped" : "pass";
  }
  if (
    normalized === "failure" ||
    normalized === "cancelled" ||
    normalized === "timed_out" ||
    normalized === "action_required"
  ) {
    return "fail";
  }
  if ((status ?? "").toLowerCase() === "in_progress" || (status ?? "").toLowerCase() === "queued") {
    return "pending";
  }
  return "pending";
}

function reviewOutcome(state: string | null): IntegrationEvidenceOutcome {
  const normalized = (state ?? "").toLowerCase();
  if (normalized === "approved") return "pass";
  if (normalized === "changes_requested" || normalized === "dismissed") return "fail";
  return "pending";
}

function prOutcome(
  action: string | null,
  merged: boolean,
  state: string | null
): IntegrationEvidenceOutcome {
  if (merged || (action === "closed" && (state === "closed" || merged))) {
    return merged ? "pass" : "fail";
  }
  if (
    action === "opened" ||
    action === "synchronize" ||
    action === "reopened" ||
    state === "open"
  ) {
    return "pending";
  }
  return "pending";
}

function firstPrNumber(...candidates: unknown[]): number | null {
  for (const candidate of candidates) {
    if (typeof candidate === "number" && Number.isFinite(candidate)) return candidate;
    if (Array.isArray(candidate) && candidate.length > 0) {
      const first = asObj(candidate[0]);
      const number = asNumber(first?.number);
      if (number != null) return number;
    }
  }
  return null;
}

function repositorySlug(payload: Json): string | null {
  const repo = asObj(payload.repository);
  const full = asString(repo?.full_name);
  if (full) return full;
  const owner = asString(asObj(repo?.owner)?.login);
  const name = asString(repo?.name);
  if (owner && name) return `${owner}/${name}`;
  return null;
}

export interface GitHubNormalizeInput {
  rawBody: string;
  eventName: string;
  deliveryId: string;
  receivedAt?: string;
  releaseId?: string | null;
}

/**
 * Normalize GitHub webhook events into evidence items.
 * Supported: pull_request, check_suite, check_run, pull_request_review, push.
 * Check suite/run events that resolve a PR use canonical `github:checks:{pr}`.
 */
export function normalizeGitHubEvent(
  input: GitHubNormalizeInput
): ProviderEventEnvelope {
  let payload: Json;
  try {
    payload = JSON.parse(input.rawBody) as Json;
  } catch {
    throw new IntegrationError(
      "webhook_payload_invalid",
      "Request body must be valid JSON.",
      400
    );
  }

  const now = input.receivedAt ?? new Date().toISOString();
  const eventType = input.eventName || "unknown";
  const evidence: NormalizedEvidenceItem[] = [];
  const sourceLinks: SourceLink[] = [];
  let eventTimestamp: string | null = null;
  const releaseId = input.releaseId ?? null;
  const repository = repositorySlug(payload);
  let prNumber: number | null = null;
  let metadata: Record<string, unknown> = {
    event: eventType,
    action: asString(payload.action),
    repository,
  };

  switch (eventType) {
    case "pull_request": {
      const pr = asObj(payload.pull_request);
      const number = asNumber(pr?.number);
      prNumber = number;
      const htmlUrl = asString(pr?.html_url);
      const title = asString(pr?.title) ?? `Pull request #${number ?? "?"}`;
      const action = asString(payload.action);
      const merged = Boolean(pr?.merged);
      const state = asString(pr?.state);
      eventTimestamp =
        asString(pr?.updated_at) ?? asString(pr?.created_at) ?? now;
      if (htmlUrl) sourceLinks.push({ label: "Pull request", url: htmlUrl });
      evidence.push({
        id: githubPrKey(number ?? input.deliveryId),
        provider: "github",
        category: "code",
        outcome: prOutcome(action, merged, state),
        title: `PR #${number ?? "?"}: ${title}`,
        summary: `GitHub pull_request ${action ?? "event"} — state=${state ?? "unknown"}${merged ? " (merged)" : ""}.`,
        externalId: String(number ?? input.deliveryId),
        sourceLinks: [...sourceLinks],
        collectedAt: now,
        metadata: {
          action,
          state,
          merged,
          headSha: asString(asObj(pr?.head)?.sha),
          baseRef: asString(asObj(pr?.base)?.ref),
        },
      });
      metadata = { ...metadata, prNumber: number };
      break;
    }
    case "check_suite": {
      const suite = asObj(payload.check_suite);
      const id = asNumber(suite?.id) ?? input.deliveryId;
      const conclusion = asString(suite?.conclusion);
      const status = asString(suite?.status);
      const htmlUrl = asString(suite?.url);
      prNumber = firstPrNumber(suite?.pull_requests, payload.pull_requests);
      eventTimestamp =
        asString(suite?.updated_at) ?? asString(suite?.created_at) ?? now;
      if (htmlUrl) sourceLinks.push({ label: "Check suite", url: htmlUrl });
      evidence.push({
        id:
          prNumber != null
            ? githubChecksKey(prNumber)
            : githubCheckSuiteKey(id),
        provider: "github",
        category: "test",
        outcome: outcomeFromConclusion(conclusion, status),
        title:
          prNumber != null
            ? `Required checks (suite) for PR #${prNumber}`
            : `Check suite ${status ?? "updated"}`,
        summary: `GitHub check_suite conclusion=${conclusion ?? "none"} status=${status ?? "unknown"}.`,
        externalId: prNumber != null ? `checks-${prNumber}` : String(id),
        sourceLinks: [...sourceLinks],
        collectedAt: now,
        metadata: {
          action: asString(payload.action),
          conclusion,
          status,
          headSha: asString(suite?.head_sha),
          suiteId: id,
          prNumber,
        },
      });
      metadata = { ...metadata, prNumber, suiteId: id };
      break;
    }
    case "check_run": {
      const run = asObj(payload.check_run);
      const id = asNumber(run?.id) ?? input.deliveryId;
      const name = asString(run?.name) ?? "Check run";
      const conclusion = asString(run?.conclusion);
      const status = asString(run?.status);
      const htmlUrl = asString(run?.html_url);
      prNumber = firstPrNumber(run?.pull_requests, payload.pull_requests);
      eventTimestamp =
        asString(run?.completed_at) ?? asString(run?.started_at) ?? now;
      if (htmlUrl) sourceLinks.push({ label: name, url: htmlUrl });
      evidence.push({
        id:
          prNumber != null
            ? githubChecksKey(prNumber)
            : githubCheckRunKey(id),
        provider: "github",
        category: "test",
        outcome: outcomeFromConclusion(conclusion, status),
        title:
          prNumber != null
            ? `Required checks for PR #${prNumber}`
            : name,
        summary: `GitHub check_run ${asString(payload.action) ?? "event"} — ${status ?? "unknown"} / ${conclusion ?? "none"}.`,
        externalId: prNumber != null ? `checks-${prNumber}` : String(id),
        sourceLinks: [...sourceLinks],
        collectedAt: now,
        metadata: {
          action: asString(payload.action),
          conclusion,
          status,
          headSha: asString(run?.head_sha),
          checkName: name,
          checkRunId: id,
          prNumber,
        },
      });
      metadata = { ...metadata, prNumber, checkRunId: id };
      break;
    }
    case "pull_request_review": {
      const review = asObj(payload.review);
      const pr = asObj(payload.pull_request);
      const reviewId = asNumber(review?.id) ?? input.deliveryId;
      prNumber = asNumber(pr?.number);
      const state = asString(review?.state);
      const htmlUrl = asString(review?.html_url) ?? asString(pr?.html_url);
      eventTimestamp = asString(review?.submitted_at) ?? now;
      if (htmlUrl) sourceLinks.push({ label: "Review", url: htmlUrl });
      evidence.push({
        id: githubReviewKey(reviewId),
        provider: "github",
        category: "code",
        outcome: reviewOutcome(state),
        title: `PR review ${state ?? "submitted"}`,
        summary: `GitHub pull_request_review on #${prNumber ?? "?"} — ${state ?? "pending"}.`,
        externalId: String(reviewId),
        sourceLinks: [...sourceLinks],
        collectedAt: now,
        metadata: { state, prNumber, action: asString(payload.action) },
      });
      metadata = { ...metadata, prNumber };
      break;
    }
    case "push": {
      const ref = asString(payload.ref) ?? "unknown";
      const after = asString(payload.after) ?? input.deliveryId;
      const compare = asString(payload.compare);
      const commits = Array.isArray(payload.commits) ? payload.commits.length : 0;
      const headCommit = asObj(payload.head_commit);
      eventTimestamp = asString(headCommit?.timestamp) ?? now;
      const repo = asObj(payload.repository);
      if (!asString(headCommit?.timestamp) && typeof repo?.pushed_at === "number") {
        eventTimestamp = new Date(repo.pushed_at * 1000).toISOString();
      }
      if (compare) sourceLinks.push({ label: "Compare", url: compare });
      evidence.push({
        id: githubPushKey(after),
        provider: "github",
        category: "code",
        outcome: "pass",
        title: `Push to ${ref}`,
        summary: `GitHub push with ${commits} commit(s) to ${ref}.`,
        externalId: after,
        sourceLinks: [...sourceLinks],
        collectedAt: now,
        metadata: { ref, after, commits, forced: Boolean(payload.forced) },
      });
      metadata = {
        ...metadata,
        branch: ref.replace(/^refs\/heads\//, ""),
      };
      break;
    }
    default:
      throw new IntegrationError(
        "github_event_unsupported",
        `Unsupported GitHub event: ${eventType}`,
        400,
        { eventType }
      );
  }

  return {
    deliveryId: input.deliveryId,
    provider: "github",
    eventType,
    receivedAt: now,
    releaseId,
    eventTimestamp,
    payloadHash: hashPayload(input.rawBody),
    evidence,
    sourceLinks,
    metadata,
  };
}
