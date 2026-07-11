/**
 * Environment-driven provider activation.
 * Real providers turn on when credentials are present; otherwise fixtures run.
 */

export interface IntegrationEnv {
  githubToken: string | null;
  githubOwner: string | null;
  githubRepo: string | null;
  linearApiKey: string | null;
  linearTeamId: string | null;
  vercelToken: string | null;
  vercelTeamId: string | null;
  vercelProjectId: string | null;
  webhookSecret: string | null;
  /** When true, always use fixtures even if credentials exist */
  forceFixtures: boolean;
}

function readEnv(name: string): string | null {
  const value = process.env[name];
  if (value == null) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function readBool(name: string, fallback = false): boolean {
  const raw = readEnv(name);
  if (raw == null) return fallback;
  return ["1", "true", "yes", "on"].includes(raw.toLowerCase());
}

/** Snapshot of integration-related environment variables. */
export function getIntegrationEnv(
  overrides?: Partial<IntegrationEnv>
): IntegrationEnv {
  const base: IntegrationEnv = {
    githubToken: readEnv("GITHUB_TOKEN") ?? readEnv("GH_TOKEN"),
    githubOwner: readEnv("GITHUB_OWNER"),
    githubRepo: readEnv("GITHUB_REPO"),
    linearApiKey: readEnv("LINEAR_API_KEY"),
    linearTeamId: readEnv("LINEAR_TEAM_ID"),
    vercelToken: readEnv("VERCEL_TOKEN"),
    vercelTeamId: readEnv("VERCEL_TEAM_ID"),
    vercelProjectId: readEnv("VERCEL_PROJECT_ID"),
    webhookSecret: readEnv("RELEASE_ROOM_WEBHOOK_SECRET"),
    forceFixtures: readBool("RELEASE_ROOM_FORCE_FIXTURES", false),
  };
  return { ...base, ...overrides };
}

export function githubLiveEnabled(env: IntegrationEnv = getIntegrationEnv()): boolean {
  return Boolean(env.githubToken) && !env.forceFixtures;
}

export function linearLiveEnabled(env: IntegrationEnv = getIntegrationEnv()): boolean {
  return Boolean(env.linearApiKey) && !env.forceFixtures;
}

export function vercelLiveEnabled(env: IntegrationEnv = getIntegrationEnv()): boolean {
  return Boolean(env.vercelToken) && !env.forceFixtures;
}

export function webhookConfigured(env: IntegrationEnv = getIntegrationEnv()): boolean {
  return Boolean(env.webhookSecret);
}

/** Summarize which providers are live vs fixture — safe for logs/UI (no secrets). */
export function describeProviderModes(
  env: IntegrationEnv = getIntegrationEnv()
): Record<"github" | "linear" | "vercel" | "webhook", "live" | "fixture" | "disabled"> {
  return {
    github: githubLiveEnabled(env) ? "live" : "fixture",
    linear: linearLiveEnabled(env) ? "live" : "fixture",
    vercel: vercelLiveEnabled(env) ? "live" : "fixture",
    webhook: webhookConfigured(env) ? "live" : "disabled",
  };
}
