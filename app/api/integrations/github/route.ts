import { NextResponse } from "next/server";

import {
  getIntegrationEnv,
  ingestProviderWebhook,
  IntegrationError,
  defaultConnectionStateStore,
  defaultAuditStore,
} from "@/lib/release-room/integrations";

export const runtime = "nodejs";

/**
 * GitHub webhook receiver — X-Hub-Signature-256 + X-GitHub-Delivery idempotency.
 * Normalizes pull_request, check_suite, check_run, pull_request_review, push.
 */
export async function POST(request: Request): Promise<Response> {
  const env = getIntegrationEnv();
  const rawBody = await request.text();

  try {
    const result = ingestProviderWebhook({
      provider: "github",
      rawBody,
      signatureHeader: request.headers.get("x-hub-signature-256"),
      deliveryId: request.headers.get("x-github-delivery"),
      eventName: request.headers.get("x-github-event"),
      env,
    });

    const status = result.status === "duplicate" ? 200 : 202;
    return NextResponse.json(result, { status });
  } catch (error) {
    if (error instanceof IntegrationError) {
      return NextResponse.json(
        {
          status: "rejected",
          code: error.code,
          message: error.message,
          connections: defaultConnectionStateStore.get("github"),
          recentAudit: defaultAuditStore.listByProvider("github", 5),
        },
        { status: error.status }
      );
    }
    return NextResponse.json(
      {
        status: "rejected",
        code: "github_webhook_internal_error",
        message: "GitHub webhook ingestion failed.",
      },
      { status: 500 }
    );
  }
}

export async function GET(): Promise<Response> {
  const env = getIntegrationEnv();
  return NextResponse.json({
    ok: true,
    provider: "github",
    configured: Boolean(env.githubWebhookSecret),
    signatureHeader: "X-Hub-Signature-256",
    deliveryHeader: "X-GitHub-Delivery",
    eventHeader: "X-GitHub-Event",
    supportedEvents: [
      "pull_request",
      "check_suite",
      "check_run",
      "pull_request_review",
      "push",
    ],
    connection: defaultConnectionStateStore.get("github"),
  });
}
