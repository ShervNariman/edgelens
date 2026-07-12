/**
 * Canonical evidence identity helpers shared by read adapters and webhook normalizers.
 * Loop 1 (SHE-94): backfill and live paths MUST agree on these ids.
 */

/** GitHub pull request evidence. */
export function githubPrKey(prNumber: number | string): string {
  return `github:pr:${prNumber}`;
}

/** Aggregated required-checks evidence for a PR (read + live). */
export function githubChecksKey(prNumber: number | string): string {
  return `github:checks:${prNumber}`;
}

/** Fallback when a check event cannot be linked to a PR. */
export function githubCheckRunKey(runId: number | string): string {
  return `github:check_run:${runId}`;
}

export function githubCheckSuiteKey(suiteId: number | string): string {
  return `github:check_suite:${suiteId}`;
}

export function githubReviewKey(reviewId: number | string): string {
  return `github:review:${reviewId}`;
}

export function githubPushKey(sha: string): string {
  return `github:push:${sha}`;
}

/** Linear issue intent evidence. */
export function linearIssueKey(identifier: string): string {
  return `linear:issue:${identifier}`;
}

/** Linear acceptance-criteria evidence (canonical: linear:ac:ID). */
export function linearAcceptanceKey(identifier: string): string {
  return `linear:ac:${identifier}`;
}

/** Vercel deployment evidence. */
export function vercelDeploymentKey(deploymentId: string): string {
  return `vercel:deployment:${deploymentId}`;
}

/** Vercel preview/visual evidence (canonical: vercel:visual:ID). */
export function vercelVisualKey(deploymentId: string): string {
  return `vercel:visual:${deploymentId}`;
}

/** Editor/agent evidence (runId + kind). */
export function editorEvidenceKey(runId: string, kind: string): string {
  return `editor:${runId}:${kind}`;
}

export function webhookEvidenceKey(externalId: string): string {
  return `webhook:${externalId}`;
}
