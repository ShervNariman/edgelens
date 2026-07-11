import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { buildLiveSnapshot } from "@/lib/live";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Lightweight internal snapshot for the live founder command center.
 * Auth required — same private-owner boundary as /app.
 */
export async function GET(): Promise<Response> {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const snapshot = await buildLiveSnapshot();
    return NextResponse.json(snapshot, {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to build live snapshot";
    return NextResponse.json({ error: "snapshot_failed", message }, { status: 500 });
  }
}
