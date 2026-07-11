import {
  getIntegrationEnv,
  linearLiveEnabled,
  type IntegrationEnv,
} from "../config";
import { buildFixtureEvidence } from "../fixtures";
import type {
  AdapterContext,
  AdapterResult,
  EvidenceAdapter,
  NormalizedEvidenceItem,
} from "../types";
import { IntegrationError } from "../types";

type Json = Record<string, unknown>;

const ISSUE_QUERY = `
  query IssueById($id: String!) {
    issue(id: $id) {
      id
      identifier
      title
      description
      url
      state { name }
      priority
    }
  }
`;

const ISSUE_BY_IDENTIFIER_QUERY = `
  query IssueByIdentifier($id: String!) {
    issueSearch(filter: { searchableContent: { containsIgnoreCase: $id } }, first: 5) {
      nodes {
        id
        identifier
        title
        description
        url
        state { name }
        priority
      }
    }
  }
`;

async function linearGraphql(
  query: string,
  variables: Record<string, unknown>,
  apiKey: string,
  fetchImpl: typeof fetch
): Promise<Json> {
  const response = await fetchImpl("https://api.linear.app/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: apiKey,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    throw new IntegrationError(
      "linear_api_error",
      "Linear API request failed.",
      response.status >= 500 ? 502 : 400,
      { status: response.status }
    );
  }

  const payload = (await response.json()) as Json;
  if (payload.errors) {
    throw new IntegrationError(
      "linear_graphql_error",
      "Linear GraphQL returned errors.",
      400
    );
  }
  return (payload.data as Json) ?? {};
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function extractAcceptanceCriteria(description: string): {
  criteria: { text: string; done: boolean }[];
  allDone: boolean;
  anyPresent: boolean;
} {
  const lines = description.split(/\r?\n/);
  const criteria: { text: string; done: boolean }[] = [];
  for (const line of lines) {
    const match = line.match(/^\s*[-*]\s*\[([ xX])\]\s+(.+)$/);
    if (match) {
      criteria.push({
        done: match[1].toLowerCase() === "x",
        text: match[2].trim(),
      });
    }
  }
  return {
    criteria,
    allDone: criteria.length > 0 && criteria.every((c) => c.done),
    anyPresent: criteria.length > 0,
  };
}

/**
 * Linear adapter — issue intent and acceptance criteria.
 * Falls back to fixtures when LINEAR_API_KEY is absent.
 */
export class LinearAdapter implements EvidenceAdapter {
  readonly provider = "linear" as const;

  constructor(private readonly env: IntegrationEnv = getIntegrationEnv()) {}

  isLiveConfigured(): boolean {
    return linearLiveEnabled(this.env);
  }

  async collect(ctx: AdapterContext): Promise<AdapterResult> {
    const useFixture = ctx.forceFixture || !this.isLiveConfigured();
    if (useFixture) {
      const evidence = buildFixtureEvidence(ctx.release).filter(
        (item) => item.provider === "linear"
      );
      return {
        provider: "linear",
        mode: "fixture",
        evidence,
        note: "Linear fixture adapter — no LINEAR_API_KEY configured.",
      };
    }

    try {
      const evidence = await this.collectLive(ctx);
      return {
        provider: "linear",
        mode: "live",
        evidence,
        note: "Linear live adapter refreshed issue intent and acceptance criteria.",
      };
    } catch (error) {
      const message =
        error instanceof IntegrationError
          ? error.message
          : "Linear live collection failed.";
      const now = ctx.now ?? new Date().toISOString();
      const fallback: NormalizedEvidenceItem = {
        id: `linear:error:${ctx.release.id}`,
        provider: "linear",
        category: "intent",
        outcome: "fail",
        title: "Linear adapter failure",
        summary: message,
        externalId: `error-${ctx.release.id}`,
        sourceLinks: [],
        collectedAt: now,
      };
      return {
        provider: "linear",
        mode: "live",
        evidence: [fallback],
        note: "Linear live adapter failed closed.",
      };
    }
  }

  private async collectLive(ctx: AdapterContext): Promise<NormalizedEvidenceItem[]> {
    const apiKey = this.env.linearApiKey;
    if (!apiKey) {
      throw new IntegrationError("linear_key_missing", "LINEAR_API_KEY missing.", 503);
    }

    const issueKey = ctx.release.linearIssueId;
    if (!issueKey) {
      throw new IntegrationError(
        "linear_issue_missing",
        "release.linearIssueId is required for live Linear collection.",
        400
      );
    }

    const fetchImpl = ctx.fetchImpl ?? fetch;
    const now = ctx.now ?? new Date().toISOString();

    // Prefer direct id lookup; fall back to search by identifier (SHE-60).
    let issue: Json | null = null;
    if (issueKey.includes("-") && !issueKey.startsWith("issue_")) {
      const data = await linearGraphql(
        ISSUE_BY_IDENTIFIER_QUERY,
        { id: issueKey },
        apiKey,
        fetchImpl
      );
      const nodes = (data.issueSearch as Json | undefined)?.nodes;
      if (Array.isArray(nodes)) {
        issue =
          (nodes.find((node) => asString((node as Json).identifier) === issueKey) as
            | Json
            | undefined) ?? (nodes[0] as Json | undefined) ??
          null;
      }
    } else {
      const data = await linearGraphql(ISSUE_QUERY, { id: issueKey }, apiKey, fetchImpl);
      issue = (data.issue as Json | null) ?? null;
    }

    if (!issue) {
      throw new IntegrationError(
        "linear_issue_not_found",
        "Linear issue was not found.",
        404
      );
    }

    const identifier = asString(issue.identifier, issueKey);
    const title = asString(issue.title, identifier);
    const description = asString(issue.description);
    const url = asString(issue.url, `https://linear.app/issue/${identifier}`);
    const state = asString((issue.state as Json | undefined)?.name, "Unknown");
    const acceptance = extractAcceptanceCriteria(description);

    return [
      {
        id: `linear:issue:${identifier}`,
        provider: "linear",
        category: "intent",
        outcome: title.trim() ? "pass" : "fail",
        title: `${identifier} intent`,
        summary: title,
        externalId: identifier,
        sourceLinks: [{ label: identifier, url }],
        collectedAt: now,
        metadata: {
          state,
          priority: issue.priority,
        },
      },
      {
        id: `linear:ac:${identifier}`,
        provider: "linear",
        category: "intent",
        outcome: !acceptance.anyPresent
          ? "pending"
          : acceptance.allDone
            ? "pass"
            : "pending",
        title: "Acceptance criteria",
        summary: !acceptance.anyPresent
          ? "No checkbox acceptance criteria found in the issue description."
          : acceptance.allDone
            ? "All acceptance criteria checkboxes are complete."
            : "Some acceptance criteria remain unchecked.",
        externalId: `${identifier}-ac`,
        sourceLinks: [{ label: "Acceptance criteria", url }],
        collectedAt: now,
        metadata: {
          criteria: acceptance.criteria,
        },
      },
    ];
  }
}
