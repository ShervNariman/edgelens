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
 * Linear webhook receiver — Linear-Signature validation + issue/update normalization.
 * Replay protection via event timestamp freshness window.
 */
export async function POST(request: Request): Promise<Response> {
  const env = getIntegrationEnv();
  const rawBody = await request.text();

  try {
    const result = ingestProviderWebhook({
      provider: "linear",
      rawBody,
      signatureHeader: request.headers.get("linear-signature"),
      deliveryId:
        request.headers.get("linear-delivery") ??
        request.headers.get("x-linear-delivery"),
      webhookTimestamp:
        request.headers.get("linear-timestamp") ??
        request.headers.get("x-linear-timestamp"),
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
          connections: defaultConnectionStateStore.get("linear"),
          recentAudit: defaultAuditStore.listByProvider("linear", 5),
        },
        { status: error.status }
      );
    }
    return NextResponse.json(
      {
        status: "rejected",
        code: "linear_webhook_internal_error",
        message: "Linear webhook ingestion failed.",
      },
      { status: 500 }
    );
  }
}

export async function GET(): Promise<Response> {
  const env = getIntegrationEnv();
  return NextResponse.json({
    ok: true,
    provider: "linear",
    configured: Boolean(env.linearWebhookSecret),
    signatureHeader: "Linear-Signature",
    supportedEvents: ["Issue.create", "Issue.update"],
    connection: defaultConnectionStateStore.get("linear"),
  });
}
