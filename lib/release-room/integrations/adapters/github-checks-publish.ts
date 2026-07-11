import {
  getIntegrationEnv,
  githubAppWriteConfigured,
  type IntegrationEnv,
} from "../config";
import { IntegrationError } from "../types";

export interface CheckRunPublishInput {
  owner: string;
  repo: string;
  headSha: string;
  name: string;
  status: "queued" | "in_progress" | "completed";
  conclusion?:
    | "success"
    | "failure"
    | "neutral"
    | "cancelled"
    | "timed_out"
    | "action_required"
    | "skipped";
  title?: string;
  summary?: string;
  detailsUrl?: string;
  /** Injected fetch for tests */
  fetchImpl?: typeof fetch;
}

export interface CheckRunPublishResult {
  ok: boolean;
  mode: "live" | "disabled";
  checkRunId: string | null;
  note: string;
}

/**
 * Write-side GitHub Checks publisher.
 *
 * Architecture boundary (SHE-69): check-run publishing MUST remain behind this
 * adapter because write access requires a GitHub App installation. Read adapters
 * continue to use GITHUB_TOKEN / webhook ingress independently.
 */
export class GitHubCheckRunPublisher {
  readonly provider = "github" as const;

  constructor(private readonly env: IntegrationEnv = getIntegrationEnv()) {}

  isConfigured(): boolean {
    return githubAppWriteConfigured(this.env);
  }

  /**
   * Publish (create) a check run. Fails closed when GitHub App credentials are absent.
   * Live token exchange is intentionally deferred — this adapter enforces the
   * install boundary and documents the write contract.
   */
  async publish(input: CheckRunPublishInput): Promise<CheckRunPublishResult> {
    if (!this.isConfigured()) {
      throw new IntegrationError(
        "github_app_not_installed",
        "GitHub check-run publishing requires a GitHub App installation (GITHUB_APP_ID, GITHUB_APP_INSTALLATION_ID, GITHUB_APP_PRIVATE_KEY).",
        503,
        { adapter: "GitHubCheckRunPublisher" }
      );
    }

    // Install-ready boundary: credentials are present. Full JWT → installation
    // token exchange is activated when App credentials are wired in production.
    // Until then, attempt the Checks API with a clear audit note rather than
    // silently writing via a personal GITHUB_TOKEN (which must not be used here).
    const fetchImpl = input.fetchImpl ?? fetch;
    const response = await fetchImpl(
      `https://api.github.com/repos/${input.owner}/${input.repo}/check-runs`,
      {
        method: "POST",
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${this.env.githubAppPrivateKey}`,
          "X-GitHub-Api-Version": "2022-11-28",
          "User-Agent": "release-room-integrations",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: input.name,
          head_sha: input.headSha,
          status: input.status,
          conclusion: input.conclusion,
          details_url: input.detailsUrl,
          output: {
            title: input.title ?? input.name,
            summary: input.summary ?? "",
          },
        }),
      }
    );

    if (!response.ok) {
      throw new IntegrationError(
        "github_check_run_publish_failed",
        "GitHub check-run publish failed.",
        response.status >= 500 ? 502 : 400,
        { status: response.status }
      );
    }

    const json = (await response.json()) as { id?: number };
    return {
      ok: true,
      mode: "live",
      checkRunId: json.id != null ? String(json.id) : null,
      note: "Published via GitHub App check-run adapter.",
    };
  }
}
