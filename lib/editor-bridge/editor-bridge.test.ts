import { describe, expect, it, vi } from "vitest";
import {
  applyEditorEvidence,
  boundMetadata,
  canonicalizeJson,
  deliverEditorEvidence,
  EditorBridgeError,
  formatSignatureHeader,
  parseEditorEvidencePayload,
  redactSecrets,
  signBody,
  verifyEvidenceSignature,
} from "@/lib/editor-bridge";
import type { ReleaseCandidate } from "@/lib/db/types";

function baseRelease(): ReleaseCandidate {
  return {
    id: "rc_ready_001",
    workspaceId: "ws_demo_private",
    title: "Demo",
    version: "0.1.0",
    branch: "main",
    decision: "PENDING",
    summary: "Demo release",
    evidence: [],
    approvals: [],
    audit: [],
    createdAt: "2026-07-11T00:00:00.000Z",
    updatedAt: "2026-07-11T00:00:00.000Z",
  };
}

describe("redactSecrets", () => {
  it("redacts common secret shapes", () => {
    const input =
      "token ghp_abcdefghijklmnopqrstuvwx password=supersecret and sk-abc1234567890";
    const redacted = redactSecrets(input);
    expect(redacted).not.toContain("ghp_");
    expect(redacted).toContain("[REDACTED]");
  });
});

describe("boundMetadata", () => {
  it("keeps only bounded stringish entries", () => {
    const meta = boundMetadata({
      ok: "value",
      n: 3,
      skip: { nested: true },
      token: "ghp_abcdefghijklmnopqrstuvwx",
    });
    expect(meta?.ok).toBe("value");
    expect(meta?.n).toBe("3");
    expect(meta?.skip).toBeUndefined();
    expect(meta?.token).toContain("[REDACTED]");
  });
});

describe("parseEditorEvidencePayload", () => {
  it("accepts a valid report payload", () => {
    const payload = parseEditorEvidencePayload({
      schemaVersion: 1,
      kind: "report",
      runId: "run_abc",
      releaseId: "rc_ready_001",
      editorAgent: "cursor",
      outcome: "reported",
      task: "SHE-70",
      occurredAt: "2026-07-11T12:00:00.000Z",
    });
    expect(payload.editorAgent).toBe("cursor");
    expect(payload.task).toBe("SHE-70");
  });

  it("rejects mismatched kind/outcome pairs", () => {
    expect(() =>
      parseEditorEvidencePayload({
        schemaVersion: 1,
        kind: "start",
        runId: "run_abc",
        releaseId: "rc_ready_001",
        editorAgent: "cursor",
        outcome: "completed",
        occurredAt: "2026-07-11T12:00:00.000Z",
      }),
    ).toThrow(EditorBridgeError);
  });
});

describe("signing", () => {
  it("round-trips HMAC signatures", () => {
    const body = canonicalizeJson({ hello: "world", a: 1 });
    const secret = "test-evidence-secret-1234";
    const signature = signBody(body, secret);
    expect(() =>
      verifyEvidenceSignature({
        body,
        signatureHeader: formatSignatureHeader(signature),
        secret,
      }),
    ).not.toThrow();
  });

  it("rejects bad signatures", () => {
    expect(() =>
      verifyEvidenceSignature({
        body: "{}",
        signatureHeader: formatSignatureHeader("a".repeat(64)),
        secret: "test-evidence-secret-1234",
      }),
    ).toThrow(/Invalid evidence signature/);
  });
});

describe("applyEditorEvidence", () => {
  it("appends engineering evidence and audit entries", () => {
    const payload = parseEditorEvidencePayload({
      schemaVersion: 1,
      kind: "complete",
      runId: "run_xyz",
      releaseId: "rc_ready_001",
      editorAgent: "codex",
      model: "o3",
      task: "wire bridge",
      checksRun: ["lint", "test"],
      outcome: "completed",
      occurredAt: "2026-07-11T12:00:00.000Z",
    });

    const result = applyEditorEvidence(baseRelease(), payload);
    expect(result.duplicated).toBe(false);
    expect(result.evidence.source).toBe("editor");
    expect(result.release.decision).toBe("READY");
    expect(result.audit.action).toBe("editor.complete");
    expect(result.release.audit).toHaveLength(1);
  });

  it("is idempotent for the same runId+kind", () => {
    const payload = parseEditorEvidencePayload({
      schemaVersion: 1,
      kind: "fail",
      runId: "run_dup",
      releaseId: "rc_ready_001",
      editorAgent: "claude-code",
      outcome: "failed",
      occurredAt: "2026-07-11T12:00:00.000Z",
    });
    const first = applyEditorEvidence(baseRelease(), payload);
    const second = applyEditorEvidence(first.release, payload);
    expect(second.duplicated).toBe(true);
    expect(second.release.evidence).toHaveLength(1);
  });
});

describe("deliverEditorEvidence", () => {
  it("supports dry-run without network", async () => {
    const payload = parseEditorEvidencePayload({
      schemaVersion: 1,
      kind: "report",
      runId: "run_dry",
      releaseId: "rc_ready_001",
      editorAgent: "script",
      outcome: "reported",
      occurredAt: "2026-07-11T12:00:00.000Z",
    });

    const result = await deliverEditorEvidence({
      endpoint: "http://example.test/api/evidence",
      secret: "test-evidence-secret-1234",
      payload,
      dryRun: true,
      fetchImpl: vi.fn(),
    });

    expect(result.dryRun).toBe(true);
    expect(result.ok).toBe(true);
    expect(result.signatureHeader.startsWith("sha256=")).toBe(true);
  });

  it("retries transient failures then succeeds", async () => {
    const payload = parseEditorEvidencePayload({
      schemaVersion: 1,
      kind: "report",
      runId: "run_retry",
      releaseId: "rc_ready_001",
      editorAgent: "cursor",
      outcome: "reported",
      occurredAt: "2026-07-11T12:00:00.000Z",
    });

    let calls = 0;
    const fetchImpl = vi.fn(async () => {
      calls += 1;
      if (calls < 3) {
        return new Response(JSON.stringify({ ok: false }), { status: 503 });
      }
      return new Response(JSON.stringify({ ok: true }), { status: 201 });
    });

    const result = await deliverEditorEvidence({
      endpoint: "http://example.test/api/evidence",
      secret: "test-evidence-secret-1234",
      payload,
      fetchImpl,
      sleep: async () => undefined,
    });

    expect(result.ok).toBe(true);
    expect(calls).toBe(3);
  });
});
