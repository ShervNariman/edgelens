import assert from "node:assert/strict";
import { describe, it, beforeEach } from "node:test";

import {
  ConnectionStateStore,
  GitHubCheckRunPublisher,
  IdempotencyStore,
  IntegrationAuditStore,
  IntegrationError,
  assertBodyWithinLimit,
  assertEventFreshness,
  getIntegrationEnv,
  ingestProviderWebhook,
  normalizeGitHubEvent,
  normalizeLinearEvent,
  normalizeVercelEvent,
  signPayload,
  signPayloadSha1,
  validateGitHubSignature,
  validateLinearSignature,
  validateVercelSignature,
} from "./index";

const GITHUB_SECRET = "github-webhook-secret-key";
const LINEAR_SECRET = "linear-webhook-secret-key";
const VERCEL_SECRET = "vercel-webhook-secret-key";

function envWithSecrets() {
  return getIntegrationEnv({
    githubWebhookSecret: GITHUB_SECRET,
    linearWebhookSecret: LINEAR_SECRET,
    vercelWebhookSecret: VERCEL_SECRET,
    webhookMaxBodyBytes: 1024,
    webhookMaxAgeSeconds: 300,
    githubToken: null,
    linearApiKey: null,
    vercelToken: null,
    webhookSecret: null,
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

describe("provider signature validators", () => {
  it("validates GitHub X-Hub-Signature-256", () => {
    const body = '{"action":"opened"}';
    const signature = `sha256=${signPayload(body, GITHUB_SECRET)}`;
    assert.doesNotThrow(() =>
      validateGitHubSignature({
        body,
        signatureHeader: signature,
        secret: GITHUB_SECRET,
      })
    );
  });

  it("rejects invalid GitHub signatures", () => {
    assert.throws(
      () =>
        validateGitHubSignature({
          body: "{}",
          signatureHeader: `sha256=${"ab".repeat(32)}`,
          secret: GITHUB_SECRET,
        }),
      (error: unknown) =>
        error instanceof IntegrationError &&
        error.code === "webhook_signature_mismatch"
    );
  });

  it("validates Linear and Vercel signatures", () => {
    const body = '{"type":"Issue"}';
    assert.doesNotThrow(() =>
      validateLinearSignature({
        body,
        signatureHeader: signPayload(body, LINEAR_SECRET),
        secret: LINEAR_SECRET,
      })
    );
    assert.doesNotThrow(() =>
      validateVercelSignature({
        body,
        signatureHeader: signPayloadSha1(body, VERCEL_SECRET),
        secret: VERCEL_SECRET,
      })
    );
  });
});

describe("GitHub event normalization", () => {
  const now = "2026-07-11T12:00:00.000Z";

  it("normalizes pull_request events", () => {
    const rawBody = JSON.stringify({
      action: "opened",
      pull_request: {
        number: 42,
        title: "Add checkout",
        html_url: "https://github.com/acme/app/pull/42",
        state: "open",
        merged: false,
        updated_at: now,
        head: { sha: "abc" },
        base: { ref: "main" },
      },
    });
    const envelope = normalizeGitHubEvent({
      rawBody,
      eventName: "pull_request",
      deliveryId: "delivery-pr-1",
      receivedAt: now,
    });
    assert.equal(envelope.provider, "github");
    assert.equal(envelope.eventType, "pull_request");
    assert.equal(envelope.evidence[0]?.id, "github:pr:42");
    assert.equal(envelope.evidence[0]?.outcome, "pending");
  });

  it("normalizes check_suite, check_run, review, and push", () => {
    const suite = normalizeGitHubEvent({
      rawBody: JSON.stringify({
        action: "completed",
        check_suite: {
          id: 9,
          conclusion: "success",
          status: "completed",
          updated_at: now,
          url: "https://api.github.com/check-suites/9",
        },
      }),
      eventName: "check_suite",
      deliveryId: "d-suite",
      receivedAt: now,
    });
    assert.equal(suite.evidence[0]?.outcome, "pass");

    const run = normalizeGitHubEvent({
      rawBody: JSON.stringify({
        action: "completed",
        check_run: {
          id: 11,
          name: "ci",
          conclusion: "failure",
          status: "completed",
          html_url: "https://github.com/acme/app/runs/11",
          completed_at: now,
        },
      }),
      eventName: "check_run",
      deliveryId: "d-run",
      receivedAt: now,
    });
    assert.equal(run.evidence[0]?.outcome, "fail");

    const review = normalizeGitHubEvent({
      rawBody: JSON.stringify({
        action: "submitted",
        review: {
          id: 7,
          state: "approved",
          html_url: "https://github.com/acme/app/pull/42#pullrequestreview-7",
          submitted_at: now,
        },
        pull_request: { number: 42 },
      }),
      eventName: "pull_request_review",
      deliveryId: "d-review",
      receivedAt: now,
    });
    assert.equal(review.evidence[0]?.outcome, "pass");

    const push = normalizeGitHubEvent({
      rawBody: JSON.stringify({
        ref: "refs/heads/main",
        after: "deadbeef",
        compare: "https://github.com/acme/app/compare/1...2",
        commits: [{ id: "1" }, { id: "2" }],
        head_commit: { timestamp: now },
      }),
      eventName: "push",
      deliveryId: "d-push",
      receivedAt: now,
    });
    assert.equal(push.evidence[0]?.externalId, "deadbeef");
  });
});

describe("Linear and Vercel normalization", () => {
  const now = "2026-07-11T12:00:00.000Z";

  it("normalizes Linear issue updates with acceptance criteria", () => {
    const envelope = normalizeLinearEvent({
      rawBody: JSON.stringify({
        action: "update",
        type: "Issue",
        createdAt: now,
        data: {
          id: "iss_1",
          identifier: "SHE-69",
          title: "Webhooks",
          url: "https://linear.app/acme/issue/SHE-69",
          state: { name: "In Progress" },
          description: "- [x] Signatures\n- [ ] Routes\n",
          updatedAt: now,
        },
      }),
      receivedAt: now,
    });
    assert.equal(envelope.provider, "linear");
    assert.equal(envelope.releaseId, "SHE-69");
    assert.ok(envelope.evidence.some((item) => item.id === "linear:issue:SHE-69"));
    assert.ok(
      envelope.evidence.some((item) => item.id === "linear:acceptance:SHE-69")
    );
  });

  it("normalizes Vercel deployment lifecycle", () => {
    const envelope = normalizeVercelEvent({
      rawBody: JSON.stringify({
        id: "evt_1",
        type: "deployment.succeeded",
        createdAt: now,
        payload: {
          deployment: {
            id: "dpl_123",
            name: "release-room",
            url: "release-room-abc.vercel.app",
            readyState: "READY",
            target: "production",
            createdAt: now,
          },
          projectId: "prj_1",
        },
      }),
      receivedAt: now,
    });
    assert.equal(envelope.evidence[0]?.outcome, "pass");
    assert.ok(
      envelope.evidence.some((item) => item.category === "visual")
    );
  });
});

describe("provider webhook ingest", () => {
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

  it("accepts a valid GitHub pull_request webhook and deduplicates delivery", () => {
    const body = JSON.stringify({
      action: "opened",
      pull_request: {
        number: 42,
        title: "Add checkout",
        html_url: "https://github.com/acme/app/pull/42",
        state: "open",
        merged: false,
        updated_at: now,
      },
    });
    const signature = `sha256=${signPayload(body, GITHUB_SECRET)}`;
    const input = {
      provider: "github" as const,
      rawBody: body,
      signatureHeader: signature,
      deliveryId: "gh-delivery-1",
      eventName: "pull_request",
      now,
      env,
      store,
      auditStore,
      connectionStore,
    };

    const first = ingestProviderWebhook(input);
    const second = ingestProviderWebhook(input);

    assert.equal(first.status, "accepted");
    assert.equal(second.status, "duplicate");
    assert.equal(first.envelope?.deliveryId, "gh-delivery-1");
    assert.equal(auditStore.size(), 2);
    assert.equal(connectionStore.get("github").health, "healthy");
    assert.equal(connectionStore.get("github").lastEventId, "gh-delivery-1");
  });

  it("rejects invalid GitHub signatures and records actionable errors", () => {
    assert.throws(
      () =>
        ingestProviderWebhook({
          provider: "github",
          rawBody: "{}",
          signatureHeader: `sha256=${"00".repeat(32)}`,
          deliveryId: "bad-sig",
          eventName: "push",
          now,
          env,
          store,
          auditStore,
          connectionStore,
        }),
      (error: unknown) =>
        error instanceof IntegrationError &&
        error.code === "webhook_signature_mismatch"
    );
    assert.equal(connectionStore.get("github").health, "error");
    assert.equal(
      connectionStore.get("github").lastError?.code,
      "webhook_signature_mismatch"
    );
    assert.ok(!JSON.stringify(auditStore.list()).includes(GITHUB_SECRET));
  });

  it("rejects duplicate Linear deliveries as idempotent replays", () => {
    const body = JSON.stringify({
      action: "update",
      type: "Issue",
      webhookId: "wh_1",
      createdAt: now,
      data: {
        id: "iss_1",
        identifier: "SHE-69",
        title: "Webhooks",
        url: "https://linear.app/acme/issue/SHE-69",
        state: { name: "In Progress" },
        updatedAt: now,
      },
    });
    const input = {
      provider: "linear" as const,
      rawBody: body,
      signatureHeader: signPayload(body, LINEAR_SECRET),
      deliveryId: "lin-delivery-1",
      now,
      env,
      store,
      auditStore,
      connectionStore,
    };
    assert.equal(ingestProviderWebhook(input).status, "accepted");
    assert.equal(ingestProviderWebhook(input).status, "duplicate");
  });

  it("rejects stale Linear events (replay protection)", () => {
    const stale = "2026-07-11T11:00:00.000Z"; // 60 minutes older than now
    const body = JSON.stringify({
      action: "update",
      type: "Issue",
      createdAt: stale,
      data: {
        id: "iss_stale",
        identifier: "SHE-OLD",
        title: "Old",
        updatedAt: stale,
        state: { name: "Todo" },
      },
    });
    assert.throws(
      () =>
        ingestProviderWebhook({
          provider: "linear",
          rawBody: body,
          signatureHeader: signPayload(body, LINEAR_SECRET),
          deliveryId: "lin-stale",
          now,
          env,
          store,
          auditStore,
          connectionStore,
        }),
      (error: unknown) =>
        error instanceof IntegrationError &&
        error.code === "webhook_event_stale" &&
        error.status === 409
    );
    assert.equal(
      auditStore.list().some((row) => row.status === "stale"),
      true
    );
  });

  it("rejects oversized webhook bodies", () => {
    const body = "x".repeat(2048);
    assert.throws(
      () =>
        ingestProviderWebhook({
          provider: "vercel",
          rawBody: body,
          signatureHeader: signPayloadSha1(body, VERCEL_SECRET),
          deliveryId: "big",
          now,
          env,
          store,
          auditStore,
          connectionStore,
        }),
      (error: unknown) =>
        error instanceof IntegrationError &&
        error.code === "webhook_payload_too_large" &&
        error.status === 413
    );
  });

  it("accepts a valid Vercel deployment webhook", () => {
    const body = JSON.stringify({
      id: "evt_ok",
      type: "deployment.succeeded",
      createdAt: now,
      payload: {
        deployment: {
          id: "dpl_ok",
          url: "ok.vercel.app",
          readyState: "READY",
          createdAt: now,
        },
      },
    });
    const result = ingestProviderWebhook({
      provider: "vercel",
      rawBody: body,
      signatureHeader: signPayloadSha1(body, VERCEL_SECRET),
      deliveryId: "vercel-1",
      now,
      env,
      store,
      auditStore,
      connectionStore,
    });
    assert.equal(result.status, "accepted");
    assert.equal(result.envelope?.provider, "vercel");
    assert.ok(result.evidence.length >= 1);
  });

  it("fails closed when provider webhook secret is missing", () => {
    assert.throws(
      () =>
        ingestProviderWebhook({
          provider: "github",
          rawBody: "{}",
          signatureHeader: `sha256=${"ab".repeat(32)}`,
          deliveryId: "x",
          eventName: "push",
          now,
          env: { ...env, githubWebhookSecret: null },
          store,
          auditStore,
          connectionStore,
        }),
      (error: unknown) =>
        error instanceof IntegrationError &&
        error.code === "github_webhook_secret_missing" &&
        error.status === 503
    );
  });
});

describe("body and freshness guards", () => {
  it("assertBodyWithinLimit and assertEventFreshness cover edge cases", () => {
    assert.doesNotThrow(() => assertBodyWithinLimit("tiny", 100));
    assert.throws(
      () => assertBodyWithinLimit("too-large-payload", 4),
      (error: unknown) =>
        error instanceof IntegrationError &&
        error.code === "webhook_payload_too_large"
    );

    assert.doesNotThrow(() =>
      assertEventFreshness({
        eventTimestamp: "2026-07-11T12:00:00.000Z",
        now: "2026-07-11T12:01:00.000Z",
        maxAgeSeconds: 300,
      })
    );
    assert.throws(
      () =>
        assertEventFreshness({
          eventTimestamp: "2026-07-11T10:00:00.000Z",
          now: "2026-07-11T12:00:00.000Z",
          maxAgeSeconds: 300,
        }),
      (error: unknown) =>
        error instanceof IntegrationError &&
        error.code === "webhook_event_stale"
    );
  });
});

describe("GitHub check-run publish adapter boundary", () => {
  it("requires GitHub App installation credentials", async () => {
    const publisher = new GitHubCheckRunPublisher(
      getIntegrationEnv({
        githubAppId: null,
        githubAppInstallationId: null,
        githubAppPrivateKey: null,
        githubToken: "ghp_must_not_be_used_for_publish",
        forceFixtures: false,
      })
    );

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
        error.code === "github_app_not_installed" &&
        error.status === 503
    );
  });

  it("attempts publish only when App credentials are configured", async () => {
    const publisher = new GitHubCheckRunPublisher(
      getIntegrationEnv({
        githubAppId: "123",
        githubAppInstallationId: "456",
        githubAppPrivateKey: "app-private-key-material",
        forceFixtures: false,
      })
    );

    const result = await publisher.publish({
      owner: "acme",
      repo: "release-room",
      headSha: "abc",
      name: "Release Room",
      status: "completed",
      conclusion: "success",
      fetchImpl: async () =>
        new Response(JSON.stringify({ id: 99 }), {
          status: 201,
          headers: { "content-type": "application/json" },
        }),
    });

    assert.equal(result.ok, true);
    assert.equal(result.checkRunId, "99");
    assert.equal(result.mode, "live");
  });
});

describe("connection freshness", () => {
  it("marks healthy connections stale after the freshness window", () => {
    const env = envWithSecrets();
    const connections = new ConnectionStateStore(env);
    connections.recordSuccess({
      provider: "github",
      eventId: "old",
      eventType: "push",
      at: "2026-07-11T11:00:00.000Z",
    });
    const listed = connections.refreshStale(300, "2026-07-11T12:00:00.000Z");
    assert.equal(
      listed.find((row) => row.provider === "github")?.health,
      "stale"
    );
  });
});
