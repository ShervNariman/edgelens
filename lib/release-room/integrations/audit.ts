import type {
  IntegrationAuditRecord,
  IntegrationAuditStatus,
  NativeProvider,
} from "./types";

/**
 * Append-only integration event audit log (in-memory for private MVP).
 * Durable storage can replace this later without changing the envelope contract.
 */
export class IntegrationAuditStore {
  private readonly records: IntegrationAuditRecord[] = [];

  append(
    input: Omit<IntegrationAuditRecord, "id"> & { id?: string }
  ): IntegrationAuditRecord {
    const record: IntegrationAuditRecord = {
      id: input.id ?? `audit:${input.provider}:${input.deliveryId}:${input.receivedAt}`,
      provider: input.provider,
      deliveryId: input.deliveryId,
      eventType: input.eventType,
      status: input.status,
      receivedAt: input.receivedAt,
      message: input.message,
      releaseId: input.releaseId,
      evidenceIds: input.evidenceIds,
      errorCode: input.errorCode,
      metadata: input.metadata,
    };
    this.records.push(record);
    return record;
  }

  list(limit = 100): IntegrationAuditRecord[] {
    return this.records.slice(-limit);
  }

  listByProvider(
    provider: NativeProvider | "webhook" | "editor",
    limit = 50
  ): IntegrationAuditRecord[] {
    return this.records.filter((row) => row.provider === provider).slice(-limit);
  }

  clear(): void {
    this.records.length = 0;
  }

  size(): number {
    return this.records.length;
  }
}

export const defaultAuditStore = new IntegrationAuditStore();

export function auditStatusFromErrorCode(
  code: string
): IntegrationAuditStatus {
  if (code === "webhook_event_stale") return "stale";
  if (code === "webhook_payload_too_large") return "oversized";
  if (code === "release_match_unmatched") return "unmatched";
  if (code === "release_match_ambiguous") return "ambiguous";
  return "rejected";
}
