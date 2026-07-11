import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/db";
import { getEnv } from "@/lib/env";
import {
  applyEditorEvidence,
  EditorBridgeError,
  parseEditorEvidencePayload,
  verifyEvidenceSignature,
} from "@/lib/editor-bridge";

export const runtime = "nodejs";

function errorResponse(error: unknown): NextResponse {
  if (error instanceof EditorBridgeError) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: error.code,
          message: error.message,
          ...(error.details ? { details: error.details } : {}),
        },
      },
      { status: error.status },
    );
  }

  console.error("evidence ingest failed", error);
  return NextResponse.json(
    {
      ok: false,
      error: {
        code: "evidence_internal_error",
        message: "Unexpected evidence ingest failure.",
      },
    },
    { status: 500 },
  );
}

/**
 * Generic signed evidence endpoint for the editor/agent bridge.
 * Provider-neutral: Cursor, Codex, Claude Code, and local scripts all POST here.
 */
export async function POST(request: Request) {
  try {
    const env = getEnv();
    const rawBody = await request.text();
    if (!rawBody) {
      throw new EditorBridgeError(
        "evidence_body_empty",
        "Request body must be non-empty JSON.",
        400,
      );
    }

    verifyEvidenceSignature({
      body: rawBody,
      signatureHeader: request.headers.get("x-release-room-signature"),
      secret: env.RELEASE_ROOM_EVIDENCE_SECRET,
    });

    let parsedJson: unknown;
    try {
      parsedJson = JSON.parse(rawBody) as unknown;
    } catch {
      throw new EditorBridgeError(
        "evidence_body_invalid_json",
        "Request body must be valid JSON.",
        400,
      );
    }

    const payload = parseEditorEvidencePayload(parsedJson);
    const db = getDatabase();
    const release = await db.getRelease(payload.releaseId);
    if (!release) {
      throw new EditorBridgeError(
        "release_not_found",
        `Release candidate not found: ${payload.releaseId}`,
        404,
      );
    }

    const result = applyEditorEvidence(release, payload);
    const saved = result.duplicated
      ? release
      : await db.saveRelease(result.release);

    return NextResponse.json(
      {
        ok: true,
        duplicated: result.duplicated,
        releaseId: saved.id,
        decision: saved.decision,
        evidence: result.evidence,
        audit: result.audit,
      },
      { status: result.duplicated ? 200 : 201 },
    );
  } catch (error) {
    return errorResponse(error);
  }
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "release-room-editor-bridge",
    message:
      "POST signed editor/agent evidence payloads to this endpoint. See docs/editor-bridge.md.",
  });
}
