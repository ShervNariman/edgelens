import { NextResponse } from "next/server";

import {
  defaultAuditStore,
  defaultConnectionStateStore,
  describeProviderModes,
  getIntegrationEnv,
  buildSetupGuides,
} from "@/lib/release-room/integrations";

export const runtime = "nodejs";

/**
 * Integration health probe — truthful configured/connected/stale/degraded/failed.
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
    setup: buildSetupGuides(env).map((guide) => ({
      provider: guide.provider,
      title: guide.title,
      configured: guide.configured,
      permissionCount: guide.permissions.length,
      connectionTest: guide.connectionTest,
    })),
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
      test: "/api/integrations/test",
      setup: "/api/integrations/setup",
    },
    notes: {
      backfill:
        "Manual read adapters remain available via POST /api/integrations/refresh for recovery/backfill.",
      checkRunPublish:
        "GitHub check-run publishing requires GitHub App installation credentials, lives behind GitHubCheckRunPublisher, and is non-self-validating.",
      matching:
        "Provider webhooks reject unmatched/ambiguous release candidates (HTTP 422) instead of silently attaching evidence.",
      health:
        "Health vocabulary: not_configured | configured | connected | stale | degraded | failed.",
    },
  });
}
