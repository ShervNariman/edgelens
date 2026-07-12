/**
 * Explicit required permissions / setup steps per provider (Loop 1 setup UX).
 */

import type { IntegrationEnv } from "./config";
import {
  githubAppWriteConfigured,
  githubLiveEnabled,
  githubWebhookConfigured,
  linearLiveEnabled,
  linearWebhookConfigured,
  vercelLiveEnabled,
  vercelWebhookConfigured,
  webhookConfigured,
} from "./config";

export type PermissionSeverity = "required" | "optional";

export interface ProviderPermission {
  id: string;
  label: string;
  severity: PermissionSeverity;
  detail: string;
}

export interface ProviderSetupGuide {
  provider: "github" | "linear" | "vercel" | "webhook" | "editor" | "githubChecksPublish";
  title: string;
  summary: string;
  configured: boolean;
  permissions: ProviderPermission[];
  envVars: string[];
  connectionTest: string;
}

export function buildSetupGuides(
  env: IntegrationEnv
): ProviderSetupGuide[] {
  return [
    {
      provider: "github",
      title: "GitHub (read / backfill)",
      summary:
        "Personal access token or GitHub App installation token with repository read access for PRs, checks, and reviews.",
      configured: githubLiveEnabled(env),
      envVars: ["GITHUB_TOKEN", "GITHUB_OWNER", "GITHUB_REPO"],
      connectionTest: "GET /api/integrations/test?provider=github",
      permissions: [
        {
          id: "repo",
          label: "Contents: Read",
          severity: "required",
          detail: "Read repository metadata and changed files for the release PR.",
        },
        {
          id: "pull_requests",
          label: "Pull requests: Read",
          severity: "required",
          detail: "List PR reviews and review decisions.",
        },
        {
          id: "checks",
          label: "Checks: Read",
          severity: "required",
          detail: "Read check-run / check-suite conclusions for readiness.",
        },
        {
          id: "metadata",
          label: "Metadata: Read",
          severity: "required",
          detail: "Standard GitHub App metadata permission.",
        },
      ],
    },
    {
      provider: "github",
      title: "GitHub webhooks",
      summary:
        "Repository or organization webhook with X-Hub-Signature-256 verification.",
      configured: githubWebhookConfigured(env),
      envVars: ["GITHUB_WEBHOOK_SECRET"],
      connectionTest:
        "POST /api/integrations/github with a signed ping; then GET /api/integrations/health",
      permissions: [
        {
          id: "events",
          label: "Events: pull_request, check_run, check_suite, pull_request_review, push",
          severity: "required",
          detail: "Subscribe only to events Release Room normalizes.",
        },
        {
          id: "secret",
          label: "Webhook secret (≥16 chars)",
          severity: "required",
          detail: "Shared secret used for HMAC-SHA256 signature verification.",
        },
      ],
    },
    {
      provider: "githubChecksPublish",
      title: "GitHub Checks publishing (optional)",
      summary:
        "Optional write adapter. Non-self-validating — publishing a check does not prove release readiness.",
      configured: githubAppWriteConfigured(env),
      envVars: [
        "GITHUB_APP_ID",
        "GITHUB_APP_INSTALLATION_ID",
        "GITHUB_APP_PRIVATE_KEY",
      ],
      connectionTest:
        "Library-only via GitHubCheckRunPublisher; not used by webhook ingest.",
      permissions: [
        {
          id: "checks_write",
          label: "Checks: Write",
          severity: "optional",
          detail:
            "Create check-runs. Must not be treated as the sole release gate.",
        },
      ],
    },
    {
      provider: "linear",
      title: "Linear",
      summary: "API key for issue intent/acceptance backfill plus signed webhooks.",
      configured: linearLiveEnabled(env) || linearWebhookConfigured(env),
      envVars: ["LINEAR_API_KEY", "LINEAR_TEAM_ID", "LINEAR_WEBHOOK_SECRET"],
      connectionTest: "GET /api/integrations/test?provider=linear",
      permissions: [
        {
          id: "read_issues",
          label: "Read issues",
          severity: "required",
          detail: "Read issue title, state, and description checkboxes.",
        },
        {
          id: "webhook_secret",
          label: "Webhook signing secret",
          severity: "required",
          detail: "Linear-Signature HMAC-SHA256 validation.",
        },
      ],
    },
    {
      provider: "vercel",
      title: "Vercel",
      summary: "Token for deployment backfill plus deployment lifecycle webhooks.",
      configured: vercelLiveEnabled(env) || vercelWebhookConfigured(env),
      envVars: [
        "VERCEL_TOKEN",
        "VERCEL_TEAM_ID",
        "VERCEL_PROJECT_ID",
        "VERCEL_WEBHOOK_SECRET",
      ],
      connectionTest: "GET /api/integrations/test?provider=vercel",
      permissions: [
        {
          id: "deployments_read",
          label: "Deployments: Read",
          severity: "required",
          detail: "List and inspect deployment readyState / URLs.",
        },
        {
          id: "webhook_secret",
          label: "Webhook signing secret",
          severity: "required",
          detail: "x-vercel-signature HMAC-SHA1 validation.",
        },
      ],
    },
    {
      provider: "webhook",
      title: "Generic signed evidence webhook",
      summary:
        "Manual or editor/agent evidence via RELEASE_ROOM_WEBHOOK_SECRET.",
      configured: webhookConfigured(env),
      envVars: ["RELEASE_ROOM_WEBHOOK_SECRET", "RELEASE_ROOM_EVIDENCE_SECRET"],
      connectionTest: "GET /api/integrations/test?provider=webhook",
      permissions: [
        {
          id: "shared_secret",
          label: "Shared HMAC secret (≥16 chars)",
          severity: "required",
          detail:
            "Signs x-release-room-signature over raw body bytes. Retry-safe via eventId.",
        },
      ],
    },
    {
      provider: "editor",
      title: "Editor / agent CLI",
      summary:
        "Retry-safe CLI reporting approved work evidence (Cursor, Codex, Claude Code, scripts).",
      configured: Boolean(env.webhookSecret || env.evidenceSecret),
      envVars: [
        "RELEASE_ROOM_EVIDENCE_SECRET",
        "RELEASE_ROOM_WEBHOOK_SECRET",
        "RELEASE_ROOM_URL",
      ],
      connectionTest: "npm run release-room -- report --dry-run",
      permissions: [
        {
          id: "evidence_secret",
          label: "Evidence signing secret",
          severity: "required",
          detail:
            "Same HMAC contract as generic webhook. CLI retries on 5xx/429.",
        },
      ],
    },
  ];
}
