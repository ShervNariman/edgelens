/**
 * Environment-driven provider activation.
 * Real providers turn on when credentials are present; otherwise fixtures run.
 */

export interface IntegrationEnv {
  githubToken: string | null;
  githubOwner: string | null;
  githubRepo: string | null;
  /** Shared secret for X-Hub-Signature-256 validation */
  githubWebhookSecret: string | null;
  /** GitHub App credentials — required for check-run publishing writes */
  githubAppId: string | null;
  githubAppInstallationId: string | null;
  githubAppPrivateKey: string | null;
  linearApiKey: string | null;
  linearTeamId: string | null;
  linearWebhookSecret: string | null;
  vercelToken: string | null;
  vercelTeamId: string | null;
  vercelProjectId: string | null;
  vercelWebhookSecret: string | null;
  webhookSecret: string | null;
  /** Editor/agent evidence HMAC secret (falls back to webhookSecret) */
  evidenceSecret: string | null;
  /** Max accepted webhook body size in bytes (default 1 MiB) */
  webhookMaxBodyBytes: number;
  /** Reject provider events older than this many seconds (replay protection) */
  webhookMaxAgeSeconds: number;
  /** When true, always use fixtures even if credentials exist */
  forceFixtures: boolean;
}

export const DEFAULT_WEBHOOK_MAX_BODY_BYTES = 1_048_576;
export const DEFAULT_WEBHOOK_MAX_AGE_SECONDS = 300;

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

function readInt(name: string, fallback: number): number {
  const raw = readEnv(name);
  if (raw == null) return fallback;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

/** Snapshot of integration-related environment variables. */
export function getIntegrationEnv(
  overrides?: Partial<IntegrationEnv>
): IntegrationEnv {
  const base: IntegrationEnv = {
    githubToken: readEnv("GITHUB_TOKEN") ?? readEnv("GH_TOKEN"),
    githubOwner: readEnv("GITHUB_OWNER"),
    githubRepo: readEnv("GITHUB_REPO"),
    githubWebhookSecret: readEnv("GITHUB_WEBHOOK_SECRET"),
    githubAppId: readEnv("GITHUB_APP_ID"),
    githubAppInstallationId: readEnv("GITHUB_APP_INSTALLATION_ID"),
    githubAppPrivateKey: readEnv("GITHUB_APP_PRIVATE_KEY"),
    linearApiKey: readEnv("LINEAR_API_KEY"),
    linearTeamId: readEnv("LINEAR_TEAM_ID"),
    linearWebhookSecret: readEnv("LINEAR_WEBHOOK_SECRET"),
    vercelToken: readEnv("VERCEL_TOKEN"),
    vercelTeamId: readEnv("VERCEL_TEAM_ID"),
    vercelProjectId: readEnv("VERCEL_PROJECT_ID"),
    vercelWebhookSecret: readEnv("VERCEL_WEBHOOK_SECRET"),
    webhookSecret: readEnv("RELEASE_ROOM_WEBHOOK_SECRET"),
    evidenceSecret:
      readEnv("RELEASE_ROOM_EVIDENCE_SECRET") ??
      readEnv("RELEASE_ROOM_WEBHOOK_SECRET"),
    webhookMaxBodyBytes: readInt(
      "RELEASE_ROOM_WEBHOOK_MAX_BODY_BYTES",
      DEFAULT_WEBHOOK_MAX_BODY_BYTES
    ),
    webhookMaxAgeSeconds: readInt(
      "RELEASE_ROOM_WEBHOOK_MAX_AGE_SECONDS",
      DEFAULT_WEBHOOK_MAX_AGE_SECONDS
    ),
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

export function githubWebhookConfigured(
  env: IntegrationEnv = getIntegrationEnv()
): boolean {
  return Boolean(env.githubWebhookSecret);
}

export function linearWebhookConfigured(
  env: IntegrationEnv = getIntegrationEnv()
): boolean {
  return Boolean(env.linearWebhookSecret);
}

export function vercelWebhookConfigured(
  env: IntegrationEnv = getIntegrationEnv()
): boolean {
  return Boolean(env.vercelWebhookSecret);
}

/**
 * GitHub App installation is required before check-run publishing can write.
 * Read adapters continue to use GITHUB_TOKEN independently.
 */
export function githubAppWriteConfigured(
  env: IntegrationEnv = getIntegrationEnv()
): boolean {
  return Boolean(
    env.githubAppId &&
      env.githubAppInstallationId &&
      env.githubAppPrivateKey &&
      !env.forceFixtures
  );
}

export function evidenceConfigured(
  env: IntegrationEnv = getIntegrationEnv()
): boolean {
  return Boolean(env.evidenceSecret || env.webhookSecret);
}

/** Summarize which providers are live vs fixture — safe for logs/UI (no secrets). */
export function describeProviderModes(
  env: IntegrationEnv = getIntegrationEnv()
): Record<
  | "github"
  | "linear"
  | "vercel"
  | "webhook"
  | "editor"
  | "githubWebhook"
  | "linearWebhook"
  | "vercelWebhook"
  | "githubChecksPublish",
  "live" | "fixture" | "disabled"
> {
  return {
    github: githubLiveEnabled(env) ? "live" : "fixture",
    linear: linearLiveEnabled(env) ? "live" : "fixture",
    vercel: vercelLiveEnabled(env) ? "live" : "fixture",
    webhook: webhookConfigured(env) ? "live" : "disabled",
    editor: evidenceConfigured(env) ? "live" : "disabled",
    githubWebhook: githubWebhookConfigured(env) ? "live" : "disabled",
    linearWebhook: linearWebhookConfigured(env) ? "live" : "disabled",
    vercelWebhook: vercelWebhookConfigured(env) ? "live" : "disabled",
    githubChecksPublish: githubAppWriteConfigured(env) ? "live" : "disabled",
  };
}
