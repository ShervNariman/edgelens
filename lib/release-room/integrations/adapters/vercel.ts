import {
  getIntegrationEnv,
  vercelLiveEnabled,
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

async function vercelFetch(
  path: string,
  token: string,
  fetchImpl: typeof fetch,
  teamId?: string | null
): Promise<Json> {
  const url = new URL(`https://api.vercel.com${path}`);
  if (teamId) url.searchParams.set("teamId", teamId);

  const response = await fetchImpl(url.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new IntegrationError(
      "vercel_api_error",
      "Vercel API request failed.",
      response.status >= 500 ? 502 : 400,
      { status: response.status, path }
    );
  }

  return (await response.json()) as Json;
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

/**
 * Vercel adapter — deployment and preview evidence.
 * Falls back to fixtures when VERCEL_TOKEN is absent.
 */
export class VercelAdapter implements EvidenceAdapter {
  readonly provider = "vercel" as const;

  constructor(private readonly env: IntegrationEnv = getIntegrationEnv()) {}

  isLiveConfigured(): boolean {
    return vercelLiveEnabled(this.env);
  }

  async collect(ctx: AdapterContext): Promise<AdapterResult> {
    const useFixture = ctx.forceFixture || !this.isLiveConfigured();
    if (useFixture) {
      const evidence = buildFixtureEvidence(ctx.release).filter(
        (item) => item.provider === "vercel"
      );
      return {
        provider: "vercel",
        mode: "fixture",
        evidence,
        note: "Vercel fixture adapter — no VERCEL_TOKEN configured.",
      };
    }

    try {
      const evidence = await this.collectLive(ctx);
      return {
        provider: "vercel",
        mode: "live",
        evidence,
        note: "Vercel live adapter refreshed deployment/preview evidence.",
      };
    } catch (error) {
      const message =
        error instanceof IntegrationError
          ? error.message
          : "Vercel live collection failed.";
      const now = ctx.now ?? new Date().toISOString();
      const fallback: NormalizedEvidenceItem = {
        id: `vercel:error:${ctx.release.id}`,
        provider: "vercel",
        category: "deployment",
        outcome: "fail",
        title: "Vercel adapter failure",
        summary: message,
        externalId: `error-${ctx.release.id}`,
        sourceLinks: [],
        collectedAt: now,
      };
      return {
        provider: "vercel",
        mode: "live",
        evidence: [fallback],
        note: "Vercel live adapter failed closed.",
      };
    }
  }

  private async collectLive(ctx: AdapterContext): Promise<NormalizedEvidenceItem[]> {
    const token = this.env.vercelToken;
    if (!token) {
      throw new IntegrationError("vercel_token_missing", "VERCEL_TOKEN missing.", 503);
    }

    const fetchImpl = ctx.fetchImpl ?? fetch;
    const now = ctx.now ?? new Date().toISOString();
    const projectId =
      ctx.release.vercelProjectId ?? this.env.vercelProjectId ?? undefined;
    const deploymentId = ctx.release.vercelDeploymentId;

    let deployment: Json;
    if (deploymentId) {
      deployment = await vercelFetch(
        `/v13/deployments/${deploymentId}`,
        token,
        fetchImpl,
        this.env.vercelTeamId
      );
    } else if (projectId) {
      const list = await vercelFetch(
        `/v6/deployments?projectId=${encodeURIComponent(projectId)}&limit=1`,
        token,
        fetchImpl,
        this.env.vercelTeamId
      );
      const deployments = Array.isArray(list.deployments)
        ? (list.deployments as Json[])
        : [];
      if (deployments.length === 0) {
        throw new IntegrationError(
          "vercel_deployment_missing",
          "No Vercel deployments found for project.",
          404
        );
      }
      deployment = deployments[0];
    } else {
      throw new IntegrationError(
        "vercel_target_missing",
        "Set VERCEL_PROJECT_ID or release.vercelDeploymentId.",
        400
      );
    }

    const id = asString(deployment.uid ?? deployment.id, deploymentId ?? "unknown");
    const state = asString(deployment.readyState ?? deployment.state, "UNKNOWN");
    const urlHost = asString(deployment.url);
    const previewUrl = urlHost
      ? urlHost.startsWith("http")
        ? urlHost
        : `https://${urlHost}`
      : "";
    const ready = state === "READY" || state === "ready";
    const errored =
      state === "ERROR" ||
      state === "error" ||
      state === "CANCELED" ||
      state === "canceled";

    return [
      {
        id: `vercel:deployment:${id}`,
        provider: "vercel",
        category: "deployment",
        outcome: ready ? "pass" : errored ? "fail" : "pending",
        title: ready
          ? "Preview deployment ready"
          : errored
            ? "Preview deployment failed"
            : "Preview deployment pending",
        summary: `Vercel deployment ${id} is ${state}.`,
        externalId: id,
        sourceLinks: previewUrl
          ? [{ label: "Preview", url: previewUrl }]
          : [],
        collectedAt: now,
        metadata: {
          state,
          target: asString(deployment.target, "preview"),
          projectId: asString(deployment.projectId, projectId ?? ""),
        },
      },
      {
        id: `vercel:visual:${id}`,
        provider: "vercel",
        category: "visual",
        outcome: ready ? "pass" : "skipped",
        title: ready ? "Preview visual check" : "Preview visual check skipped",
        summary: ready
          ? "Preview URL is available for visual verification."
          : "Skipped because the deployment is not READY.",
        externalId: `visual-${id}`,
        sourceLinks: previewUrl
          ? [{ label: "Preview URL", url: previewUrl }]
          : [],
        collectedAt: now,
      },
    ];
  }
}
