import { createAdaptersForEnv } from "./adapters";
import { getIntegrationEnv, type IntegrationEnv } from "./config";
import {
  ConnectionStateStore,
  defaultConnectionStateStore,
} from "./connection-state";
import { SEEDED_RELEASE, FIXTURE_NOW } from "./fixtures";
import { IdempotencyStore } from "./idempotency";
import type {
  AdapterContext,
  AdapterResult,
  EvidenceAdapter,
  NormalizedEvidenceItem,
  RefreshResult,
  ReleaseRef,
} from "./types";

export interface RefreshOptions {
  release?: ReleaseRef;
  /** Existing evidence to upsert into */
  existing?: NormalizedEvidenceItem[];
  env?: IntegrationEnv;
  adapters?: EvidenceAdapter[];
  now?: string;
  forceFixture?: boolean;
  fetchImpl?: typeof fetch;
  connectionStore?: ConnectionStateStore;
}

/**
 * Refresh evidence for a release candidate from configured adapters.
 * With no credentials, fixtures populate immediately (seeded demo path).
 * With credentials, live providers activate without application code changes.
 * Updates connection health on live adapter success/failure (SHE-94).
 */
export async function refreshReleaseEvidence(
  options: RefreshOptions = {}
): Promise<RefreshResult> {
  const env = options.env ?? getIntegrationEnv();
  const release = options.release ?? SEEDED_RELEASE;
  const now =
    options.now ?? (env.forceFixtures ? FIXTURE_NOW : new Date().toISOString());
  const adapters = options.adapters ?? createAdaptersForEnv(env);
  const connectionStore =
    options.connectionStore ?? defaultConnectionStateStore;

  const ctx: AdapterContext = {
    release,
    now,
    forceFixture: options.forceFixture ?? env.forceFixtures,
    fetchImpl: options.fetchImpl,
  };

  const adapterResults: AdapterResult[] = [];
  for (const adapter of adapters) {
    const result = await adapter.collect(ctx);
    adapterResults.push(result);

    if (adapter.provider === "fixture") continue;
    if (result.mode === "fixture") continue;

    const failed = result.evidence.some(
      (item) =>
        item.outcome === "fail" &&
        (item.id.includes(":error:") ||
          item.title.toLowerCase().includes("failure"))
    );
    if (failed) {
      connectionStore.recordError({
        provider: adapter.provider as "github" | "linear" | "vercel",
        code: `${adapter.provider}_refresh_failed`,
        message: result.note,
        eventId: `refresh:${release.id}`,
        eventType: "refresh",
        at: now,
        degraded: true,
      });
    } else if (adapter.isLiveConfigured()) {
      connectionStore.recordSuccess({
        provider: adapter.provider as "github" | "linear" | "vercel",
        eventId: `refresh:${release.id}`,
        eventType: "refresh",
        at: now,
      });
    }
  }

  const incoming = adapterResults.flatMap((result) => result.evidence);
  const { evidence, upsertedIds } = IdempotencyStore.upsertEvidence(
    options.existing ?? [],
    incoming
  );

  return {
    releaseId: release.id,
    refreshedAt: now,
    adapters: adapterResults,
    evidence,
    upsertedIds,
  };
}
