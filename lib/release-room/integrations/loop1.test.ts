import assert from "node:assert/strict";
import { describe, it, beforeEach } from "node:test";

import {
  ConnectionStateStore,
  GitHubCheckRunPublisher,
  IdempotencyStore,
  IntegrationAuditStore,
  IntegrationError,
  ReleaseRegistry,
  SEEDED_RELEASE,
  buildFixtureEvidence,
  buildSetupGuides,
  editorPayloadToEvidence,
  editorPayloadToWebhookBody,
  getIntegrationEnv,
  githubChecksKey,
  ingestProviderWebhook,
  ingestSignedWebhook,
  linearAcceptanceKey,
  matchReleaseCandidate,
  normalizeGitHubEvent,
  parseEditorEvidencePayload,
  refreshReleaseEvidence,
  runConnectionTests,
  signPayload,
  vercelVisualKey,
} from "./index";

const GITHUB_SECRET = "github-webhook-secret-key";
const LINEAR_SECRET = "linear-webhook-secret-key";
const VERCEL_SECRET = "vercel-webhook-secret-key";
const WEBHOOK_SECRET = "release-room-webhook-secret";

function envWithSecrets() {
  return getIntegrationEnv({
    githubWebhookSecret: GITHUB_SECRET,
    linearWebhookSecret: LINEAR_SECRET,
    vercelWebhookSecret: VERCEL_SECRET,
    webhookSecret: WEBHOOK_SECRET,
    evidenceSecret: WEBHOOK_SECRET,
    webhookMaxBodyBytes: 2048,
    webhookMaxAgeSeconds: 300,
    githubToken: null,
    linearApiKey: null,
    vercelToken: null,
    forceFixtures: false,
    githubOwner: null,
    githubRepo: null,
    githubAppId: null,
    githubAppInstallationId: null,
    githubAppPrivateKey: null,
    linearTeamId: null,
    vercelTeamId: null,
    vercelProjectId: null,
  });
}

describe("SHE-94 Loop 1 — evidence id parity", () => {
  it("read fixtures and webhook normalizers agree on canonical ids", () => {
    const fixture = buildFixtureEvidence(SEEDED_RELEASE);
    assert.ok(fixture.some((item) => item.id === "github:checks:42"));
    assert.ok(fixture.some((item) => item.id === linearAcceptanceKey("SHE-60")));
    assert.ok(fixture.some((item) => item.id === vercelVisualKey("dpl_fixture_001")));

    const now = "2026-07-11T12:00:00.000Z";
    const github = normalizeGitHubEvent({
      rawBody: JSON.stringify({
        action: "completed",
        repository: { full_name: "acme/release-room" },
        check_run: {
          id: 99,
          name: "lint",
          conclusion: "success",
          status: "completed",
          completed_at: now,
          pull_requests: [{ number: 42 }],
        },
      }),
      eventName: "check_run",
      deliveryId: "delivery-checks",
      receivedAt: now,
    });
    assert.equal(github.evidence[0]?.id, githubChecksKey(42));
  });
});

describe("SHE-94 Loop 1 — release matching", () => {
  it("matches GitHub repo+PR to the registered candidate", () => {
    const match = matchReleaseCandidate({
      provider: "github",
      hints: { repository: "acme/release-room", prNumber: 42 },
    });
    assert.equal(match.status, "matched");
    assert.equal(match.release?.id, "rc-demo-ready");
  });

  it("rejects unmatched provider events", () => {
    const env = envWithSecrets();
    const now = "2026-07-11T12:00:00.000Z";
    const body = JSON.stringify({
      action: "opened",
      repository: { full_name: "other/repo" },
      pull_request: {
        number: 999,
        title: "Unrelated",
        html_url: "https://github.com/other/repo/pull/999",
        state: "open",
        merged: false,
        updated_at: now,
      },
    });
    assert.throws(
      () =>
        ingestProviderWebhook({
          provider: "github",
          rawBody: body,
          signatureHeader: `sha256=${signPayload(body, GITHUB_SECRET)}`,
          deliveryId: "unmatched-1",
          eventName: "pull_request",
          now,
          env,
          store: new IdempotencyStore(),
          auditStore: new IntegrationAuditStore(),
          connectionStore: new ConnectionStateStore(env),
        }),
      (error: unknown) =>
        error instanceof IntegrationError &&
        error.code === "release_match_unmatched" &&
        error.status === 422
    );
  });

  it("rejects ambiguous matches instead of attaching to the wrong candidate", () => {
    const registry = new ReleaseRegistry([]);
    registry.register({
      id: "rc-a",
      repository: "acme/release-room",
      prNumber: 42,
    });
    registry.register({
      id: "rc-b",
      repository: "acme/release-room",
      prNumber: 42,
    });
    const match = matchReleaseCandidate({
      provider: "github",
      hints: { repository: "acme/release-room", prNumber: 42 },
      registry,
    });
    assert.equal(match.status, "ambiguous");
    assert.equal(match.candidates.length, 2);
  });
});

describe("SHE-94 Loop 1 — health vocabulary", () => {
  it("reports configured / connected / stale / degraded / failed truthfully", () => {
    const env = envWithSecrets();
    const store = new ConnectionStateStore(env);
    assert.equal(store.get("github").health, "configured");
    assert.equal(store.get("editor").health, "configured");

    store.recordSuccess({
      provider: "github",
      eventId: "e1",
      eventType: "pull_request",
      at: "2026-07-11T12:00:00.000Z",
    });
    assert.equal(store.get("github").health, "connected");

    store.refreshStale(60, "2026-07-11T12:05:00.000Z");
    assert.equal(store.get("github").health, "stale");

    store.recordError({
      provider: "linear",
      code: "linear_refresh_failed",
      message: "down",
      degraded: true,
    });
    assert.equal(store.get("linear").health, "degraded");

    store.recordError({
      provider: "vercel",
      code: "webhook_signature_mismatch",
      message: "bad sig",
    });
    assert.equal(store.get("vercel").health, "failed");
  });
});

describe("SHE-94 Loop 1 — setup permissions + connection tests", () => {
  it("exposes explicit required permissions per provider", () => {
    const guides = buildSetupGuides(envWithSecrets());
    assert.ok(guides.some((g) => g.provider === "github"));
    assert.ok(guides.some((g) => g.provider === "editor"));
    assert.ok(guides.every((g) => g.permissions.length > 0));
    assert.ok(
      guides
        .filter((g) => g.provider !== "githubChecksPublish")
        .every((g) => g.permissions.some((p) => p.severity === "required"))
    );
  });

  it("connection tests report not_configured when secrets are absent", async () => {
    const results = await runConnectionTests({
      env: getIntegrationEnv({
        githubToken: null,
        githubWebhookSecret: null,
        linearApiKey: null,
        linearWebhookSecret: null,
        vercelToken: null,
        vercelWebhookSecret: null,
        webhookSecret: null,
        evidenceSecret: null,
        forceFixtures: false,
        githubOwner: null,
        githubRepo: null,
        githubAppId: null,
        githubAppInstallationId: null,
        githubAppPrivateKey: null,
        linearTeamId: null,
        vercelTeamId: null,
        vercelProjectId: null,
        webhookMaxBodyBytes: 1024,
        webhookMaxAgeSeconds: 300,
      }),
    });
    assert.ok(results.every((r) => r.health === "not_configured"));
  });
});

describe("SHE-94 Loop 1 — editor evidence contract", () => {
  it("maps editor payloads onto NormalizedEvidenceItem with retry-safe ids", () => {
    const payload = parseEditorEvidencePayload({
      schemaVersion: 1,
      kind: "report",
      runId: "run_1",
      releaseId: "rc-demo-ready",
      editorAgent: "cursor",
      task: "SHE-94",
      checksRun: ["lint", "typecheck"],
      outcome: "reported",
      occurredAt: "2026-07-11T12:00:00.000Z",
    });
    const evidence = editorPayloadToEvidence(payload);
    assert.equal(evidence.id, "editor:run_1:report");
    assert.equal(evidence.provider, "editor");
    assert.equal(evidence.outcome, "pass");

    const body = editorPayloadToWebhookBody(payload);
    assert.equal(body.eventId, evidence.id);
    assert.equal(body.releaseId, "rc-demo-ready");
  });

  it("ingests editor evidence through the generic signed webhook path", () => {
    const env = envWithSecrets();
    const payload = parseEditorEvidencePayload({
      schemaVersion: 1,
      kind: "complete",
      runId: "run_2",
      releaseId: "rc-demo-ready",
      editorAgent: "codex",
      outcome: "completed",
      occurredAt: "2026-07-11T12:00:00.000Z",
    });
    const webhookBody = editorPayloadToWebhookBody(payload);
    const rawBody = JSON.stringify(webhookBody);
    const store = new IdempotencyStore();
    const first = ingestSignedWebhook({
      rawBody,
      signatureHeader: `sha256=${signPayload(rawBody, WEBHOOK_SECRET)}`,
      secret: WEBHOOK_SECRET,
      env,
      store,
      now: "2026-07-11T12:00:00.000Z",
    });
    const second = ingestSignedWebhook({
      rawBody,
      signatureHeader: `sha256=${signPayload(rawBody, WEBHOOK_SECRET)}`,
      secret: WEBHOOK_SECRET,
      env,
      store,
      now: "2026-07-11T12:00:00.000Z",
    });
    assert.equal(first.status, "accepted");
    assert.equal(second.status, "duplicate");
    assert.equal(first.evidence[0]?.provider, "editor");
  });
});

describe("SHE-94 Loop 1 — generic webhook parity", () => {
  it("rejects stale and oversized generic webhook payloads", () => {
    const env = envWithSecrets();
    const store = new IdempotencyStore();
    const staleBody = JSON.stringify({
      eventId: "stale-1",
      provider: "webhook",
      releaseId: "rc-demo-ready",
      title: "Stale",
      category: "operations",
      outcome: "pass",
      occurredAt: "2026-07-11T10:00:00.000Z",
    });
    assert.throws(
      () =>
        ingestSignedWebhook({
          rawBody: staleBody,
          signatureHeader: `sha256=${signPayload(staleBody, WEBHOOK_SECRET)}`,
          secret: WEBHOOK_SECRET,
          env,
          store,
          now: "2026-07-11T12:00:00.000Z",
        }),
      (error: unknown) =>
        error instanceof IntegrationError && error.code === "webhook_event_stale"
    );

    const big = "x".repeat(4096);
    assert.throws(
      () =>
        ingestSignedWebhook({
          rawBody: big,
          signatureHeader: `sha256=${signPayload(big, WEBHOOK_SECRET)}`,
          secret: WEBHOOK_SECRET,
          env,
          store,
          now: "2026-07-11T12:00:00.000Z",
        }),
      (error: unknown) =>
        error instanceof IntegrationError &&
        error.code === "webhook_payload_too_large"
    );
  });
});

describe("SHE-94 Loop 1 — provider-down + non-self-validating checks", () => {
  it("records degraded health when live refresh fails", async () => {
    const env = getIntegrationEnv({
      githubToken: "ghp_test",
      githubOwner: "acme",
      githubRepo: "release-room",
      linearApiKey: null,
      vercelToken: null,
      webhookSecret: null,
      evidenceSecret: null,
      forceFixtures: false,
      githubWebhookSecret: null,
      linearWebhookSecret: null,
      vercelWebhookSecret: null,
      githubAppId: null,
      githubAppInstallationId: null,
      githubAppPrivateKey: null,
      linearTeamId: null,
      vercelTeamId: null,
      vercelProjectId: null,
      webhookMaxBodyBytes: 1024,
      webhookMaxAgeSeconds: 300,
    });
    const connectionStore = new ConnectionStateStore(env);
    await refreshReleaseEvidence({
      release: SEEDED_RELEASE,
      env,
      connectionStore,
      fetchImpl: async () => {
        throw new Error("provider down");
      },
    });
    assert.equal(connectionStore.get("github").health, "degraded");
  });

  it("keeps GitHub check publishing behind the App adapter and unused by ingest", async () => {
    const env = envWithSecrets();
    const publisher = new GitHubCheckRunPublisher({
      ...env,
      githubAppId: null,
      githubAppInstallationId: null,
      githubAppPrivateKey: null,
    });
    assert.equal(publisher.isConfigured(), false);
    await assert.rejects(
      () =>
        publisher.publish({
          owner: "acme",
          repo: "release-room",
          headSha: "abc",
          name: "Release Room",
          status: "completed",
          conclusion: "success",
        }),
      (error: unknown) =>
        error instanceof IntegrationError &&
        error.code === "github_app_not_installed"
    );

    // Ingest path accepts without requiring App credentials.
    const now = "2026-07-11T12:00:00.000Z";
    const body = JSON.stringify({
      action: "opened",
      repository: { full_name: "acme/release-room" },
      pull_request: {
        number: 42,
        title: "x",
        html_url: "https://github.com/acme/release-room/pull/42",
        state: "open",
        merged: false,
        updated_at: now,
      },
    });
    const result = ingestProviderWebhook({
      provider: "github",
      rawBody: body,
      signatureHeader: `sha256=${signPayload(body, GITHUB_SECRET)}`,
      deliveryId: "no-publish",
      eventName: "pull_request",
      now,
      env,
      store: new IdempotencyStore(),
      auditStore: new IntegrationAuditStore(),
      connectionStore: new ConnectionStateStore(env),
    });
    assert.equal(result.status, "accepted");
  });
});

describe("SHE-94 Loop 1 — invalid / duplicate / happy matrix smoke", () => {
  let store: IdempotencyStore;
  let auditStore: IntegrationAuditStore;
  let connectionStore: ConnectionStateStore;
  const env = envWithSecrets();
  const now = "2026-07-11T12:00:00.000Z";

  beforeEach(() => {
    store = new IdempotencyStore();
    auditStore = new IntegrationAuditStore();
    connectionStore = new ConnectionStateStore(env);
  });

  it("happy path Linear + duplicate delivery", () => {
    const body = JSON.stringify({
      action: "update",
      type: "Issue",
      createdAt: now,
      data: {
        id: "iss_1",
        identifier: "SHE-60",
        title: "Loop 1",
        state: { name: "In Progress" },
        description: "- [x] Done\n- [ ] Todo\n",
        updatedAt: now,
      },
    });
    const input = {
      provider: "linear" as const,
      rawBody: body,
      signatureHeader: signPayload(body, LINEAR_SECRET),
      deliveryId: "lin-loop1",
      now,
      env,
      store,
      auditStore,
      connectionStore,
    };
    assert.equal(ingestProviderWebhook(input).status, "accepted");
    assert.equal(ingestProviderWebhook(input).status, "duplicate");
    assert.ok(
      auditStore.list().some((row) => row.status === "accepted")
    );
  });

  it("invalid Vercel signature fails closed", () => {
    assert.throws(
      () =>
        ingestProviderWebhook({
          provider: "vercel",
          rawBody: "{}",
          signatureHeader: "deadbeef",
          deliveryId: "bad",
          now,
          env,
          store,
          auditStore,
          connectionStore,
        }),
      (error: unknown) =>
        error instanceof IntegrationError &&
        (error.code === "webhook_signature_invalid" ||
          error.code === "webhook_signature_mismatch")
    );
  });
});
