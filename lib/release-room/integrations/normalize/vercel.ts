import type {
  IntegrationEvidenceOutcome,
  NormalizedEvidenceItem,
  ProviderEventEnvelope,
  SourceLink,
} from "../types";
import { IntegrationError } from "../types";
import { hashPayload } from "../secrets";

type Json = Record<string, unknown>;

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function asObj(value: unknown): Json | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Json)
    : null;
}

function deploymentOutcome(
  eventType: string,
  state: string | null
): IntegrationEvidenceOutcome {
  const normalized = (state ?? "").toLowerCase();
  if (
    eventType.includes("succeeded") ||
    eventType.includes("ready") ||
    normalized === "ready" ||
    normalized === "success"
  ) {
    return "pass";
  }
  if (
    eventType.includes("error") ||
    eventType.includes("failed") ||
    eventType.includes("canceled") ||
    normalized === "error" ||
    normalized === "failed" ||
    normalized === "canceled"
  ) {
    return "fail";
  }
  return "pending";
}

export interface VercelNormalizeInput {
  rawBody: string;
  deliveryId?: string | null;
  receivedAt?: string;
  releaseId?: string | null;
}

/**
 * Normalize Vercel deployment lifecycle webhook events into evidence.
 * Supported types: deployment.*, deployment-status, project.deployment.*
 */
export function normalizeVercelEvent(
  input: VercelNormalizeInput
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
  const eventType =
    asString(payload.type) ??
    asString(payload.event) ??
    "deployment";
  const payloadInner = asObj(payload.payload) ?? payload;
  const deployment =
    asObj(payloadInner.deployment) ??
    asObj(payload.deployment) ??
    payloadInner;
  const deploymentId =
    asString(deployment?.id) ??
    asString(payloadInner.deploymentId) ??
    asString(payload.id) ??
    input.deliveryId ??
    "unknown";
  const url =
    asString(deployment?.url) ??
    asString(payloadInner.url) ??
    asString(deployment?.inspectorUrl);
  const name = asString(deployment?.name) ?? asString(payloadInner.name);
  const state =
    asString(deployment?.readyState) ??
    asString(deployment?.state) ??
    asString(payloadInner.state) ??
    asString(asObj(payloadInner.deployment)?.readyState);
  const target =
    asString(deployment?.target) ?? asString(payloadInner.target);
  const createdAt =
    asString(deployment?.createdAt) ??
    asString(payload.createdAt) ??
    asString(payloadInner.createdAt);

  let eventTimestamp = createdAt ?? now;
  if (createdAt && /^\d+$/.test(createdAt)) {
    eventTimestamp = new Date(Number(createdAt)).toISOString();
  } else if (typeof deployment?.createdAt === "number") {
    eventTimestamp = new Date(deployment.createdAt).toISOString();
  }

  if (!eventType.toLowerCase().includes("deployment") && !deployment?.id) {
    throw new IntegrationError(
      "vercel_event_unsupported",
      `Unsupported Vercel event type: ${eventType}`,
      400,
      { eventType }
    );
  }

  const deliveryId =
    input.deliveryId ??
    asString(payload.id) ??
    `vercel:${deploymentId}:${eventType}`;

  const sourceLinks: SourceLink[] = [];
  if (url) {
    const href = url.startsWith("http") ? url : `https://${url}`;
    sourceLinks.push({ label: "Deployment", url: href });
  }

  const outcome = deploymentOutcome(eventType.toLowerCase(), state);
  const evidence: NormalizedEvidenceItem[] = [
    {
      id: `vercel:deployment:${deploymentId}`,
      provider: "vercel",
      category: "deployment",
      outcome,
      title: name ? `Deploy ${name}` : `Deployment ${deploymentId}`,
      summary: `Vercel ${eventType} — state=${state ?? "unknown"}${target ? ` target=${target}` : ""}.`,
      externalId: deploymentId,
      sourceLinks: [...sourceLinks],
      collectedAt: now,
      metadata: {
        eventType,
        state,
        target,
        projectId: asString(payloadInner.projectId) ?? asString(deployment?.projectId),
      },
    },
  ];

  if (url && (outcome === "pass" || outcome === "pending")) {
    evidence.push({
      id: `vercel:visual:${deploymentId}`,
      provider: "vercel",
      category: "visual",
      outcome: outcome === "pass" ? "pass" : "pending",
      title: "Preview visual check",
      summary: `Preview available at ${url.startsWith("http") ? url : `https://${url}`}.`,
      externalId: `visual-${deploymentId}`,
      sourceLinks: [...sourceLinks],
      collectedAt: now,
    });
  }

  return {
    deliveryId,
    provider: "vercel",
    eventType,
    receivedAt: now,
    // Heuristic only — provider-ingest resolves against the release registry.
    releaseId: input.releaseId ?? null,
    eventTimestamp,
    payloadHash: hashPayload(input.rawBody),
    evidence,
    sourceLinks,
    metadata: {
      eventType,
      deploymentId,
      vercelDeploymentId: deploymentId,
      vercelProjectId:
        asString(payloadInner.projectId) ?? asString(deployment?.projectId),
      state,
      target,
    },
  };
}
