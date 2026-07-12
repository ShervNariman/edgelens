/**
 * Per-provider connection probes for Loop 1 setup UX.
 * Probes report configured / connected / failed without leaking secrets.
 */

import {
  getIntegrationEnv,
  githubLiveEnabled,
  githubWebhookConfigured,
  linearLiveEnabled,
  linearWebhookConfigured,
  vercelLiveEnabled,
  vercelWebhookConfigured,
  webhookConfigured,
  type IntegrationEnv,
} from "./config";
import type { ConnectionHealth } from "./types";

export interface ConnectionTestResult {
  provider: string;
  configured: boolean;
  health: ConnectionHealth;
  ok: boolean;
  latencyMs: number;
  message: string;
  checkedAt: string;
  details?: Record<string, unknown>;
}

async function timed<T>(
  fn: () => Promise<T>
): Promise<{ value: T; latencyMs: number }> {
  const start = Date.now();
  const value = await fn();
  return { value, latencyMs: Date.now() - start };
}

async function probeGitHub(
  env: IntegrationEnv,
  fetchImpl: typeof fetch
): Promise<ConnectionTestResult> {
  const checkedAt = new Date().toISOString();
  if (!githubLiveEnabled(env)) {
    return {
      provider: "github",
      configured: githubWebhookConfigured(env),
      health: githubWebhookConfigured(env) ? "configured" : "not_configured",
      ok: false,
      latencyMs: 0,
      message: githubWebhookConfigured(env)
        ? "Webhook secret configured; set GITHUB_TOKEN to probe live read access."
        : "GITHUB_TOKEN / GITHUB_WEBHOOK_SECRET not configured.",
      checkedAt,
    };
  }

  const owner = env.githubOwner;
  const repo = env.githubRepo;
  if (!owner || !repo) {
    return {
      provider: "github",
      configured: true,
      health: "degraded",
      ok: false,
      latencyMs: 0,
      message: "GITHUB_TOKEN set but GITHUB_OWNER / GITHUB_REPO missing.",
      checkedAt,
    };
  }

  try {
    const { value: response, latencyMs } = await timed(() =>
      fetchImpl(`https://api.github.com/repos/${owner}/${repo}`, {
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${env.githubToken}`,
          "X-GitHub-Api-Version": "2022-11-28",
          "User-Agent": "release-room-integrations",
        },
      })
    );
    if (!response.ok) {
      return {
        provider: "github",
        configured: true,
        health: "failed",
        ok: false,
        latencyMs,
        message: `GitHub API returned HTTP ${response.status}. Check token scopes (contents, pull requests, checks).`,
        checkedAt,
        details: { status: response.status },
      };
    }
    return {
      provider: "github",
      configured: true,
      health: "connected",
      ok: true,
      latencyMs,
      message: `Connected to ${owner}/${repo}.`,
      checkedAt,
    };
  } catch (error) {
    return {
      provider: "github",
      configured: true,
      health: "failed",
      ok: false,
      latencyMs: 0,
      message:
        error instanceof Error
          ? `GitHub probe failed: ${error.message}`
          : "GitHub probe failed.",
      checkedAt,
    };
  }
}

async function probeLinear(
  env: IntegrationEnv,
  fetchImpl: typeof fetch
): Promise<ConnectionTestResult> {
  const checkedAt = new Date().toISOString();
  if (!linearLiveEnabled(env)) {
    return {
      provider: "linear",
      configured: linearWebhookConfigured(env),
      health: linearWebhookConfigured(env) ? "configured" : "not_configured",
      ok: false,
      latencyMs: 0,
      message: linearWebhookConfigured(env)
        ? "Webhook secret configured; set LINEAR_API_KEY to probe live read access."
        : "LINEAR_API_KEY / LINEAR_WEBHOOK_SECRET not configured.",
      checkedAt,
    };
  }

  try {
    const { value: response, latencyMs } = await timed(() =>
      fetchImpl("https://api.linear.app/graphql", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: env.linearApiKey!,
        },
        body: JSON.stringify({ query: "{ viewer { id name } }" }),
      })
    );
    if (!response.ok) {
      return {
        provider: "linear",
        configured: true,
        health: "failed",
        ok: false,
        latencyMs,
        message: `Linear API returned HTTP ${response.status}. Check API key permissions.`,
        checkedAt,
        details: { status: response.status },
      };
    }
    const json = (await response.json()) as {
      data?: { viewer?: { id?: string } };
      errors?: unknown[];
    };
    if (json.errors?.length || !json.data?.viewer?.id) {
      return {
        provider: "linear",
        configured: true,
        health: "failed",
        ok: false,
        latencyMs,
        message: "Linear API key rejected or returned no viewer.",
        checkedAt,
      };
    }
    return {
      provider: "linear",
      configured: true,
      health: "connected",
      ok: true,
      latencyMs,
      message: "Connected to Linear API.",
      checkedAt,
    };
  } catch (error) {
    return {
      provider: "linear",
      configured: true,
      health: "failed",
      ok: false,
      latencyMs: 0,
      message:
        error instanceof Error
          ? `Linear probe failed: ${error.message}`
          : "Linear probe failed.",
      checkedAt,
    };
  }
}

async function probeVercel(
  env: IntegrationEnv,
  fetchImpl: typeof fetch
): Promise<ConnectionTestResult> {
  const checkedAt = new Date().toISOString();
  if (!vercelLiveEnabled(env)) {
    return {
      provider: "vercel",
      configured: vercelWebhookConfigured(env),
      health: vercelWebhookConfigured(env) ? "configured" : "not_configured",
      ok: false,
      latencyMs: 0,
      message: vercelWebhookConfigured(env)
        ? "Webhook secret configured; set VERCEL_TOKEN to probe live read access."
        : "VERCEL_TOKEN / VERCEL_WEBHOOK_SECRET not configured.",
      checkedAt,
    };
  }

  try {
    const url = env.vercelTeamId
      ? `https://api.vercel.com/v2/user?teamId=${encodeURIComponent(env.vercelTeamId)}`
      : "https://api.vercel.com/v2/user";
    const { value: response, latencyMs } = await timed(() =>
      fetchImpl(url, {
        headers: {
          Authorization: `Bearer ${env.vercelToken}`,
        },
      })
    );
    if (!response.ok) {
      return {
        provider: "vercel",
        configured: true,
        health: "failed",
        ok: false,
        latencyMs,
        message: `Vercel API returned HTTP ${response.status}. Check token permissions.`,
        checkedAt,
        details: { status: response.status },
      };
    }
    const projectNote = env.vercelProjectId
      ? ` Project ${env.vercelProjectId} configured.`
      : " Set VERCEL_PROJECT_ID for deployment backfill.";
    return {
      provider: "vercel",
      configured: true,
      health: env.vercelProjectId ? "connected" : "degraded",
      ok: Boolean(env.vercelProjectId),
      latencyMs,
      message: `Connected to Vercel API.${projectNote}`,
      checkedAt,
    };
  } catch (error) {
    return {
      provider: "vercel",
      configured: true,
      health: "failed",
      ok: false,
      latencyMs: 0,
      message:
        error instanceof Error
          ? `Vercel probe failed: ${error.message}`
          : "Vercel probe failed.",
      checkedAt,
    };
  }
}

function probeWebhook(env: IntegrationEnv): ConnectionTestResult {
  const checkedAt = new Date().toISOString();
  const configured = webhookConfigured(env);
  const evidenceConfigured = Boolean(env.evidenceSecret);
  if (!configured && !evidenceConfigured) {
    return {
      provider: "webhook",
      configured: false,
      health: "not_configured",
      ok: false,
      latencyMs: 0,
      message:
        "RELEASE_ROOM_WEBHOOK_SECRET / RELEASE_ROOM_EVIDENCE_SECRET not configured.",
      checkedAt,
    };
  }
  const secret = env.webhookSecret ?? env.evidenceSecret ?? "";
  if (secret.length < 16) {
    return {
      provider: "webhook",
      configured: true,
      health: "failed",
      ok: false,
      latencyMs: 0,
      message: "Webhook/evidence secret must be at least 16 characters.",
      checkedAt,
    };
  }
  return {
    provider: "webhook",
    configured: true,
    health: "configured",
    ok: true,
    latencyMs: 0,
    message:
      "Signing secret present. Send a signed POST /api/integrations/webhook to mark connected.",
    checkedAt,
  };
}

function probeEditor(env: IntegrationEnv): ConnectionTestResult {
  const checkedAt = new Date().toISOString();
  const secret = env.evidenceSecret ?? env.webhookSecret;
  if (!secret) {
    return {
      provider: "editor",
      configured: false,
      health: "not_configured",
      ok: false,
      latencyMs: 0,
      message: "RELEASE_ROOM_EVIDENCE_SECRET not configured.",
      checkedAt,
    };
  }
  if (secret.length < 16) {
    return {
      provider: "editor",
      configured: true,
      health: "failed",
      ok: false,
      latencyMs: 0,
      message: "Evidence secret must be at least 16 characters.",
      checkedAt,
    };
  }
  return {
    provider: "editor",
    configured: true,
    health: "configured",
    ok: true,
    latencyMs: 0,
    message:
      "Editor evidence secret present. Use `npm run release-room -- report` to connect.",
    checkedAt,
  };
}

export async function runConnectionTests(options?: {
  env?: IntegrationEnv;
  providers?: string[];
  fetchImpl?: typeof fetch;
}): Promise<ConnectionTestResult[]> {
  const env = options?.env ?? getIntegrationEnv();
  const fetchImpl = options?.fetchImpl ?? fetch;
  const wanted = new Set(
    (options?.providers ?? ["github", "linear", "vercel", "webhook", "editor"]).map(
      (p) => p.toLowerCase()
    )
  );

  const results: ConnectionTestResult[] = [];
  if (wanted.has("github")) results.push(await probeGitHub(env, fetchImpl));
  if (wanted.has("linear")) results.push(await probeLinear(env, fetchImpl));
  if (wanted.has("vercel")) results.push(await probeVercel(env, fetchImpl));
  if (wanted.has("webhook")) results.push(probeWebhook(env));
  if (wanted.has("editor")) results.push(probeEditor(env));
  return results;
}
