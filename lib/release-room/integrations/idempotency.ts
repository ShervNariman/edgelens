import type { IngestedEvent, IngestResult, NormalizedEvidenceItem } from "./types";

/**
 * In-memory idempotent event store.
 * Duplicate eventIds return the prior accepted result without re-applying evidence.
 */
export class IdempotencyStore {
  private readonly events = new Map<string, IngestedEvent>();

  has(eventId: string): boolean {
    return this.events.has(eventId);
  }

  get(eventId: string): IngestedEvent | undefined {
    return this.events.get(eventId);
  }

  /**
   * Record an event if new. Returns duplicate status when already seen.
   */
  accept(event: IngestedEvent): IngestResult {
    const existing = this.events.get(event.eventId);
    if (existing) {
      return {
        status: "duplicate",
        eventId: event.eventId,
        evidence: existing.evidence,
        message: "Event already processed; returning prior evidence.",
      };
    }
    this.events.set(event.eventId, event);
    return {
      status: "accepted",
      eventId: event.eventId,
      evidence: event.evidence,
      message: "Event accepted.",
    };
  }

  /** Upsert evidence items by id into an existing list (last write wins). */
  static upsertEvidence(
    current: NormalizedEvidenceItem[],
    incoming: NormalizedEvidenceItem[]
  ): { evidence: NormalizedEvidenceItem[]; upsertedIds: string[] } {
    const byId = new Map(current.map((item) => [item.id, item]));
    const upsertedIds: string[] = [];
    for (const item of incoming) {
      byId.set(item.id, item);
      upsertedIds.push(item.id);
    }
    return { evidence: [...byId.values()], upsertedIds };
  }

  clear(): void {
    this.events.clear();
  }

  size(): number {
    return this.events.size;
  }
}

/** Process-wide default store for webhook ingestion in this runtime. */
export const defaultIdempotencyStore = new IdempotencyStore();
