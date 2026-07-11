/**
 * Ingest webhook / editor evidence events into the live store (+ optional DB evidence).
 */

import { getDatabase } from "@/lib/db";
import { newId } from "@/lib/db/seed";
import { evaluateDecision } from "@/lib/policy/decision";
import type { EvidenceItem } from "@/lib/db/types";
import { appendLiveEvent, touchProvider } from "@/lib/live/store";
import type { IngestLiveEventInput, LiveEvent } from "@/lib/live/types";

export async function ingestLiveEvent(
  input: IngestLiveEventInput,
): Promise<{ event: LiveEvent; releaseId?: string }> {
  const at = new Date().toISOString();

  await touchProvider(input.provider, {
    success: true,
    mode: "live",
    at,
  });

  let releaseId = input.releaseId;

  if (input.evidence && input.releaseId) {
    const db = getDatabase();
    const release = await db.getRelease(input.releaseId);
    if (!release) {
      throw new Error(`Release candidate not found: ${input.releaseId}`);
    }

    const item: EvidenceItem = {
      id: newId("ev"),
      source: input.evidence.source,
      title: input.evidence.title,
      summary: input.evidence.summary,
      status: input.evidence.status,
      url: input.evidence.url,
      collectedAt: at,
    };

    await db.updateRelease(input.releaseId, (current) => {
      const evidence = [
        ...current.evidence.filter((row) => row.title !== item.title),
        item,
      ];
      return {
        ...current,
        evidence,
        decision: evaluateDecision(evidence),
        updatedAt: at,
      };
    });

    await db.appendAudit(input.releaseId, {
      actorEmail: input.actor ?? `${input.provider}@release-room.local`,
      action: "evidence.ingested",
      detail: `${input.kind}: ${item.title} → ${item.status}`,
    });

    releaseId = input.releaseId;
  }

  const event = await appendLiveEvent({
    at,
    kind: input.kind,
    provider: input.provider,
    releaseId,
    title: input.title,
    summary: input.summary,
    actor: input.actor ?? `${input.provider}@release-room.local`,
  });

  return { event, releaseId };
}
