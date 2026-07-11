import { createHmac, timingSafeEqual } from "node:crypto";
import { EditorBridgeError } from "@/lib/editor-bridge/types";

/** Timing-safe UTF-8 string compare. */
export function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a, "utf8");
  const right = Buffer.from(b, "utf8");
  if (left.length !== right.length) {
    timingSafeEqual(left, left);
    return false;
  }
  return timingSafeEqual(left, right);
}

/** HMAC-SHA256 hex digest of a UTF-8 body. */
export function signBody(body: string, secret: string): string {
  return createHmac("sha256", secret).update(body, "utf8").digest("hex");
}

/**
 * Canonical JSON for signing: stable key order via recursive sort.
 * Callers should pass the same string to sign and verify.
 */
export function canonicalizeJson(value: unknown): string {
  return JSON.stringify(sortValue(value));
}

function sortValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortValue);
  }
  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>).sort(
      ([a], [b]) => a.localeCompare(b),
    );
    const out: Record<string, unknown> = {};
    for (const [key, nested] of entries) {
      out[key] = sortValue(nested);
    }
    return out;
  }
  return value;
}

export function formatSignatureHeader(hex: string): string {
  return `sha256=${hex}`;
}

export function parseSignatureHeader(
  header: string | null | undefined,
): string | null {
  if (!header) {
    return null;
  }
  const trimmed = header.trim();
  const value = trimmed.startsWith("sha256=")
    ? trimmed.slice("sha256=".length).trim()
    : trimmed;
  return /^[a-f0-9]{64}$/i.test(value) ? value.toLowerCase() : null;
}

/**
 * Verify an evidence request signature. Fails closed.
 */
export function verifyEvidenceSignature(options: {
  body: string;
  signatureHeader: string | null | undefined;
  secret: string | null | undefined;
}): void {
  const { body, signatureHeader, secret } = options;

  if (!secret || secret.length < 16) {
    throw new EditorBridgeError(
      "evidence_secret_missing",
      "Editor/agent evidence ingestion is not configured.",
      503,
    );
  }

  const provided = parseSignatureHeader(signatureHeader);
  if (!provided) {
    throw new EditorBridgeError(
      "evidence_signature_missing",
      "Missing or malformed X-Release-Room-Signature header.",
      401,
    );
  }

  const expected = signBody(body, secret);
  if (!safeEqual(provided, expected.toLowerCase())) {
    throw new EditorBridgeError(
      "evidence_signature_invalid",
      "Invalid evidence signature.",
      401,
    );
  }
}
