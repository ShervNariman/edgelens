import { NextResponse } from "next/server";

import {
  defaultAuditStore,
  defaultConnectionStateStore,
  getIntegrationEnv,
  ingestSignedWebhook,
  IntegrationError,
} from "@/lib/release-room/integrations";

export const runtime = "nodejs";

/**
 * Generic signed webhook / evidence ingestion endpoint.
 * Requires header `x-release-room-signature: sha256=<hex>` over the raw body.
 * Enforces bounds, freshness, release matching, audit, and connection updates.
 */
export async function POST(request: Request): Promise<Response> {
  const env = getIntegrationEnv();
  const rawBody = await request.text();
  const signatureHeader =
    request.headers.get("x-release-room-signature") ??
    request.headers.get("x-signature");

  try {
    const result = ingestSignedWebhook({
      rawBody,
      signatureHeader,
      secret: env.webhookSecret ?? env.evidenceSecret,
      env,
    });

    const status = result.status === "duplicate" ? 200 : 202;
    return NextResponse.json(
      {
        ...result,
        connections: defaultConnectionStateStore.list(),
        recentAudit: defaultAuditStore.list(5),
      },
      { status }
    );
  } catch (error) {
    if (error instanceof IntegrationError) {
      return NextResponse.json(
        {
          status: "rejected",
          code: error.code,
          message: error.message,
          details: error.details,
          connections: defaultConnectionStateStore.list(),
          recentAudit: defaultAuditStore.list(5),
        },
        { status: error.status }
      );
    }

    return NextResponse.json(
      {
        status: "rejected",
        code: "webhook_internal_error",
        message: "Webhook ingestion failed.",
      },
      { status: 500 }
    );
  }
}

export async function GET(): Promise<Response> {
  const env = getIntegrationEnv();
  return NextResponse.json({
    ok: true,
    configured: Boolean(env.webhookSecret || env.evidenceSecret),
    signatureHeader: "x-release-room-signature",
    notes: [
      "Requires registered releaseId (HTTP 422 when unmatched).",
      "Rejects stale/oversized payloads with actionable error codes.",
      "Editor CLI posts here with retry on 5xx/429.",
    ],
  });
}
