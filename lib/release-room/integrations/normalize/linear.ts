import type {
  IntegrationEvidenceOutcome,
  NormalizedEvidenceItem,
  ProviderEventEnvelope,
  SourceLink,
} from "../types";
import { IntegrationError } from "../types";
import { hashPayload } from "../secrets";

type Json = Record<string, unknown>;

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function asObj(value: unknown): Json | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Json)
    : null;
}

function issueOutcome(
  action: string | null,
  state: string | null
): IntegrationEvidenceOutcome {
  const normalizedState = (state ?? "").toLowerCase();
  if (normalizedState === "canceled" || normalizedState === "cancelled") {
    return "fail";
  }
  if (normalizedState === "done" || normalizedState === "completed") {
    return "pass";
  }
  if (action === "remove" || action === "delete") return "fail";
  return "pending";
}

function extractAcceptanceSummary(description: string | null): {
  total: number;
  checked: number;
} {
  if (!description) return { total: 0, checked: 0 };
  const unchecked = (description.match(/^- \[ \]/gm) ?? []).length;
  const checked = (description.match(/^- \[x\]/gim) ?? []).length;
  return { total: unchecked + checked, checked };
}

export interface LinearNormalizeInput {
  rawBody: string;
  deliveryId?: string | null;
  receivedAt?: string;
  releaseId?: string | null;
  /** Optional webhook timestamp header for replay protection */
  webhookTimestamp?: string | null;
}

/**
 * Normalize Linear Issue create/update webhook payloads into evidence.
 */
export function normalizeLinearEvent(
  input: LinearNormalizeInput
): ProviderEventEnvelope {
  let payload: Json;
  try {
    payload = JSON.parse(input.rawBody) as Json;
  } catch {
    throw new IntegrationError(
      "webhook_payload_invalid",
      "Request body must be valid JSON.",
      400
    );
  }

  const now = input.receivedAt ?? new Date().toISOString();
  const action = asString(payload.action) ?? "update";
  const type = asString(payload.type) ?? "Issue";
  const data = asObj(payload.data);
  const issueId =
    asString(data?.id) ??
    asString(payload.issueId) ??
    input.deliveryId ??
    "unknown";
  const identifier = asString(data?.identifier) ?? issueId;
  const title = asString(data?.title) ?? `Linear ${identifier}`;
  const url = asString(data?.url);
  const state =
    asString(asObj(data?.state)?.name) ?? asString(data?.state);
  const description = asString(data?.description);
  const updatedAt =
    asString(data?.updatedAt) ??
    asString(payload.createdAt) ??
    asString(payload.updatedAt);
  const webhookTs = asString(input.webhookTimestamp);
  const eventTimestamp =
    webhookTs && /^\d+$/.test(webhookTs)
      ? new Date(Number(webhookTs)).toISOString()
      : webhookTs ?? updatedAt ?? now;

  if (type !== "Issue" && type !== "IssueUpdate" && !data) {
    throw new IntegrationError(
      "linear_event_unsupported",
      `Unsupported Linear event type: ${type}`,
      400,
      { type }
    );
  }

  const deliveryId =
    input.deliveryId ??
    asString(payload.webhookId) ??
    `linear:${issueId}:${action}:${updatedAt ?? now}`;

  const sourceLinks: SourceLink[] = [];
  if (url) sourceLinks.push({ label: "Linear issue", url });

  const acceptance = extractAcceptanceSummary(description);
  const evidence: NormalizedEvidenceItem[] = [
    {
      id: `linear:issue:${identifier}`,
      provider: "linear",
      category: "intent",
      outcome: issueOutcome(action, state),
      title: `${identifier}: ${title}`,
      summary: `Linear issue ${action} — state=${state ?? "unknown"}.`,
      externalId: identifier,
      sourceLinks: [...sourceLinks],
      collectedAt: now,
      metadata: {
        action,
        type,
        state,
        issueId,
      },
    },
  ];

  if (acceptance.total > 0) {
    evidence.push({
      id: `linear:acceptance:${identifier}`,
      provider: "linear",
      category: "intent",
      outcome:
        acceptance.checked === acceptance.total
          ? "pass"
          : acceptance.checked === 0
            ? "pending"
            : "pending",
      title: `Acceptance criteria (${acceptance.checked}/${acceptance.total})`,
      summary: `${acceptance.checked} of ${acceptance.total} acceptance checkboxes checked.`,
      externalId: `${identifier}:acceptance`,
      sourceLinks: [...sourceLinks],
      collectedAt: now,
      metadata: acceptance,
    });
  }

  return {
    deliveryId,
    provider: "linear",
    eventType: `${type}.${action}`,
    receivedAt: now,
    releaseId: input.releaseId ?? identifier,
    eventTimestamp,
    payloadHash: hashPayload(input.rawBody),
    evidence,
    sourceLinks,
    metadata: {
      action,
      type,
      identifier,
      issueId,
    },
  };
}
