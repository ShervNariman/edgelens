import { createAdaptersForEnv } from "./adapters";
import { getIntegrationEnv, type IntegrationEnv } from "./config";
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
}

/**
 * Refresh evidence for a release candidate from configured adapters.
 * With no credentials, fixtures populate immediately (seeded demo path).
 * With credentials, live providers activate without application code changes.
 */
export async function refreshReleaseEvidence(
  options: RefreshOptions = {}
): Promise<RefreshResult> {
  const env = options.env ?? getIntegrationEnv();
  const release = options.release ?? SEEDED_RELEASE;
  const now = options.now ?? (env.forceFixtures ? FIXTURE_NOW : new Date().toISOString());
  const adapters = options.adapters ?? createAdaptersForEnv(env);

  const ctx: AdapterContext = {
    release,
    now,
    forceFixture: options.forceFixture ?? env.forceFixtures,
    fetchImpl: options.fetchImpl,
  };

  const adapterResults: AdapterResult[] = [];
  for (const adapter of adapters) {
    adapterResults.push(await adapter.collect(ctx));
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
