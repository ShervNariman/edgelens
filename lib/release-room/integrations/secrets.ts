import { createHash, createHmac, timingSafeEqual } from "node:crypto";

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

/** HMAC-SHA1 hex digest (Vercel webhook signature scheme). */
export function signPayloadSha1(body: string, secret: string): string {
  return createHmac("sha1", secret).update(body, "utf8").digest("hex");
}

/** Stable SHA-256 of raw body for audit records (never stores the body). */
export function hashPayload(body: string): string {
  return createHash("sha256").update(body, "utf8").digest("hex");
}

function requireSecret(
  secret: string | null | undefined,
  code = "webhook_secret_missing"
): string {
  if (!secret) {
    throw new IntegrationError(
      code,
      "Webhook ingestion is not configured.",
      503
    );
  }
  return secret;
}

function requireSignatureHeader(
  signatureHeader: string | null | undefined
): string {
  if (!signatureHeader) {
    throw new IntegrationError(
      "webhook_signature_missing",
      "Missing signature header.",
      401
    );
  }
  return signatureHeader;
}

function parseSha256Signature(signatureHeader: string): string {
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
  return provided.toLowerCase();
}

/**
 * Validate a generic webhook signature header.
 * Accepts `sha256=<hex>` or bare hex. Fails closed on missing secret/signature.
 */
export function validateWebhookSignature(options: {
  body: string;
  signatureHeader: string | null | undefined;
  secret: string | null | undefined;
}): void {
  const secret = requireSecret(options.secret);
  const signatureHeader = requireSignatureHeader(options.signatureHeader);
  const provided = parseSha256Signature(signatureHeader);
  const expected = signPayload(options.body, secret);
  if (!safeEqual(provided, expected.toLowerCase())) {
    throw new IntegrationError(
      "webhook_signature_mismatch",
      "Invalid signature.",
      401
    );
  }
}

/**
 * Validate GitHub `X-Hub-Signature-256` (sha256=<hex> HMAC-SHA256 of raw body).
 */
export function validateGitHubSignature(options: {
  body: string;
  signatureHeader: string | null | undefined;
  secret: string | null | undefined;
}): void {
  const secret = requireSecret(options.secret, "github_webhook_secret_missing");
  const signatureHeader = requireSignatureHeader(options.signatureHeader);

  if (!signatureHeader.startsWith("sha256=")) {
    throw new IntegrationError(
      "webhook_signature_invalid",
      "GitHub signature must use sha256= prefix.",
      401
    );
  }

  const provided = parseSha256Signature(signatureHeader);
  const expected = signPayload(options.body, secret);
  if (!safeEqual(provided, expected.toLowerCase())) {
    throw new IntegrationError(
      "webhook_signature_mismatch",
      "Invalid signature.",
      401
    );
  }
}

/**
 * Validate Linear `Linear-Signature` (HMAC-SHA256 hex of raw body).
 */
export function validateLinearSignature(options: {
  body: string;
  signatureHeader: string | null | undefined;
  secret: string | null | undefined;
}): void {
  const secret = requireSecret(options.secret, "linear_webhook_secret_missing");
  const signatureHeader = requireSignatureHeader(options.signatureHeader);
  const provided = signatureHeader.trim().toLowerCase();

  if (!/^[a-f0-9]{64}$/i.test(provided)) {
    throw new IntegrationError(
      "webhook_signature_invalid",
      "Invalid signature.",
      401
    );
  }

  const expected = signPayload(options.body, secret);
  if (!safeEqual(provided, expected.toLowerCase())) {
    throw new IntegrationError(
      "webhook_signature_mismatch",
      "Invalid signature.",
      401
    );
  }
}

/**
 * Validate Vercel `x-vercel-signature` (HMAC-SHA1 hex of raw body).
 */
export function validateVercelSignature(options: {
  body: string;
  signatureHeader: string | null | undefined;
  secret: string | null | undefined;
}): void {
  const secret = requireSecret(options.secret, "vercel_webhook_secret_missing");
  const signatureHeader = requireSignatureHeader(options.signatureHeader);
  const provided = signatureHeader.trim().toLowerCase();

  if (!/^[a-f0-9]{40}$/i.test(provided)) {
    throw new IntegrationError(
      "webhook_signature_invalid",
      "Invalid signature.",
      401
    );
  }

  const expected = signPayloadSha1(options.body, secret);
  if (!safeEqual(provided, expected.toLowerCase())) {
    throw new IntegrationError(
      "webhook_signature_mismatch",
      "Invalid signature.",
      401
    );
  }
}

/**
 * Reject oversized webhook bodies before parsing.
 */
export function assertBodyWithinLimit(
  body: string,
  maxBytes: number
): void {
  const size = Buffer.byteLength(body, "utf8");
  if (size > maxBytes) {
    throw new IntegrationError(
      "webhook_payload_too_large",
      `Webhook payload exceeds ${maxBytes} bytes.`,
      413,
      { size, maxBytes }
    );
  }
}

/**
 * Replay protection: reject events whose provider timestamp is too old.
 */
export function assertEventFreshness(options: {
  eventTimestamp: string | null | undefined;
  now?: string | Date;
  maxAgeSeconds: number;
  /** When true, missing timestamps are rejected (stricter providers). */
  requireTimestamp?: boolean;
}): void {
  const { eventTimestamp, maxAgeSeconds, requireTimestamp = false } = options;
  if (!eventTimestamp) {
    if (requireTimestamp) {
      throw new IntegrationError(
        "webhook_event_stale",
        "Event timestamp is required for replay protection.",
        400
      );
    }
    return;
  }

  const eventMs = Date.parse(eventTimestamp);
  if (!Number.isFinite(eventMs)) {
    throw new IntegrationError(
      "webhook_event_stale",
      "Event timestamp is invalid.",
      400
    );
  }

  const nowMs =
    options.now instanceof Date
      ? options.now.getTime()
      : options.now
        ? Date.parse(options.now)
        : Date.now();

  const ageSeconds = (nowMs - eventMs) / 1000;
  if (ageSeconds > maxAgeSeconds) {
    throw new IntegrationError(
      "webhook_event_stale",
      `Event is older than ${maxAgeSeconds}s and was rejected.`,
      409,
      { ageSeconds, maxAgeSeconds }
    );
  }

  // Reject far-future clocks (clock skew / replay with forged future ts)
  if (ageSeconds < -maxAgeSeconds) {
    throw new IntegrationError(
      "webhook_event_stale",
      "Event timestamp is too far in the future.",
      409,
      { ageSeconds, maxAgeSeconds }
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
