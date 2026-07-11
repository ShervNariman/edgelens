/**
 * Release Room integrations (SHE-60 + SHE-69).
 *
 * Adapter boundaries for GitHub, Linear, Vercel, and signed webhook ingestion.
 * SHE-69 adds authenticated provider webhook routes, event envelopes, audit,
 * connection freshness, and a GitHub App-gated check-run publish adapter.
 * Fixtures activate when credentials are absent; live providers activate via env.
 * Manual read adapters remain the recovery/backfill path via refresh.
 */

export {
  createAdaptersForEnv,
  createDefaultAdapters,
  FixtureAdapter,
  GitHubAdapter,
  GitHubCheckRunPublisher,
  LinearAdapter,
  VercelAdapter,
} from "./adapters";

export {
  auditStatusFromErrorCode,
  defaultAuditStore,
  IntegrationAuditStore,
} from "./audit";

export {
  DEFAULT_WEBHOOK_MAX_AGE_SECONDS,
  DEFAULT_WEBHOOK_MAX_BODY_BYTES,
  describeProviderModes,
  getIntegrationEnv,
  githubAppWriteConfigured,
  githubLiveEnabled,
  githubWebhookConfigured,
  linearLiveEnabled,
  linearWebhookConfigured,
  vercelLiveEnabled,
  vercelWebhookConfigured,
  webhookConfigured,
  type IntegrationEnv,
} from "./config";

export {
  ConnectionStateStore,
  defaultConnectionStateStore,
} from "./connection-state";

export {
  FIXTURE_NOW,
  SEEDED_BLOCKED_RELEASE,
  SEEDED_RELEASE,
  buildFixtureEvidence,
} from "./fixtures";

export {
  IdempotencyStore,
  defaultIdempotencyStore,
} from "./idempotency";

export {
  toDecisionEvidence,
  toUiEvidence,
  type UiEvidenceGroup,
  type UiEvidenceStatus,
} from "./map";

export { normalizeGitHubEvent } from "./normalize/github";
export { normalizeLinearEvent } from "./normalize/linear";
export { normalizeVercelEvent } from "./normalize/vercel";

export {
  ingestProviderWebhook,
  type ProviderWebhookIngestInput,
} from "./provider-ingest";

export { refreshReleaseEvidence, type RefreshOptions } from "./refresh";

export {
  assertBodyWithinLimit,
  assertEventFreshness,
  assertSecretStrength,
  hashPayload,
  safeEqual,
  signPayload,
  signPayloadSha1,
  validateGitHubSignature,
  validateLinearSignature,
  validateVercelSignature,
  validateWebhookSignature,
} from "./secrets";

export {
  INTEGRATION_EVIDENCE_CATEGORIES,
  INTEGRATION_PROVIDERS,
  IntegrationError,
  NATIVE_PROVIDERS,
  type AdapterContext,
  type AdapterResult,
  type ConnectionHealth,
  type ConnectionState,
  type EvidenceAdapter,
  type IngestResult,
  type IngestedEvent,
  type IntegrationAuditRecord,
  type IntegrationAuditStatus,
  type IntegrationEvidenceCategory,
  type IntegrationEvidenceOutcome,
  type IntegrationProvider,
  type NativeProvider,
  type NormalizedEvidenceItem,
  type ProviderEventEnvelope,
  type RefreshResult,
  type ReleaseRef,
  type SourceLink,
} from "./types";

export { ingestSignedWebhook, type WebhookIngestInput } from "./webhook";
