import { getIntegrationEnv, type IntegrationEnv } from "../config";
import type { EvidenceAdapter } from "../types";
import { FixtureAdapter } from "./fixture";
import { GitHubAdapter } from "./github";
import { LinearAdapter } from "./linear";
import { VercelAdapter } from "./vercel";

export { FixtureAdapter } from "./fixture";
export { GitHubAdapter } from "./github";
export { GitHubCheckRunPublisher } from "./github-checks-publish";
export { LinearAdapter } from "./linear";
export { VercelAdapter } from "./vercel";

/**
 * Build the default adapter set.
 * Each provider adapter self-selects live vs fixture based on env credentials.
 * No application code changes are required to activate real providers.
 */
export function createDefaultAdapters(
  env: IntegrationEnv = getIntegrationEnv()
): EvidenceAdapter[] {
  return [
    new GitHubAdapter(env),
    new LinearAdapter(env),
    new VercelAdapter(env),
  ];
}

/**
 * When forceFixtures is set, return a single aggregate fixture adapter.
 * Otherwise return per-provider adapters (each may still fall back to fixtures).
 */
export function createAdaptersForEnv(
  env: IntegrationEnv = getIntegrationEnv()
): EvidenceAdapter[] {
  if (env.forceFixtures) {
    return [new FixtureAdapter()];
  }
  return createDefaultAdapters(env);
}
