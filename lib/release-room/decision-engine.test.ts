/**
 * Unit tests for Release Room decision core (SHE-59).
 * Run: npm run test:release-room
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  classifyRisk,
  evaluateRelease,
  EVIDENCE_CATEGORIES,
  normalizeRiskClasses,
  ReleaseDecisionError,
  resolvePolicyForRisks,
  RISK_CLASSES,
  type EvidenceCategory,
  type EvidenceItem,
  type ReleaseCandidateInput,
} from "./index";

function pass(category: EvidenceCategory, source = "fixture"): EvidenceItem {
  return { category, outcome: "pass", source, summary: `${category} ok` };
}

function fail(category: EvidenceCategory): EvidenceItem {
  return { category, outcome: "fail", source: "fixture", summary: `${category} failed` };
}

function pending(category: EvidenceCategory): EvidenceItem {
  return { category, outcome: "pending" };
}

function allPass(categories: readonly EvidenceCategory[]): EvidenceItem[] {
  return categories.map((c) => pass(c));
}

describe("evidence categories and risk classes", () => {
  it("exports the nine normalized evidence categories", () => {
    assert.deepEqual([...EVIDENCE_CATEGORIES], [
      "intent",
      "code",
      "test",
      "security",
      "visual",
      "deployment",
      "analytics",
      "operations",
      "approval",
    ]);
  });

  it("exports the seven risk classes", () => {
    assert.deepEqual([...RISK_CLASSES], [
      "ui",
      "authentication",
      "billing",
      "database_migration",
      "permissions",
      "public_api",
      "content",
    ]);
  });
});

describe("risk classifier", () => {
  it("classifies UI signals", () => {
    assert.deepEqual(classifyRisk(["Update dashboard layout component"]), [
      "ui",
    ]);
  });

  it("classifies authentication signals", () => {
    assert.deepEqual(classifyRisk(["Add OAuth login flow"]), [
      "authentication",
    ]);
  });

  it("classifies billing signals", () => {
    assert.deepEqual(classifyRisk(["Stripe checkout pricing change"]), [
      "billing",
    ]);
  });

  it("classifies database migration signals", () => {
    assert.deepEqual(classifyRisk(["prisma migrate schema change"]), [
      "database_migration",
    ]);
  });

  it("classifies permissions signals", () => {
    assert.deepEqual(classifyRisk(["RBAC role permission update"]), [
      "permissions",
    ]);
  });

  it("classifies public API signals", () => {
    assert.deepEqual(classifyRisk(["public API OpenAPI contract change"]), [
      "public_api",
    ]);
  });

  it("defaults unknown signals to low-risk content", () => {
    assert.deepEqual(classifyRisk(["misc internal tweak"]), ["content"]);
  });

  it("merges multiple high-risk signals and drops redundant content", () => {
    const risks = classifyRisk([
      "billing stripe",
      "database migration",
      "docs content update",
    ]);
    assert.deepEqual(risks, ["database_migration", "billing"]);
  });

  it("rejects non-string signals", () => {
    assert.throws(
      () => classifyRisk([123 as unknown as string]),
      (err: unknown) =>
        err instanceof ReleaseDecisionError &&
        err.code === "invalid_change_signals"
    );
  });
});

describe("policy resolution", () => {
  it("requires security for authentication changes", () => {
    const policy = resolvePolicyForRisks(["authentication"]);
    assert.ok(policy.required.includes("security"));
    assert.ok(policy.required.includes("approval"));
    assert.ok(policy.policySource.includes("policy.authentication.v1"));
  });

  it("keeps content policy light", () => {
    const policy = resolvePolicyForRisks(["content"]);
    assert.deepEqual(policy.required, ["intent", "approval"]);
  });

  it("unions required evidence across mixed risks", () => {
    const policy = resolvePolicyForRisks(["ui", "public_api"]);
    assert.ok(policy.required.includes("visual")); // from ui
    assert.ok(policy.required.includes("security")); // from public_api
    assert.ok(policy.required.includes("deployment")); // from public_api
    assert.ok(!policy.optional.includes("visual")); // promoted to required
  });
});

describe("evaluateRelease — happy paths", () => {
  it("returns READY when all required evidence passes for content", () => {
    const result = evaluateRelease({
      id: "rc-content-1",
      riskClasses: ["content"],
      evidence: [pass("intent"), pass("approval")],
    });
    assert.equal(result.decision, "READY");
    assert.equal(result.blockers.length, 0);
    assert.deepEqual(result.riskClasses, ["content"]);
    assert.ok(result.policySource.includes("policy.content.v1"));
  });

  it("returns READY for UI when all required evidence passes", () => {
    const required = resolvePolicyForRisks(["ui"]).required;
    const result = evaluateRelease({
      id: "rc-ui-1",
      riskClasses: ["ui"],
      evidence: allPass(required),
    });
    assert.equal(result.decision, "READY");
    assert.equal(result.missingEvidence.length, 0);
  });

  it("is deterministic for the same input", () => {
    const input: ReleaseCandidateInput = {
      id: "rc-det",
      changeSignals: ["Update shadcn button component UI"],
      evidence: allPass([
        "intent",
        "code",
        "test",
        "visual",
        "approval",
      ]),
    };
    const a = evaluateRelease(input);
    const b = evaluateRelease(input);
    assert.deepEqual(a, b);
  });
});

describe("evaluateRelease — mixed evidence", () => {
  it("returns READY when required passes and optional is merely absent", () => {
    const result = evaluateRelease({
      id: "rc-warn-1",
      riskClasses: ["ui"],
      evidence: [
        pass("intent"),
        pass("code"),
        pass("test"),
        pass("visual"),
        pass("approval"),
        // analytics + deployment optional and absent — not a warning
      ],
    });
    assert.equal(result.decision, "READY");
    assert.equal(result.blockers.length, 0);
    assert.equal(result.warnings.length, 0);
    assert.ok(result.evidence.missingOptional.includes("analytics"));
  });

  it("returns WARNING when optional evidence failed", () => {
    const result = evaluateRelease({
      id: "rc-warn-2",
      riskClasses: ["ui"],
      evidence: [
        pass("intent"),
        pass("code"),
        pass("test"),
        pass("visual"),
        pass("approval"),
        fail("analytics"),
        pass("deployment"),
      ],
    });
    assert.equal(result.decision, "WARNING");
    assert.ok(
      result.warnings.some(
        (w) => w.category === "analytics" && w.code === "failed_optional_evidence"
      )
    );
  });

  it("returns BLOCKED when required evidence is pending", () => {
    const result = evaluateRelease({
      id: "rc-block-1",
      riskClasses: ["ui"],
      evidence: [
        pass("intent"),
        pass("code"),
        pending("test"),
        pass("visual"),
        pass("approval"),
      ],
    });
    assert.equal(result.decision, "BLOCKED");
    assert.ok(result.missingEvidence.includes("test"));
    assert.ok(
      result.blockers.some(
        (b) => b.category === "test" && b.code === "missing_required_evidence"
      )
    );
  });

  it("returns BLOCKED when required evidence failed", () => {
    const result = evaluateRelease({
      id: "rc-block-2",
      riskClasses: ["authentication"],
      evidence: [
        pass("intent"),
        pass("code"),
        pass("test"),
        fail("security"),
        pass("approval"),
      ],
    });
    assert.equal(result.decision, "BLOCKED");
    assert.ok(result.missingEvidence.includes("security"));
    assert.ok(
      result.blockers.some(
        (b) => b.category === "security" && b.code === "failed_required_evidence"
      )
    );
  });
});

describe("evaluateRelease — high-risk changes", () => {
  it("blocks database migration without operations evidence", () => {
    const policy = resolvePolicyForRisks(["database_migration"]);
    const evidence = allPass(
      policy.required.filter((c) => c !== "operations")
    );
    const result = evaluateRelease({
      id: "rc-db-1",
      riskClasses: ["database_migration"],
      evidence,
    });
    assert.equal(result.decision, "BLOCKED");
    assert.ok(result.missingEvidence.includes("operations"));
    assert.ok(result.policySource.includes("policy.database_migration.v1"));
  });

  it("requires security + deployment for public_api", () => {
    const result = evaluateRelease({
      id: "rc-api-1",
      changeSignals: ["breaking public API OpenAPI change"],
      evidence: [
        pass("intent"),
        pass("code"),
        pass("test"),
        pass("approval"),
        // missing security + deployment
      ],
    });
    assert.equal(result.decision, "BLOCKED");
    assert.ok(result.riskClasses.includes("public_api"));
    assert.ok(result.missingEvidence.includes("security"));
    assert.ok(result.missingEvidence.includes("deployment"));
  });

  it("READY for database migration when full evidence set passes", () => {
    const required = resolvePolicyForRisks(["database_migration"]).required;
    const result = evaluateRelease({
      id: "rc-db-ready",
      riskClasses: ["database_migration"],
      evidence: allPass(required),
    });
    assert.equal(result.decision, "READY");
  });
});

describe("evaluateRelease — overrides", () => {
  it("requires non-empty rationale", () => {
    assert.throws(
      () =>
        evaluateRelease({
          id: "rc-ov-1",
          riskClasses: ["content"],
          evidence: [pass("intent")],
          override: { rationale: "   ", actor: "sherv" },
        }),
      (err: unknown) =>
        err instanceof ReleaseDecisionError && err.code === "invalid_override"
    );
  });

  it("requires actor", () => {
    assert.throws(
      () =>
        evaluateRelease({
          id: "rc-ov-2",
          riskClasses: ["content"],
          evidence: [pass("intent")],
          override: { rationale: "ship it", actor: "" },
        }),
      (err: unknown) =>
        err instanceof ReleaseDecisionError && err.code === "invalid_override"
    );
  });

  it("waives blockers with rationale and emits audit event", () => {
    const result = evaluateRelease({
      id: "rc-ov-3",
      riskClasses: ["content"],
      evidence: [pass("intent")], // missing approval
      override: {
        rationale: "Emergency hotfix; approval async in Slack",
        actor: "sherv",
        at: "2026-07-11T12:00:00.000Z",
      },
    });
    assert.equal(result.decision, "READY");
    assert.equal(result.blockers.length, 0);
    assert.ok(result.override);
    assert.equal(
      result.override?.rationale,
      "Emergency hotfix; approval async in Slack"
    );
    assert.ok(result.override!.waivedBlockers.length > 0);
    assert.ok(result.auditEvents.some((e) => e.type === "override"));
    assert.ok(result.auditEvents.some((e) => e.type === "decision"));
    // Explainability: missing evidence still listed even after override
    assert.ok(result.missingEvidence.includes("approval"));
  });

  it("override without forceReady keeps WARNING when optional evidence failed", () => {
    const result = evaluateRelease({
      id: "rc-ov-4",
      riskClasses: ["ui"],
      evidence: [
        pass("intent"),
        pass("code"),
        pass("test"),
        pass("visual"),
        fail("analytics"),
        // missing approval (blocker) + failed optional
      ],
      override: {
        rationale: "Design lead signed off offline",
        actor: "pm",
        forceReady: false,
      },
    });
    assert.equal(result.decision, "WARNING");
    assert.equal(result.blockers.length, 0);
    assert.ok(result.warnings.some((w) => w.category === "analytics"));
  });

  it("forceReady clears warnings", () => {
    const result = evaluateRelease({
      id: "rc-ov-5",
      riskClasses: ["ui"],
      evidence: [
        pass("intent"),
        pass("code"),
        pass("test"),
        pass("visual"),
        pass("approval"),
        fail("analytics"),
      ],
      override: {
        rationale: "Analytics flake known; accept risk",
        actor: "eng-lead",
        forceReady: true,
      },
    });
    assert.equal(result.decision, "READY");
    assert.equal(result.warnings.length, 0);
  });
});

describe("evaluateRelease — invalid inputs", () => {
  it("rejects empty id", () => {
    assert.throws(
      () =>
        evaluateRelease({
          id: "",
          riskClasses: ["content"],
          evidence: [],
        }),
      (err: unknown) =>
        err instanceof ReleaseDecisionError && err.code === "invalid_input"
    );
  });

  it("rejects missing riskClasses and changeSignals", () => {
    assert.throws(
      () =>
        evaluateRelease({
          id: "rc-bad",
          evidence: [],
        }),
      (err: unknown) =>
        err instanceof ReleaseDecisionError && err.code === "invalid_input"
    );
  });

  it("rejects unknown risk class", () => {
    assert.throws(
      () => normalizeRiskClasses(["not-a-risk"]),
      (err: unknown) =>
        err instanceof ReleaseDecisionError && err.code === "invalid_risk_classes"
    );
  });

  it("rejects invalid evidence category", () => {
    assert.throws(
      () =>
        evaluateRelease({
          id: "rc-bad-ev",
          riskClasses: ["content"],
          evidence: [
            {
              category: "magic" as EvidenceCategory,
              outcome: "pass",
            },
          ],
        }),
      (err: unknown) =>
        err instanceof ReleaseDecisionError && err.code === "invalid_evidence"
    );
  });

  it("rejects invalid evidence outcome", () => {
    assert.throws(
      () =>
        evaluateRelease({
          id: "rc-bad-out",
          riskClasses: ["content"],
          evidence: [
            {
              category: "intent",
              outcome: "maybe" as EvidenceItem["outcome"],
            },
          ],
        }),
      (err: unknown) =>
        err instanceof ReleaseDecisionError && err.code === "invalid_evidence"
    );
  });

  it("last duplicate evidence category wins", () => {
    const result = evaluateRelease({
      id: "rc-dup",
      riskClasses: ["content"],
      evidence: [fail("intent"), pass("intent"), pass("approval")],
    });
    assert.equal(result.decision, "READY");
    assert.ok(result.evidence.present.includes("intent"));
  });
});

describe("explainable decision output", () => {
  it("includes missing evidence, warnings, blockers, and policy source", () => {
    const result = evaluateRelease({
      id: "rc-explain",
      riskClasses: ["billing", "ui"],
      evidence: [
        pass("intent"),
        pass("code"),
        pass("test"),
        pass("visual"),
        // missing security (required by billing) + approval
        fail("analytics"),
      ],
    });
    assert.equal(result.decision, "BLOCKED");
    assert.ok(result.missingEvidence.includes("security"));
    assert.ok(result.missingEvidence.includes("approval"));
    assert.ok(result.blockers.length >= 2);
    assert.ok(result.warnings.some((w) => w.category === "analytics"));
    assert.ok(result.policySource.includes("policy.billing.v1"));
    assert.ok(result.policySource.includes("policy.ui.v1"));
    assert.deepEqual(result.riskClasses, ["billing", "ui"]);
    assert.equal(result.candidateId, "rc-explain");
  });
});
