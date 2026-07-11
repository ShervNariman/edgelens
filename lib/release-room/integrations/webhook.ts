import { IdempotencyStore, defaultIdempotencyStore } from "./idempotency";
import { validateWebhookSignature } from "./secrets";
import type {
  IngestResult,
  IntegrationProvider,
  NormalizedEvidenceItem,
  SourceLink,
} from "./types";
import { IntegrationError } from "./types";

export interface WebhookIngestInput {
  /** Raw request body string (must match the signed bytes) */
  rawBody: string;
  /** Signature header value (sha256=<hex> or bare hex) */
  signatureHeader: string | null | undefined;
  /** Shared secret; typically RELEASE_ROOM_WEBHOOK_SECRET */
  secret: string | null | undefined;
  /** Optional override for receivedAt (tests) */
  now?: string;
  store?: IdempotencyStore;
}

interface WebhookPayload {
  eventId?: unknown;
  provider?: unknown;
  releaseId?: unknown;
  evidence?: unknown;
  sourceLinks?: unknown;
  title?: unknown;
  summary?: unknown;
  category?: unknown;
  outcome?: unknown;
  externalId?: unknown;
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function isProvider(value: string): value is IntegrationProvider {
  return (
    value === "github" ||
    value === "linear" ||
    value === "vercel" ||
    value === "webhook" ||
    value === "fixture"
  );
}

function parseEvidenceList(
  value: unknown,
  fallbackProvider: IntegrationProvider,
  now: string
): NormalizedEvidenceItem[] {
  if (!Array.isArray(value) || value.length === 0) {
    return [];
  }

  const items: NormalizedEvidenceItem[] = [];
  for (const entry of value) {
    if (!entry || typeof entry !== "object") continue;
    const row = entry as Record<string, unknown>;
    const externalId = asString(row.externalId) ?? asString(row.id);
    const title = asString(row.title);
    const summary = asString(row.summary) ?? title;
    const category = asString(row.category);
    const outcome = asString(row.outcome);
    if (!externalId || !title || !category || !outcome) continue;

    const providerRaw = asString(row.provider) ?? fallbackProvider;
    const provider = isProvider(providerRaw) ? providerRaw : fallbackProvider;

    const sourceLinks: SourceLink[] = [];
    if (Array.isArray(row.sourceLinks)) {
      for (const link of row.sourceLinks) {
        if (!link || typeof link !== "object") continue;
        const label = asString((link as Record<string, unknown>).label);
        const url = asString((link as Record<string, unknown>).url);
        if (label && url) sourceLinks.push({ label, url });
      }
    }

    items.push({
      id: asString(row.id) ?? `${provider}:${externalId}`,
      provider,
      category: category as NormalizedEvidenceItem["category"],
      outcome: outcome as NormalizedEvidenceItem["outcome"],
      title,
      summary: summary ?? title,
      externalId,
      sourceLinks,
      collectedAt: asString(row.collectedAt) ?? now,
      metadata:
        row.metadata && typeof row.metadata === "object"
          ? (row.metadata as Record<string, unknown>)
          : undefined,
    });
  }
  return items;
}

/**
 * Validate signature, parse payload, and ingest idempotently.
 * Secure failure: invalid signatures and malformed payloads reject without leaking secrets.
 */
export function ingestSignedWebhook(input: WebhookIngestInput): IngestResult {
  validateWebhookSignature({
    body: input.rawBody,
    signatureHeader: input.signatureHeader,
    secret: input.secret,
  });

  let payload: WebhookPayload;
  try {
    payload = JSON.parse(input.rawBody) as WebhookPayload;
  } catch {
    throw new IntegrationError(
      "webhook_payload_invalid",
      "Request body must be valid JSON.",
      400
    );
  }

  const eventId = asString(payload.eventId);
  const releaseId = asString(payload.releaseId);
  const providerRaw = asString(payload.provider) ?? "webhook";

  if (!eventId) {
    throw new IntegrationError(
      "webhook_event_id_missing",
      "eventId is required.",
      400
    );
  }
  if (!releaseId) {
    throw new IntegrationError(
      "webhook_release_id_missing",
      "releaseId is required.",
      400
    );
  }
  if (!isProvider(providerRaw)) {
    throw new IntegrationError(
      "webhook_provider_invalid",
      "provider is invalid.",
      400
    );
  }

  const now = input.now ?? new Date().toISOString();
  let evidence = parseEvidenceList(payload.evidence, providerRaw, now);

  // Allow a single evidence object encoded at the top level.
  if (evidence.length === 0) {
    const title = asString(payload.title);
    const externalId = asString(payload.externalId) ?? eventId;
    const category = asString(payload.category) ?? "operations";
    const outcome = asString(payload.outcome) ?? "pass";
    if (!title) {
      throw new IntegrationError(
        "webhook_evidence_missing",
        "Provide evidence[] or title/summary fields.",
        400
      );
    }
    evidence = [
      {
        id: `webhook:${externalId}`,
        provider: "webhook",
        category: category as NormalizedEvidenceItem["category"],
        outcome: outcome as NormalizedEvidenceItem["outcome"],
        title,
        summary: asString(payload.summary) ?? title,
        externalId,
        sourceLinks: [],
        collectedAt: now,
      },
    ];
  }

  const sourceLinks: SourceLink[] = [];
  if (Array.isArray(payload.sourceLinks)) {
    for (const link of payload.sourceLinks) {
      if (!link || typeof link !== "object") continue;
      const label = asString((link as Record<string, unknown>).label);
      const url = asString((link as Record<string, unknown>).url);
      if (label && url) sourceLinks.push({ label, url });
    }
  }

  // Attach top-level source links onto each evidence item when present.
  if (sourceLinks.length > 0) {
    evidence = evidence.map((item) => ({
      ...item,
      sourceLinks: item.sourceLinks.length > 0 ? item.sourceLinks : sourceLinks,
    }));
  }

  const store = input.store ?? defaultIdempotencyStore;
  return store.accept({
    eventId,
    provider: providerRaw,
    releaseId,
    receivedAt: now,
    evidence,
    sourceLinks,
  });
}
