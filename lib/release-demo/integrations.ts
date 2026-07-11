/** Workspace integration connection records for setup UI (no secrets in the browser). */

export type IntegrationId =
  | "github"
  | "linear"
  | "vercel"
  | "editor";

export type IntegrationHealth =
  | "connected"
  | "needs_setup"
  | "stale"
  | "error";

export interface IntegrationConnection {
  id: IntegrationId;
  name: string;
  blurb: string;
  health: IntegrationHealth;
  /** Human-readable account / install target — never a secret. */
  accountLabel: string;
  lastEventAt?: string;
  freshnessLabel: string;
  setupSteps: string[];
}

export interface SetupChecklistItem {
  id: string;
  label: string;
  detail: string;
  done: boolean;
  href?: string;
}

export const DEMO_INTEGRATIONS: IntegrationConnection[] = [
  {
    id: "github",
    name: "GitHub",
    blurb: "PR checks, check runs, and webhook-driven engineering evidence.",
    health: "connected",
    accountLabel: "acme/commerce · App install",
    lastEventAt: "2026-07-11T02:40:00.000Z",
    freshnessLabel: "Live · last event 12m ago",
    setupSteps: [
      "Install the Release Room GitHub App on the target org",
      "Select repositories that ship release candidates",
      "Confirm check-run permissions and webhook delivery",
    ],
  },
  {
    id: "linear",
    name: "Linear",
    blurb: "Intent, acceptance criteria, and issue state for go / no-go.",
    health: "connected",
    accountLabel: "Acme workspace",
    lastEventAt: "2026-07-11T01:10:00.000Z",
    freshnessLabel: "Live · last event 2h ago",
    setupSteps: [
      "Connect the Linear workspace OAuth app",
      "Map the release project / team",
      "Enable issue and status webhooks",
    ],
  },
  {
    id: "vercel",
    name: "Vercel",
    blurb: "Preview and production deployment readiness signals.",
    health: "stale",
    accountLabel: "acme · Project commerce",
    lastEventAt: "2026-07-10T18:22:00.000Z",
    freshnessLabel: "Stale · last deploy event 18h ago",
    setupSteps: [
      "Link the Vercel team and project",
      "Register the deployment webhook receiver",
      "Verify preview Ready events land on a candidate",
    ],
  },
  {
    id: "editor",
    name: "Editor / agent evidence",
    blurb:
      "Signed CLI ingestion from Cursor, Codex, Claude Code, and local scripts.",
    health: "needs_setup",
    accountLabel: "No agent key issued",
    freshnessLabel: "Not connected",
    setupSteps: [
      "Generate a workspace agent ingest key (server-side only)",
      "Install the Release Room evidence CLI",
      "Submit a signed editor run against a release candidate",
    ],
  },
];

export const FIRST_RUN_CHECKLIST: SetupChecklistItem[] = [
  {
    id: "workspace",
    label: "Confirm workspace",
    detail: "Acme · Private MVP is active for this demo.",
    done: true,
  },
  {
    id: "github",
    label: "Connect GitHub",
    detail: "App install ready on acme/commerce.",
    done: true,
    href: "/setup#integration-github",
  },
  {
    id: "linear",
    label: "Connect Linear",
    detail: "Intent evidence is flowing.",
    done: true,
    href: "/setup#integration-linear",
  },
  {
    id: "vercel",
    label: "Refresh Vercel",
    detail: "Deployment events are stale — re-verify the webhook.",
    done: false,
    href: "/setup#integration-vercel",
  },
  {
    id: "editor",
    label: "Wire editor evidence",
    detail: "Issue a CLI key and capture one signed agent run.",
    done: false,
    href: "/setup#integration-editor",
  },
  {
    id: "candidate",
    label: "Open a release candidate",
    detail: "Walk the blocked Checkout rewrite evidence room.",
    done: false,
    href: "/releases/rc-104",
  },
];

export function integrationHealthLabel(health: IntegrationHealth): string {
  switch (health) {
    case "connected":
      return "Connected";
    case "needs_setup":
      return "Needs setup";
    case "stale":
      return "Stale";
    case "error":
      return "Error";
  }
}

export function setupProgress(items: SetupChecklistItem[] = FIRST_RUN_CHECKLIST): {
  done: number;
  total: number;
  complete: boolean;
} {
  const done = items.filter((i) => i.done).length;
  return { done, total: items.length, complete: done === items.length };
}
