/**
 * Release Room integrations (SHE-60).
 *
 * Adapter boundaries for GitHub, Linear, Vercel, and signed webhook ingestion.
 * Fixtures activate when credentials are absent; live providers activate via env.
 */

export {
  createAdaptersForEnv,
  createDefaultAdapters,
  FixtureAdapter,
  GitHubAdapter,
  LinearAdapter,
  VercelAdapter,
} from "./adapters";

export {
  describeProviderModes,
  getIntegrationEnv,
  githubLiveEnabled,
  linearLiveEnabled,
  vercelLiveEnabled,
  webhookConfigured,
  type IntegrationEnv,
} from "./config";

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

export { refreshReleaseEvidence, type RefreshOptions } from "./refresh";

export {
  assertSecretStrength,
  safeEqual,
  signPayload,
  validateWebhookSignature,
} from "./secrets";

export {
  INTEGRATION_EVIDENCE_CATEGORIES,
  INTEGRATION_PROVIDERS,
  IntegrationError,
  type AdapterContext,
  type AdapterResult,
  type EvidenceAdapter,
  type IngestResult,
  type IngestedEvent,
  type IntegrationEvidenceCategory,
  type IntegrationEvidenceOutcome,
  type IntegrationProvider,
  type NormalizedEvidenceItem,
  type RefreshResult,
  type ReleaseRef,
  type SourceLink,
} from "./types";

export { ingestSignedWebhook, type WebhookIngestInput } from "./webhook";
