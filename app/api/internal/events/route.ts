import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth/session";
import { ingestLiveEvent } from "@/lib/live";
import { LIVE_PROVIDERS } from "@/lib/live/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  kind: z.enum(["webhook", "editor", "provider_refresh"]),
  provider: z.enum(LIVE_PROVIDERS),
  title: z.string().min(1).max(200),
  summary: z.string().min(1).max(2000),
  releaseId: z.string().min(1).optional(),
  actor: z.string().min(1).max(200).optional(),
  evidence: z
    .object({
      source: z.enum(["github", "linear", "vercel", "fixture", "manual"]),
      title: z.string().min(1).max(200),
      summary: z.string().min(1).max(2000),
      status: z.enum(["pass", "fail", "warn", "info"]),
      url: z.string().url().optional(),
    })
    .optional(),
});

/**
 * Ingest a webhook or editor evidence event into the live activity rail.
 * Protected by the same private-owner session as the dashboard.
 * Parallel SHE webhook/editor agents can later swap this for signed routes
 * while keeping the snapshot contract stable.
 */
export async function POST(request: Request): Promise<Response> {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid_body", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  try {
    const result = await ingestLiveEvent(parsed.data);
    return NextResponse.json({ ok: true, ...result }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to ingest event";
    const status = message.includes("not found") ? 404 : 500;
    return NextResponse.json({ error: "ingest_failed", message }, { status });
  }
}
