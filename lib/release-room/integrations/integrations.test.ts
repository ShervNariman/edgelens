import assert from "node:assert/strict";
import { describe, it, beforeEach } from "node:test";

import {
  FixtureAdapter,
  GitHubAdapter,
  IdempotencyStore,
  IntegrationError,
  LinearAdapter,
  SEEDED_BLOCKED_RELEASE,
  SEEDED_RELEASE,
  VercelAdapter,
  buildFixtureEvidence,
  describeProviderModes,
  getIntegrationEnv,
  ingestSignedWebhook,
  refreshReleaseEvidence,
  signPayload,
  toDecisionEvidence,
  toUiEvidence,
  validateWebhookSignature,
} from "./index";

describe("integration config", () => {
  it("defaults to fixture modes when credentials are absent", () => {
    const env = getIntegrationEnv({
      githubToken: null,
      linearApiKey: null,
      vercelToken: null,
      webhookSecret: null,
      forceFixtures: false,
      githubOwner: null,
      githubRepo: null,
      linearTeamId: null,
      vercelTeamId: null,
      vercelProjectId: null,
    });
    const modes = describeProviderModes(env);
    assert.equal(modes.github, "fixture");
    assert.equal(modes.linear, "fixture");
    assert.equal(modes.vercel, "fixture");
    assert.equal(modes.webhook, "disabled");
  });

  it("activates live modes when credentials are present", () => {
    const env = getIntegrationEnv({
      githubToken: "ghp_test",
      linearApiKey: "lin_test",
      vercelToken: "vercel_test",
      webhookSecret: "super-secret-webhook-key",
      forceFixtures: false,
      githubOwner: "acme",
      githubRepo: "release-room",
      linearTeamId: null,
      vercelTeamId: null,
      vercelProjectId: "prj_1",
    });
    const modes = describeProviderModes(env);
    assert.equal(modes.github, "live");
    assert.equal(modes.linear, "live");
    assert.equal(modes.vercel, "live");
    assert.equal(modes.webhook, "live");
  });
});

describe("fixture adapters", () => {
  it("builds seeded ready evidence with source links", () => {
    const evidence = buildFixtureEvidence(SEEDED_RELEASE);
    assert.ok(evidence.length >= 6);
    assert.ok(evidence.every((item) => item.sourceLinks.length > 0));
    assert.ok(evidence.some((item) => item.provider === "github"));
    assert.ok(evidence.some((item) => item.provider === "linear"));
    assert.ok(evidence.some((item) => item.provider === "vercel"));
    assert.ok(evidence.every((item) => item.outcome !== "fail"));
  });

  it("builds blocked fixture evidence", () => {
    const evidence = buildFixtureEvidence(SEEDED_BLOCKED_RELEASE);
    assert.ok(evidence.some((item) => item.outcome === "fail"));
  });

  it("GitHub/Linear/Vercel adapters fall back to fixtures without credentials", async () => {
    const env = getIntegrationEnv({
      githubToken: null,
      linearApiKey: null,
      vercelToken: null,
      webhookSecret: null,
      forceFixtures: false,
      githubOwner: null,
      githubRepo: null,
      linearTeamId: null,
      vercelTeamId: null,
      vercelProjectId: null,
    });

    const github = await new GitHubAdapter(env).collect({
      release: SEEDED_RELEASE,
      forceFixture: false,
    });
    const linear = await new LinearAdapter(env).collect({
      release: SEEDED_RELEASE,
    });
    const vercel = await new VercelAdapter(env).collect({
      release: SEEDED_RELEASE,
    });

    assert.equal(github.mode, "fixture");
    assert.equal(linear.mode, "fixture");
    assert.equal(vercel.mode, "fixture");
    assert.ok(github.evidence.length > 0);
    assert.ok(linear.evidence.length > 0);
    assert.ok(vercel.evidence.length > 0);
  });
});

describe("refreshReleaseEvidence", () => {
  it("refreshes a seeded release from fixtures immediately", async () => {
    const result = await refreshReleaseEvidence({
      release: SEEDED_RELEASE,
      env: getIntegrationEnv({
        githubToken: null,
        linearApiKey: null,
        vercelToken: null,
        webhookSecret: null,
        forceFixtures: false,
        githubOwner: null,
        githubRepo: null,
        linearTeamId: null,
        vercelTeamId: null,
        vercelProjectId: null,
      }),
      now: "2026-07-11T12:00:00.000Z",
    });

    assert.equal(result.releaseId, SEEDED_RELEASE.id);
    assert.ok(result.evidence.length >= 6);
    assert.ok(result.upsertedIds.length >= 6);
    assert.equal(result.adapters.length, 3);
    assert.ok(result.adapters.every((adapter) => adapter.mode === "fixture"));
  });

  it("forceFixtures uses the aggregate fixture adapter", async () => {
    const result = await refreshReleaseEvidence({
      release: SEEDED_RELEASE,
      adapters: [new FixtureAdapter()],
      now: "2026-07-11T12:00:00.000Z",
    });
    assert.equal(result.adapters[0]?.provider, "fixture");
    assert.ok(result.evidence.length >= 6);
  });

  it("maps evidence into decision-engine and UI shapes", async () => {
    const result = await refreshReleaseEvidence({
      release: SEEDED_RELEASE,
      forceFixture: true,
      adapters: [new FixtureAdapter()],
    });
    const decision = toDecisionEvidence(result.evidence);
    const ui = toUiEvidence(result.evidence);
    assert.equal(decision.length, result.evidence.length);
    assert.equal(ui.length, result.evidence.length);
    assert.ok(decision.every((item) => item.category && item.outcome));
    assert.ok(ui.every((item) => item.group && item.sourceKind));
  });
});

describe("webhook ingestion", () => {
  const secret = "test-webhook-secret-key";
  let store: IdempotencyStore;

  beforeEach(() => {
    store = new IdempotencyStore();
  });

  it("rejects missing signatures without leaking the secret", () => {
    assert.throws(
      () =>
        validateWebhookSignature({
          body: "{}",
          signatureHeader: null,
          secret,
        }),
      (error: unknown) =>
        error instanceof IntegrationError &&
        error.code === "webhook_signature_missing" &&
        error.status === 401 &&
        !error.message.includes(secret)
    );
  });

  it("rejects mismatched signatures", () => {
    assert.throws(
      () =>
        validateWebhookSignature({
          body: '{"eventId":"1"}',
          signatureHeader: "sha256=" + "ab".repeat(32),
          secret,
        }),
      (error: unknown) =>
        error instanceof IntegrationError &&
        error.code === "webhook_signature_mismatch"
    );
  });

  it("accepts a signed event and is idempotent on replay", () => {
    const body = JSON.stringify({
      eventId: "evt_1",
      provider: "webhook",
      releaseId: "rc-demo-ready",
      title: "Manual QA passed",
      summary: "Founder signed off on preview.",
      category: "approval",
      outcome: "pass",
      externalId: "qa-1",
      sourceLinks: [
        { label: "Notes", url: "https://example.com/qa" },
      ],
    });
    const signature = `sha256=${signPayload(body, secret)}`;

    const first = ingestSignedWebhook({
      rawBody: body,
      signatureHeader: signature,
      secret,
      store,
      now: "2026-07-11T12:00:00.000Z",
    });
    const second = ingestSignedWebhook({
      rawBody: body,
      signatureHeader: signature,
      secret,
      store,
      now: "2026-07-11T12:05:00.000Z",
    });

    assert.equal(first.status, "accepted");
    assert.equal(second.status, "duplicate");
    assert.equal(first.evidence[0]?.sourceLinks[0]?.url, "https://example.com/qa");
    assert.equal(second.evidence[0]?.id, first.evidence[0]?.id);
    assert.equal(store.size(), 1);
  });

  it("fails closed when webhook secret is not configured", () => {
    assert.throws(
      () =>
        ingestSignedWebhook({
          rawBody: "{}",
          signatureHeader: "sha256=" + "ab".repeat(32),
          secret: null,
          store,
        }),
      (error: unknown) =>
        error instanceof IntegrationError &&
        error.code === "webhook_secret_missing" &&
        error.status === 503
    );
  });
});

describe("idempotent evidence upserts", () => {
  it("upserts by id without duplicating rows", () => {
    const first = buildFixtureEvidence(SEEDED_RELEASE);
    const updated = first.map((item) =>
      item.id === "github:pr:42"
        ? { ...item, summary: "Updated summary", outcome: "pass" as const }
        : item
    );
    const { evidence, upsertedIds } = IdempotencyStore.upsertEvidence(first, updated);
    assert.equal(evidence.length, first.length);
    assert.equal(upsertedIds.length, updated.length);
    assert.equal(
      evidence.find((item) => item.id === "github:pr:42")?.summary,
      "Updated summary"
    );
  });
});

describe("live adapters fail closed", () => {
  it("GitHub live mode returns fail evidence when fetch errors", async () => {
    const env = getIntegrationEnv({
      githubToken: "ghp_test",
      githubOwner: "acme",
      githubRepo: "release-room",
      linearApiKey: null,
      vercelToken: null,
      webhookSecret: null,
      forceFixtures: false,
      linearTeamId: null,
      vercelTeamId: null,
      vercelProjectId: null,
    });

    const adapter = new GitHubAdapter(env);
    const result = await adapter.collect({
      release: { ...SEEDED_RELEASE, prNumber: 42 },
      fetchImpl: async () => {
        throw new Error("network down");
      },
    });

    assert.equal(result.mode, "live");
    assert.equal(result.evidence[0]?.outcome, "fail");
    assert.ok(!JSON.stringify(result).includes("ghp_test"));
  });
});
