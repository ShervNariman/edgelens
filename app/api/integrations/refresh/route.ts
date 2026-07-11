import { NextResponse } from "next/server";

import {
  describeProviderModes,
  getIntegrationEnv,
  IntegrationError,
  refreshReleaseEvidence,
  SEEDED_BLOCKED_RELEASE,
  SEEDED_RELEASE,
  toDecisionEvidence,
  toUiEvidence,
  type ReleaseRef,
} from "@/lib/release-room/integrations";

export const runtime = "nodejs";

function parseRelease(body: unknown): ReleaseRef | undefined {
  if (!body || typeof body !== "object") return undefined;
  const row = body as Record<string, unknown>;
  const release = row.release;
  if (!release || typeof release !== "object") {
    // Allow top-level release fields or seeded selector.
    if (typeof row.seed === "string") {
      return row.seed === "blocked" ? SEEDED_BLOCKED_RELEASE : SEEDED_RELEASE;
    }
    if (typeof row.id === "string") {
      return {
        id: row.id,
        repository: typeof row.repository === "string" ? row.repository : undefined,
        branch: typeof row.branch === "string" ? row.branch : undefined,
        prNumber: typeof row.prNumber === "number" ? row.prNumber : undefined,
        linearIssueId:
          typeof row.linearIssueId === "string" ? row.linearIssueId : undefined,
        vercelProjectId:
          typeof row.vercelProjectId === "string" ? row.vercelProjectId : undefined,
        vercelDeploymentId:
          typeof row.vercelDeploymentId === "string"
            ? row.vercelDeploymentId
            : undefined,
        version: typeof row.version === "string" ? row.version : undefined,
      };
    }
    return undefined;
  }

  const r = release as Record<string, unknown>;
  if (typeof r.id !== "string") return undefined;
  return {
    id: r.id,
    repository: typeof r.repository === "string" ? r.repository : undefined,
    branch: typeof r.branch === "string" ? r.branch : undefined,
    prNumber: typeof r.prNumber === "number" ? r.prNumber : undefined,
    linearIssueId:
      typeof r.linearIssueId === "string" ? r.linearIssueId : undefined,
    vercelProjectId:
      typeof r.vercelProjectId === "string" ? r.vercelProjectId : undefined,
    vercelDeploymentId:
      typeof r.vercelDeploymentId === "string" ? r.vercelDeploymentId : undefined,
    version: typeof r.version === "string" ? r.version : undefined,
  };
}

/**
 * Refresh evidence for a release candidate.
 * Without credentials, fixtures populate immediately.
 * With credentials, live GitHub/Linear/Vercel adapters activate via env.
 */
export async function POST(request: Request): Promise<Response> {
  try {
    const body = await request.json().catch(() => ({}));
    const release = parseRelease(body) ?? SEEDED_RELEASE;
    const result = await refreshReleaseEvidence({ release });

    return NextResponse.json({
      ...result,
      providerModes: describeProviderModes(),
      decisionEvidence: toDecisionEvidence(result.evidence),
      uiEvidence: toUiEvidence(result.evidence),
    });
  } catch (error) {
    if (error instanceof IntegrationError) {
      return NextResponse.json(
        { code: error.code, message: error.message },
        { status: error.status }
      );
    }
    return NextResponse.json(
      { code: "refresh_failed", message: "Evidence refresh failed." },
      { status: 500 }
    );
  }
}

export async function GET(): Promise<Response> {
  const env = getIntegrationEnv();
  const result = await refreshReleaseEvidence({
    release: SEEDED_RELEASE,
    env,
  });

  return NextResponse.json({
    ...result,
    providerModes: describeProviderModes(env),
    decisionEvidence: toDecisionEvidence(result.evidence),
    uiEvidence: toUiEvidence(result.evidence),
  });
}
