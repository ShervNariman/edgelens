/**
 * Risk policy: maps risk classes → required / optional evidence categories.
 * Policy ids are stable strings used in explainable decision output.
 */

import type {
  EvidenceCategory,
  PolicyRequirement,
  RiskClass,
} from "./types";

/**
 * Canonical policy table. Higher-risk classes demand more evidence.
 * `content` is the low-risk path (copy/docs/marketing-style changes).
 */
export const RISK_POLICIES: Readonly<Record<RiskClass, PolicyRequirement>> = {
  content: {
    riskClass: "content",
    policyId: "policy.content.v1",
    required: ["intent", "approval"],
    optional: ["code", "visual", "test"],
  },
  ui: {
    riskClass: "ui",
    policyId: "policy.ui.v1",
    required: ["intent", "code", "test", "visual", "approval"],
    optional: ["analytics", "deployment"],
  },
  authentication: {
    riskClass: "authentication",
    policyId: "policy.authentication.v1",
    required: ["intent", "code", "test", "security", "approval"],
    optional: ["deployment", "operations", "visual"],
  },
  billing: {
    riskClass: "billing",
    policyId: "policy.billing.v1",
    required: ["intent", "code", "test", "security", "approval"],
    optional: ["deployment", "analytics", "operations"],
  },
  permissions: {
    riskClass: "permissions",
    policyId: "policy.permissions.v1",
    required: ["intent", "code", "test", "security", "approval"],
    optional: ["operations", "deployment"],
  },
  public_api: {
    riskClass: "public_api",
    policyId: "policy.public_api.v1",
    required: ["intent", "code", "test", "security", "deployment", "approval"],
    optional: ["analytics", "operations"],
  },
  database_migration: {
    riskClass: "database_migration",
    policyId: "policy.database_migration.v1",
    required: [
      "intent",
      "code",
      "test",
      "security",
      "deployment",
      "operations",
      "approval",
    ],
    optional: ["analytics"],
  },
};

/** Severity order used when merging multiple risk classes (highest first). */
export const RISK_SEVERITY_ORDER: readonly RiskClass[] = [
  "database_migration",
  "billing",
  "authentication",
  "permissions",
  "public_api",
  "ui",
  "content",
] as const;

function uniqueCategories(
  categories: readonly EvidenceCategory[]
): EvidenceCategory[] {
  return [...new Set(categories)];
}

/**
 * Merge policies for one or more risk classes.
 * Required = union of all required. Optional = union of optionals minus required.
 */
export function resolvePolicyForRisks(
  riskClasses: readonly RiskClass[]
): {
  required: EvidenceCategory[];
  optional: EvidenceCategory[];
  policySource: string[];
  primaryRisk: RiskClass;
} {
  if (riskClasses.length === 0) {
    const fallback = RISK_POLICIES.content;
    return {
      required: [...fallback.required],
      optional: [...fallback.optional],
      policySource: [fallback.policyId],
      primaryRisk: "content",
    };
  }

  const sorted = [...riskClasses].sort(
    (a, b) => RISK_SEVERITY_ORDER.indexOf(a) - RISK_SEVERITY_ORDER.indexOf(b)
  );

  const required: EvidenceCategory[] = [];
  const optional: EvidenceCategory[] = [];
  const policySource: string[] = [];

  for (const risk of sorted) {
    const policy = RISK_POLICIES[risk];
    policySource.push(policy.policyId);
    required.push(...policy.required);
    optional.push(...policy.optional);
  }

  const requiredUnique = uniqueCategories(required);
  const requiredSet = new Set(requiredUnique);
  const optionalUnique = uniqueCategories(optional).filter(
    (c) => !requiredSet.has(c)
  );

  return {
    required: requiredUnique,
    optional: optionalUnique,
    policySource: [...new Set(policySource)],
    primaryRisk: sorted[0]!,
  };
}
