import { NextResponse } from "next/server";

import {
  defaultAuditStore,
  defaultConnectionStateStore,
  describeProviderModes,
  getIntegrationEnv,
} from "@/lib/release-room/integrations";

export const runtime = "nodejs";

/**
 * Integration health probe — connection freshness, last event, actionable errors.
 */
export async function GET(): Promise<Response> {
  const env = getIntegrationEnv();
  const connections = defaultConnectionStateStore.refreshStale(
    env.webhookMaxAgeSeconds
  );

  return NextResponse.json({
    ok: true,
    modes: describeProviderModes(env),
    connections,
    recentAudit: defaultAuditStore.list(20),
    limits: {
      maxBodyBytes: env.webhookMaxBodyBytes,
      maxAgeSeconds: env.webhookMaxAgeSeconds,
    },
    routes: {
      github: "/api/integrations/github",
      linear: "/api/integrations/linear",
      vercel: "/api/integrations/vercel",
      webhook: "/api/integrations/webhook",
      refresh: "/api/integrations/refresh",
    },
    notes: {
      backfill:
        "Manual read adapters remain available via POST /api/integrations/refresh for recovery/backfill.",
      checkRunPublish:
        "GitHub check-run publishing requires GitHub App installation credentials and lives behind GitHubCheckRunPublisher.",
    },
  });
}
