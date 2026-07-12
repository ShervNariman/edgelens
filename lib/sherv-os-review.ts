import type { ShervOSReviewSummary } from "@/lib/sherv-os-summary";

const REQUEST_TIMEOUT_MS = 60_000;

interface ShervOSGenerationResponse {
  output?: unknown;
  requestId?: unknown;
  routing?: {
    provider?: unknown;
    model?: unknown;
    capability?: unknown;
    usedFallback?: unknown;
  };
}

export interface ShervOSReviewResult {
  explanation: string;
  requestId?: string;
  routing?: {
    provider?: string;
    model?: string;
    capability?: string;
    usedFallback?: boolean;
  };
}

function readServerConfig() {
  const baseUrl = process.env.SHERV_OS_URL?.trim().replace(/\/$/, "");
  const projectId = process.env.SHERV_OS_PROJECT_ID?.trim();
  const projectKey = process.env.SHERV_OS_PROJECT_KEY?.trim();

  if (!baseUrl || !projectId || !projectKey) return null;
  return { baseUrl, projectId, projectKey };
}

function safeRouting(
  routing: ShervOSGenerationResponse["routing"],
): ShervOSReviewResult["routing"] {
  if (!routing) return undefined;

  return {
    ...(typeof routing.provider === "string"
      ? { provider: routing.provider }
      : {}),
    ...(typeof routing.model === "string" ? { model: routing.model } : {}),
    ...(typeof routing.capability === "string"
      ? { capability: routing.capability }
      : {}),
    ...(typeof routing.usedFallback === "boolean"
      ? { usedFallback: routing.usedFallback }
      : {}),
  };
}

export class ShervOSNotConfiguredError extends Error {
  constructor() {
    super("Sherv OS is not configured for this environment.");
    this.name = "ShervOSNotConfiguredError";
  }
}

export class ShervOSRequestError extends Error {
  constructor(message = "Sherv OS could not produce an explanation.") {
    super(message);
    this.name = "ShervOSRequestError";
  }
}

export async function requestShervOSReview(
  summary: ShervOSReviewSummary,
): Promise<ShervOSReviewResult> {
  const config = readServerConfig();
  if (!config) throw new ShervOSNotConfiguredError();

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${config.baseUrl}/v1/generate`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${config.projectKey}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
      signal: controller.signal,
      body: JSON.stringify({
        projectId: config.projectId,
        capability: "review",
        messages: [
          {
            role: "system",
            content:
              "You are the optional explanatory layer for EdgeLens. The deterministic EdgeLens report is the source of truth. Do not invent findings, scores, source code, DOM details, or accessibility claims. Explain only the supplied normalized report. Prioritize the most important risks, why they matter, and the next actions. Be concise, practical, and explicit about uncertainty. State that you did not inspect the source code.",
          },
          {
            role: "user",
            content: JSON.stringify(summary),
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new ShervOSRequestError();
    }

    const payload = (await response.json()) as ShervOSGenerationResponse;
    if (typeof payload.output !== "string" || !payload.output.trim()) {
      throw new ShervOSRequestError();
    }

    const routing = safeRouting(payload.routing);

    return {
      explanation: payload.output.trim(),
      ...(typeof payload.requestId === "string"
        ? { requestId: payload.requestId }
        : {}),
      ...(routing ? { routing } : {}),
    };
  } catch (error) {
    if (error instanceof ShervOSNotConfiguredError) throw error;
    if (error instanceof ShervOSRequestError) throw error;
    if (error instanceof Error && error.name === "AbortError") {
      throw new ShervOSRequestError(
        "Sherv OS timed out while explaining the report.",
      );
    }
    throw new ShervOSRequestError();
  } finally {
    clearTimeout(timeout);
  }
}
