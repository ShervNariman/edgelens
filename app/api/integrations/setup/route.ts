import { NextResponse } from "next/server";

import {
  buildSetupGuides,
  describeProviderModes,
  getIntegrationEnv,
  defaultReleaseRegistry,
} from "@/lib/release-room/integrations";

export const runtime = "nodejs";

/**
 * Setup UX payload — required permissions, env vars, and connection test hooks.
 */
export async function GET(): Promise<Response> {
  const env = getIntegrationEnv();
  const guides = buildSetupGuides(env);

  return NextResponse.json({
    ok: true,
    modes: describeProviderModes(env),
    guides,
    registeredReleases: defaultReleaseRegistry.list().map((r) => ({
      id: r.id,
      repository: r.repository,
      prNumber: r.prNumber,
      linearIssueId: r.linearIssueId,
      vercelDeploymentId: r.vercelDeploymentId,
    })),
    nextSteps: [
      "Copy required env vars from each guide into .env.local",
      "Grant the listed provider permissions",
      "Run GET /api/integrations/test (or per-provider ?provider=)",
      "Register release candidates before enabling live webhooks",
      "Confirm GET /api/integrations/health shows connected/configured states",
    ],
  });
}
