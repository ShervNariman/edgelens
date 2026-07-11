/**
 * Deterministic risk classifier from free-form change signals.
 * Keyword / pattern matching only — no LLM.
 */

import { RISK_SEVERITY_ORDER } from "./policy";
import {
  RISK_CLASSES,
  type RiskClass,
  ReleaseDecisionError,
} from "./types";

const RISK_PATTERNS: ReadonlyArray<{
  risk: RiskClass;
  patterns: readonly RegExp[];
}> = [
  {
    risk: "database_migration",
    patterns: [
      /\b(db|database)\s*migration\b/i,
      /\bmigration(s)?\b/i,
      /\bschema\s+change\b/i,
      /\balter\s+table\b/i,
      /\bprisma\s+migrate\b/i,
      /\bdrizzle\s+migrat/i,
    ],
  },
  {
    risk: "billing",
    patterns: [
      /\bbilling\b/i,
      /\bpayment(s)?\b/i,
      /\bstripe\b/i,
      /\binvoice(s)?\b/i,
      /\bsubscription(s)?\b/i,
      /\bcheckout\b/i,
      /\bpricing\b/i,
    ],
  },
  {
    risk: "authentication",
    patterns: [
      /\bauth(entication|orization)?\b/i,
      /\blogin\b/i,
      /\bsign[-\s]?in\b/i,
      /\boauth\b/i,
      /\bsso\b/i,
      /\bsession\b/i,
      /\bjwt\b/i,
      /\bpassword\b/i,
      /\bmfa\b|\b2fa\b/i,
    ],
  },
  {
    risk: "permissions",
    patterns: [
      /\bpermission(s)?\b/i,
      /\brbac\b/i,
      /\broles?\b/i,
      /\bacl\b/i,
      /\baccess\s+control\b/i,
      /\bscopes?\b/i,
    ],
  },
  {
    risk: "public_api",
    patterns: [
      /\bpublic\s+api\b/i,
      /\bapi\s+(breaking|contract|version)\b/i,
      /\bopenapi\b/i,
      /\brest\s+endpoint\b/i,
      /\bgraphql\s+schema\b/i,
      /\bwebhook(s)?\b/i,
    ],
  },
  {
    risk: "ui",
    patterns: [
      /\bui\b/i,
      /\bux\b/i,
      /\bfrontend\b/i,
      /\bcomponent(s)?\b/i,
      /\bshadcn\b/i,
      /\bcss\b/i,
      /\blayout\b/i,
      /\bdashboard\b/i,
      /\bpage\b/i,
    ],
  },
  {
    risk: "content",
    patterns: [
      /\bcontent\b/i,
      /\bcopy\b/i,
      /\bdocs?\b/i,
      /\breadme\b/i,
      /\bmarketing\b/i,
      /\btypo\b/i,
      /\bchangelog\b/i,
      /\blow[-\s]?risk\b/i,
    ],
  },
];

export function isRiskClass(value: string): value is RiskClass {
  return (RISK_CLASSES as readonly string[]).includes(value);
}

/**
 * Classify risk from change signals. Returns unique classes sorted by severity.
 * Unknown / empty signals default to `content` (low-risk).
 */
export function classifyRisk(changeSignals: readonly string[]): RiskClass[] {
  if (!Array.isArray(changeSignals)) {
    throw new ReleaseDecisionError(
      "invalid_change_signals",
      "changeSignals must be an array of strings"
    );
  }

  for (const signal of changeSignals) {
    if (typeof signal !== "string") {
      throw new ReleaseDecisionError(
        "invalid_change_signals",
        "each changeSignal must be a string",
        { signal }
      );
    }
  }

  const matched = new Set<RiskClass>();
  const haystack = changeSignals.join("\n");

  for (const { risk, patterns } of RISK_PATTERNS) {
    if (patterns.some((re) => re.test(haystack))) {
      matched.add(risk);
    }
  }

  if (matched.size === 0) {
    return ["content"];
  }

  // If only content matched alongside higher risks, drop content as redundant.
  if (matched.size > 1 && matched.has("content")) {
    matched.delete("content");
  }

  return [...matched].sort(
    (a, b) => RISK_SEVERITY_ORDER.indexOf(a) - RISK_SEVERITY_ORDER.indexOf(b)
  );
}

/**
 * Normalize an explicit riskClasses list: validate, dedupe, sort by severity.
 */
export function normalizeRiskClasses(
  riskClasses: readonly string[]
): RiskClass[] {
  if (!Array.isArray(riskClasses) || riskClasses.length === 0) {
    throw new ReleaseDecisionError(
      "invalid_risk_classes",
      "riskClasses must be a non-empty array when provided"
    );
  }

  const normalized: RiskClass[] = [];
  const seen = new Set<RiskClass>();

  for (const value of riskClasses) {
    if (typeof value !== "string" || !isRiskClass(value)) {
      throw new ReleaseDecisionError(
        "invalid_risk_classes",
        `Unknown risk class: ${String(value)}`,
        { value, allowed: [...RISK_CLASSES] }
      );
    }
    if (!seen.has(value)) {
      seen.add(value);
      normalized.push(value);
    }
  }

  return normalized.sort(
    (a, b) => RISK_SEVERITY_ORDER.indexOf(a) - RISK_SEVERITY_ORDER.indexOf(b)
  );
}
