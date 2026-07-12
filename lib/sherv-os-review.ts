import type { AnalysisIssue, AnalysisReport } from "@/types/analysis";

const MAX_FINDINGS = 12;
const MAX_TEXT_LENGTH = 1_200;
const REQUEST_TIMEOUT_MS = 60_000;

export interface ShervOSReviewSummary {
  componentName: string | null;
  primaryType: string;
  score: number;
  totalIssues: number;
  criticalCount: number;
  warningCount: number;
  infoCount: number;
  statesCovered: number;
  statesTotal: number;
  missingRequiredStates: string[];
  findings: Array<{
    title: string;
    description: string;
    suggestion: string;
    severity: string;
    category: string;
    source: string;
  }>;
  previewDomChecked: boolean;
  previewViolationCount: number;
}

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

function boundedText(value: string): string {
  return value.slice(0, MAX_TEXT_LENGTH);
}

function normalizeFinding(issue: AnalysisIssue) {
  return {
    title: boundedText(issue.title),
    description: boundedText(issue.description),
    suggestion: boundedText(issue.suggestion),
    severity: issue.severity,
    category: issue.category,
    source: issue.source,
  };
}

/**
 * Builds a privacy-safe summary for the optional AI explanation layer.
 * Deliberately excludes sourceCode, filenames, locations, fix snippets, raw DOM,
 * accessibility trees, and parser diagnostics.
 */
export function buildShervOSReviewSummary(
  report: AnalysisReport,
): ShervOSReviewSummary {
  return {
    componentName: report.componentName,
    primaryType: report.primaryType,
    score: report.summary.score,
    totalIssues: report.summary.totalIssues,
    criticalCount: report.summary.criticalCount,
    warningCount: report.summary.warningCount,
    infoCount: report.summary.infoCount,
    statesCovered: report.summary.statesCovered,
    statesTotal: report.summary.statesTotal,
    missingRequiredStates: report.stateCoverage
      .filter((state) => state.required && !state.present)
      .map((state) => state.state),
    findings: report.issues.slice(0, MAX_FINDINGS).map(normalizeFinding),
    previewDomChecked: report.previewDomChecked,
    previewViolationCount: report.axeViolations.length,
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

    return {
      explanation: payload.output.trim(),
      ...(typeof payload.requestId === "string"
        ? { requestId: payload.requestId }
        : {}),
      ...(safeRouting(payload.routing)
        ? { routing: safeRouting(payload.routing) }
        : {}),
    };
  } catch (error) {
    if (error instanceof ShervOSNotConfiguredError) throw error;
    if (error instanceof ShervOSRequestError) throw error;
    if (error instanceof Error && error.name === "AbortError") {
      throw new ShervOSRequestError("Sherv OS timed out while explaining the report.");
    }
    throw new ShervOSRequestError();
  } finally {
    clearTimeout(timeout);
  }
}
