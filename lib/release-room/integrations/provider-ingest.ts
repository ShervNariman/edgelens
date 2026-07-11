import {
  auditStatusFromErrorCode,
  defaultAuditStore,
  IntegrationAuditStore,
} from "./audit";
import {
  DEFAULT_WEBHOOK_MAX_AGE_SECONDS,
  DEFAULT_WEBHOOK_MAX_BODY_BYTES,
  getIntegrationEnv,
  type IntegrationEnv,
} from "./config";
import {
  ConnectionStateStore,
  defaultConnectionStateStore,
} from "./connection-state";
import { defaultIdempotencyStore, IdempotencyStore } from "./idempotency";
import { normalizeGitHubEvent } from "./normalize/github";
import { normalizeLinearEvent } from "./normalize/linear";
import { normalizeVercelEvent } from "./normalize/vercel";
import {
  assertBodyWithinLimit,
  assertEventFreshness,
  validateGitHubSignature,
  validateLinearSignature,
  validateVercelSignature,
} from "./secrets";
import type {
  IngestResult,
  IntegrationAuditRecord,
  NativeProvider,
  ProviderEventEnvelope,
} from "./types";
import { IntegrationError } from "./types";

export interface ProviderWebhookIngestInput {
  provider: NativeProvider;
  rawBody: string;
  /** Provider signature header value */
  signatureHeader: string | null | undefined;
  /** GitHub: X-GitHub-Delivery; Linear/Vercel optional delivery override */
  deliveryId?: string | null;
  /** GitHub: X-GitHub-Event */
  eventName?: string | null;
  /** Linear webhook timestamp header (ms since epoch or ISO) */
  webhookTimestamp?: string | null;
  /** Optional release linkage override */
  releaseId?: string | null;
  now?: string;
  env?: IntegrationEnv;
  store?: IdempotencyStore;
  auditStore?: IntegrationAuditStore;
  connectionStore?: ConnectionStateStore;
  /** Skip freshness check (tests) */
  skipFreshness?: boolean;
}

function envelopeToIngestResult(
  envelope: ProviderEventEnvelope,
  status: IngestResult["status"],
  message: string,
  audit: IntegrationAuditRecord
): IngestResult {
  return {
    status,
    eventId: envelope.deliveryId,
    evidence: envelope.evidence,
    message,
    envelope,
    audit,
  };
}

function recordRejection(options: {
  provider: NativeProvider;
  deliveryId: string;
  eventType: string;
  error: IntegrationError;
  now: string;
  auditStore: IntegrationAuditStore;
  connectionStore: ConnectionStateStore;
  releaseId?: string | null;
}): never {
  const status = auditStatusFromErrorCode(options.error.code);
  options.auditStore.append({
    provider: options.provider,
    deliveryId: options.deliveryId,
    eventType: options.eventType,
    status,
    receivedAt: options.now,
    message: options.error.message,
    releaseId: options.releaseId ?? null,
    evidenceIds: [],
    errorCode: options.error.code,
  });
  options.connectionStore.recordError({
    provider: options.provider,
    code: options.error.code,
    message: options.error.message,
    eventId: options.deliveryId,
    eventType: options.eventType,
    at: options.now,
  });
  throw options.error;
}

/**
 * Authenticated provider webhook ingest with signature validation,
 * delivery idempotency, replay protection, and audit/connection updates.
 */
export function ingestProviderWebhook(
  input: ProviderWebhookIngestInput
): IngestResult {
  const env = input.env ?? getIntegrationEnv();
  const now = input.now ?? new Date().toISOString();
  const store = input.store ?? defaultIdempotencyStore;
  const auditStore = input.auditStore ?? defaultAuditStore;
  const connectionStore = input.connectionStore ?? defaultConnectionStateStore;
  const maxBytes = env.webhookMaxBodyBytes || DEFAULT_WEBHOOK_MAX_BODY_BYTES;
  const maxAge = env.webhookMaxAgeSeconds || DEFAULT_WEBHOOK_MAX_AGE_SECONDS;

  try {
    assertBodyWithinLimit(input.rawBody, maxBytes);
  } catch (error) {
    if (error instanceof IntegrationError) {
      recordRejection({
        provider: input.provider,
        deliveryId: input.deliveryId ?? "unknown",
        eventType: input.eventName ?? "unknown",
        error,
        now,
        auditStore,
        connectionStore,
        releaseId: input.releaseId,
      });
    }
    throw error;
  }

  try {
    switch (input.provider) {
      case "github":
        validateGitHubSignature({
          body: input.rawBody,
          signatureHeader: input.signatureHeader,
          secret: env.githubWebhookSecret,
        });
        break;
      case "linear":
        validateLinearSignature({
          body: input.rawBody,
          signatureHeader: input.signatureHeader,
          secret: env.linearWebhookSecret,
        });
        break;
      case "vercel":
        validateVercelSignature({
          body: input.rawBody,
          signatureHeader: input.signatureHeader,
          secret: env.vercelWebhookSecret,
        });
        break;
    }
  } catch (error) {
    if (error instanceof IntegrationError) {
      recordRejection({
        provider: input.provider,
        deliveryId: input.deliveryId ?? "unknown",
        eventType: input.eventName ?? "unknown",
        error,
        now,
        auditStore,
        connectionStore,
        releaseId: input.releaseId,
      });
    }
    throw error;
  }

  let envelope: ProviderEventEnvelope;
  try {
    switch (input.provider) {
      case "github": {
        const deliveryId = input.deliveryId?.trim();
        if (!deliveryId) {
          throw new IntegrationError(
            "github_delivery_missing",
            "X-GitHub-Delivery header is required.",
            400
          );
        }
        const eventName = input.eventName?.trim();
        if (!eventName) {
          throw new IntegrationError(
            "github_event_missing",
            "X-GitHub-Event header is required.",
            400
          );
        }
        envelope = normalizeGitHubEvent({
          rawBody: input.rawBody,
          eventName,
          deliveryId,
          receivedAt: now,
          releaseId: input.releaseId,
        });
        break;
      }
      case "linear":
        envelope = normalizeLinearEvent({
          rawBody: input.rawBody,
          deliveryId: input.deliveryId,
          receivedAt: now,
          releaseId: input.releaseId,
          webhookTimestamp: input.webhookTimestamp,
        });
        break;
      case "vercel":
        envelope = normalizeVercelEvent({
          rawBody: input.rawBody,
          deliveryId: input.deliveryId,
          receivedAt: now,
          releaseId: input.releaseId,
        });
        break;
    }
  } catch (error) {
    if (error instanceof IntegrationError) {
      recordRejection({
        provider: input.provider,
        deliveryId: input.deliveryId ?? "unknown",
        eventType: input.eventName ?? "unknown",
        error,
        now,
        auditStore,
        connectionStore,
        releaseId: input.releaseId,
      });
    }
    throw error;
  }

  if (!input.skipFreshness) {
    try {
      assertEventFreshness({
        eventTimestamp: envelope.eventTimestamp,
        now,
        maxAgeSeconds: maxAge,
        // Linear/Vercel enforce timestamps when present; GitHub uses delivery id
        requireTimestamp: input.provider !== "github",
      });
    } catch (error) {
      if (error instanceof IntegrationError) {
        const audit = auditStore.append({
          provider: input.provider,
          deliveryId: envelope.deliveryId,
          eventType: envelope.eventType,
          status: "stale",
          receivedAt: now,
          message: error.message,
          releaseId: envelope.releaseId,
          evidenceIds: [],
          errorCode: error.code,
        });
        connectionStore.recordError({
          provider: input.provider,
          code: error.code,
          message: error.message,
          eventId: envelope.deliveryId,
          eventType: envelope.eventType,
          at: now,
        });
        throw new IntegrationError(
          error.code,
          error.message,
          error.status,
          { ...(error.details ?? {}), auditId: audit.id }
        );
      }
      throw error;
    }
  }

  const idempotencyKey = `${input.provider}:${envelope.deliveryId}`;
  const result = store.accept({
    eventId: idempotencyKey,
    provider: input.provider,
    releaseId: envelope.releaseId ?? "unknown",
    receivedAt: now,
    evidence: envelope.evidence,
    sourceLinks: envelope.sourceLinks,
  });

  const audit = auditStore.append({
    provider: input.provider,
    deliveryId: envelope.deliveryId,
    eventType: envelope.eventType,
    status: result.status === "duplicate" ? "duplicate" : "accepted",
    receivedAt: now,
    message: result.message,
    releaseId: envelope.releaseId,
    evidenceIds: envelope.evidence.map((item) => item.id),
    metadata: { payloadHash: envelope.payloadHash },
  });

  if (result.status === "accepted") {
    connectionStore.recordSuccess({
      provider: input.provider,
      eventId: envelope.deliveryId,
      eventType: envelope.eventType,
      at: now,
    });
  }

  return envelopeToIngestResult(envelope, result.status, result.message, audit);
}
