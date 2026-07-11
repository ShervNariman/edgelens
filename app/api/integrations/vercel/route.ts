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
 * Vercel webhook receiver — x-vercel-signature verification + deployment lifecycle.
 * Replay protection via event timestamp freshness window.
 */
export async function POST(request: Request): Promise<Response> {
  const env = getIntegrationEnv();
  const rawBody = await request.text();

  try {
    const result = ingestProviderWebhook({
      provider: "vercel",
      rawBody,
      signatureHeader: request.headers.get("x-vercel-signature"),
      deliveryId: request.headers.get("x-vercel-id"),
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
          connections: defaultConnectionStateStore.get("vercel"),
          recentAudit: defaultAuditStore.listByProvider("vercel", 5),
        },
        { status: error.status }
      );
    }
    return NextResponse.json(
      {
        status: "rejected",
        code: "vercel_webhook_internal_error",
        message: "Vercel webhook ingestion failed.",
      },
      { status: 500 }
    );
  }
}

export async function GET(): Promise<Response> {
  const env = getIntegrationEnv();
  return NextResponse.json({
    ok: true,
    provider: "vercel",
    configured: Boolean(env.vercelWebhookSecret),
    signatureHeader: "x-vercel-signature",
    supportedEvents: [
      "deployment.created",
      "deployment.succeeded",
      "deployment.error",
      "deployment.canceled",
      "deployment-status",
    ],
    connection: defaultConnectionStateStore.get("vercel"),
  });
}
