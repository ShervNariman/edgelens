/**
 * Release Room integrations (SHE-60 + SHE-69 + SHE-94 Loop 1).
 *
 * Adapter boundaries for GitHub, Linear, Vercel, editor/agent, and signed webhook
 * ingestion. Loop 1 adds release matching, truthful health states, connection
 * tests, evidence-id parity, and retry-safe editor evidence contract.
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
  evidenceConfigured,
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
  runConnectionTests,
  type ConnectionTestResult,
} from "./connection-test";

export {
  editorPayloadToEvidence,
  editorPayloadToWebhookBody,
  parseEditorEvidencePayload,
  EDITOR_AGENTS,
  EDITOR_BRIDGE_LIMITS,
  EDITOR_EVENT_KINDS,
  EDITOR_OUTCOMES,
  type EditorAgent,
  type EditorEvidencePayload,
  type EditorEventKind,
  type EditorOutcome,
} from "./editor";

export {
  editorEvidenceKey,
  githubCheckRunKey,
  githubChecksKey,
  githubPrKey,
  githubPushKey,
  githubReviewKey,
  linearAcceptanceKey,
  linearIssueKey,
  vercelDeploymentKey,
  vercelVisualKey,
  webhookEvidenceKey,
} from "./evidence-keys";

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
  buildSetupGuides,
  type ProviderPermission,
  type ProviderSetupGuide,
} from "./permissions";

export {
  ingestProviderWebhook,
  type ProviderWebhookIngestInput,
} from "./provider-ingest";

export { refreshReleaseEvidence, type RefreshOptions } from "./refresh";

export {
  assertMatchedRelease,
  matchReleaseCandidate,
  type MatchHints,
  type MatchResult,
  type MatchStatus,
} from "./release-matching";

export {
  ReleaseRegistry,
  defaultReleaseRegistry,
} from "./release-registry";

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
  type ConnectionProvider,
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
