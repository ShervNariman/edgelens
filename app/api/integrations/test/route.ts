import { NextResponse } from "next/server";

import {
  defaultConnectionStateStore,
  getIntegrationEnv,
  runConnectionTests,
} from "@/lib/release-room/integrations";

export const runtime = "nodejs";

/**
 * Explicit connection tests for setup UX (SHE-94).
 * GET ?provider=github|linear|vercel|webhook|editor
 */
export async function GET(request: Request): Promise<Response> {
  const env = getIntegrationEnv();
  const url = new URL(request.url);
  const provider = url.searchParams.get("provider") ?? undefined;
  const results = await runConnectionTests({
    env,
    providers: provider ? [provider] : undefined,
  });

  for (const result of results) {
    defaultConnectionStateStore.recordProbe({
      provider: result.provider as
        | "github"
        | "linear"
        | "vercel"
        | "webhook"
        | "editor",
      health: result.health,
      message: result.message,
      at: result.checkedAt,
    });
  }

  return NextResponse.json({
    ok: results.every((r) => r.ok || r.health === "configured"),
    results,
    connections: defaultConnectionStateStore.list(),
  });
}

export async function POST(request: Request): Promise<Response> {
  const env = getIntegrationEnv();
  let providers: string[] | undefined;
  try {
    const body = (await request.json()) as { providers?: string[] };
    providers = body.providers;
  } catch {
    providers = undefined;
  }

  const results = await runConnectionTests({ env, providers });
  for (const result of results) {
    defaultConnectionStateStore.recordProbe({
      provider: result.provider as
        | "github"
        | "linear"
        | "vercel"
        | "webhook"
        | "editor",
      health: result.health,
      message: result.message,
      at: result.checkedAt,
    });
  }

  return NextResponse.json({
    ok: results.every((r) => r.ok || r.health === "configured"),
    results,
    connections: defaultConnectionStateStore.list(),
  });
}
