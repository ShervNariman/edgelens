import { createHmac, timingSafeEqual } from "node:crypto";

import { IntegrationError } from "./types";

/**
 * Timing-safe string comparison. Returns false when lengths differ.
 */
export function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a, "utf8");
  const right = Buffer.from(b, "utf8");
  if (left.length !== right.length) {
    // Still run a compare to reduce trivial timing leaks on length.
    timingSafeEqual(left, left);
    return false;
  }
  return timingSafeEqual(left, right);
}

/** HMAC-SHA256 hex digest of body with the given secret. */
export function signPayload(body: string, secret: string): string {
  return createHmac("sha256", secret).update(body, "utf8").digest("hex");
}

/**
 * Validate a webhook signature header.
 * Accepts `sha256=<hex>` or bare hex. Fails closed on missing secret/signature.
 */
export function validateWebhookSignature(options: {
  body: string;
  signatureHeader: string | null | undefined;
  secret: string | null | undefined;
}): void {
  const { body, signatureHeader, secret } = options;

  if (!secret) {
    throw new IntegrationError(
      "webhook_secret_missing",
      "Webhook ingestion is not configured.",
      503
    );
  }

  if (!signatureHeader) {
    throw new IntegrationError(
      "webhook_signature_missing",
      "Missing signature header.",
      401
    );
  }

  const provided = signatureHeader.startsWith("sha256=")
    ? signatureHeader.slice("sha256=".length).trim()
    : signatureHeader.trim();

  if (!/^[a-f0-9]{64}$/i.test(provided)) {
    throw new IntegrationError(
      "webhook_signature_invalid",
      "Invalid signature.",
      401
    );
  }

  const expected = signPayload(body, secret);
  if (!safeEqual(provided.toLowerCase(), expected.toLowerCase())) {
    throw new IntegrationError(
      "webhook_signature_mismatch",
      "Invalid signature.",
      401
    );
  }
}

/**
 * Validate that a configured secret meets a minimum length.
 * Used at boot / refresh to fail closed rather than run with weak secrets.
 */
export function assertSecretStrength(
  name: string,
  secret: string | null | undefined,
  minLength = 16
): void {
  if (!secret) {
    throw new IntegrationError(
      "secret_missing",
      `${name} is not configured.`,
      503
    );
  }
  if (secret.length < minLength) {
    throw new IntegrationError(
      "secret_too_weak",
      `${name} must be at least ${minLength} characters.`,
      503
    );
  }
}
