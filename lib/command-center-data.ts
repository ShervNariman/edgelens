/**
 * Hardcoded EdgeLens MVP launch sprint snapshot.
 * Source of truth for now — no Linear/GitHub API wiring.
 * Update this object when sprint status changes.
 */

export type IssueStatus =
  | "done"
  | "in_progress"
  | "in_review"
  | "blocked"
  | "todo";

export type IssuePriority = "P0" | "P1" | "P2";

export type AgentName = "Sherv" | "Cursor" | "Codex";

export type ChecklistStatus = "done" | "in_progress" | "todo" | "blocked";

export interface SprintMetric {
  id: string;
  label: string;
  value: string;
  detail: string;
  tone: "neutral" | "good" | "warn" | "bad";
  progress?: number;
}

export interface SprintIssue {
  id: string;
  title: string;
  status: IssueStatus;
  priority: IssuePriority;
  owner: AgentName;
  notes: string;
  href: string;
}

export interface LaunchBlocker {
  id: string;
  title: string;
  severity: "high" | "medium" | "low";
  owner: AgentName;
  relatedIssue?: string;
  detail: string;
}

export interface ChecklistItem {
  id: string;
  label: string;
  status: ChecklistStatus;
  note?: string;
}

export interface ChecklistGroup {
  id: string;
  area: string;
  items: ChecklistItem[];
}

export interface AgentWorkload {
  name: AgentName;
  role: string;
  focus: string;
  activeIssues: string[];
  capacity: "light" | "steady" | "heavy";
}

export interface NextAction {
  id: string;
  title: string;
  owner: AgentName;
  priority: IssuePriority;
  detail: string;
}

export interface CommandCenterData {
  updatedAt: string;
  sprintName: string;
  sprintGoal: string;
  metrics: SprintMetric[];
  issues: SprintIssue[];
  blockers: LaunchBlocker[];
  checklist: ChecklistGroup[];
  agents: AgentWorkload[];
  nextActions: NextAction[];
}

export const commandCenterData: CommandCenterData = {
  updatedAt: "2026-07-10",
  sprintName: "EdgeLens MVP Launch Sprint",
  sprintGoal:
    "Ship a demo-ready analyzer with trustworthy labeling, recording route, launch docs, and polished repo presence.",
  metrics: [
    {
      id: "issues-done",
      label: "Issues done",
      value: "3 / 7",
      detail: "SHE-6 · SHE-8 · SHE-10 closed",
      tone: "good",
      progress: 43,
    },
    {
      id: "in-flight",
      label: "In flight",
      value: "4",
      detail: "SHE-7 review · SHE-9 · SHE-11 · SHE-12",
      tone: "warn",
      progress: 57,
    },
    {
      id: "blockers",
      label: "Launch blockers",
      value: "2",
      detail: "axe QA + README polish remaining",
      tone: "warn",
      progress: 28,
    },
    {
      id: "readiness",
      label: "Launch readiness",
      value: "72%",
      detail: "Core product paths green; docs/QA open",
      tone: "neutral",
      progress: 72,
    },
  ],
  issues: [
    {
      id: "SHE-6",
      title: "Separate static checks, preview DOM checks, and rule-based labels",
      status: "done",
      priority: "P0",
      owner: "Cursor",
      notes: "Report trust labeling shipped",
      href: "https://linear.app/sherv-nariman/issue/SHE-6/edgelens-separate-static-checks-preview-dom-checks-and-rule-based",
    },
    {
      id: "SHE-8",
      title: "Add clean recording route for launch demo",
      status: "done",
      priority: "P0",
      owner: "Cursor",
      notes: "/record/edgelens live",
      href: "https://linear.app/sherv-nariman/issue/SHE-8/edgelens-add-clean-recording-route-for-launch-demo",
    },
    {
      id: "SHE-10",
      title: "Add launch assets document",
      status: "done",
      priority: "P0",
      owner: "Codex",
      notes: "docs/launch.md published",
      href: "https://linear.app/sherv-nariman/issue/SHE-10/edgelens-add-launch-assets-document",
    },
    {
      id: "SHE-9",
      title: "Create launch-ready README and repo polish",
      status: "in_progress",
      priority: "P0",
      owner: "Codex",
      notes: "Cleanup pass still open",
      href: "https://linear.app/sherv-nariman/issue/SHE-9/edgelens-create-launch-ready-readme-and-repo-polish",
    },
    {
      id: "SHE-7",
      title: "Improve axe-core preview DOM check integration",
      status: "in_review",
      priority: "P0",
      owner: "Codex",
      notes: "Needs local QA before merge confidence",
      href: "https://linear.app/sherv-nariman/issue/SHE-7/edgelens-improve-axe-core-preview-dom-check-integration",
    },
    {
      id: "SHE-11",
      title: "Create project command center dashboard",
      status: "in_progress",
      priority: "P1",
      owner: "Codex",
      notes: "Markdown ops docs / progress tracking",
      href: "https://linear.app/sherv-nariman/issue/SHE-11/edgelens-create-project-command-center-dashboard",
    },
    {
      id: "SHE-12",
      title: "Add visual command center dashboard route",
      status: "in_progress",
      priority: "P1",
      owner: "Cursor",
      notes: "This /internal/command-center UI",
      href: "https://linear.app/sherv-nariman/issue/SHE-12/edgelens-add-visual-command-center-dashboard-route",
    },
  ],
  blockers: [
    {
      id: "blocker-axe-qa",
      title: "axe-core preview DOM integration needs local QA",
      severity: "high",
      owner: "Sherv",
      relatedIssue: "SHE-7",
      detail:
        "In review, but launch credibility depends on confirming preview DOM checks behave correctly on demo examples.",
    },
    {
      id: "blocker-readme",
      title: "README / GitHub polish still in cleanup",
      severity: "medium",
      owner: "Codex",
      relatedIssue: "SHE-9",
      detail:
        "Launch-ready README and presentable repo surface are still open before public share.",
    },
  ],
  checklist: [
    {
      id: "product",
      area: "Product",
      items: [
        {
          id: "analyzer-polish",
          label: "Analyzer polished and demo-ready",
          status: "done",
        },
        {
          id: "report-labels",
          label: "Static / preview DOM / rule-based labels separated",
          status: "done",
          note: "SHE-6",
        },
        {
          id: "five-examples",
          label: "5 launch-demo examples produce useful reports",
          status: "done",
        },
        {
          id: "fixes-tab",
          label: "Fixes tab feels useful with copyable snippets",
          status: "done",
        },
        {
          id: "axe-credibility",
          label: "axe-core preview DOM credibility pass",
          status: "in_progress",
          note: "SHE-7 in review",
        },
      ],
    },
    {
      id: "demo",
      area: "Demo & recording",
      items: [
        {
          id: "recording-route",
          label: "/record/edgelens capture route exists",
          status: "done",
          note: "SHE-8",
        },
        {
          id: "demo-flow",
          label: "Demo flow ready for screen capture",
          status: "done",
        },
      ],
    },
    {
      id: "docs",
      area: "Docs & launch",
      items: [
        {
          id: "launch-assets",
          label: "docs/launch.md with scripts and posts",
          status: "done",
          note: "SHE-10",
        },
        {
          id: "readme",
          label: "README is launch-ready",
          status: "in_progress",
          note: "SHE-9",
        },
        {
          id: "github-polish",
          label: "GitHub repo is presentable",
          status: "in_progress",
          note: "SHE-9",
        },
        {
          id: "public-links",
          label: "Replace placeholder repo/demo links in launch assets",
          status: "todo",
        },
      ],
    },
    {
      id: "quality",
      area: "Quality gates",
      items: [
        {
          id: "typecheck",
          label: "npm run typecheck passes",
          status: "done",
        },
        {
          id: "build",
          label: "npm run build passes",
          status: "done",
        },
        {
          id: "no-backend",
          label: "No backend / API / LLM calls in product paths",
          status: "done",
        },
      ],
    },
  ],
  agents: [
    {
      name: "Sherv",
      role: "PM · QA · launch strategy",
      focus: "Local QA on SHE-7, launch framing, acceptance calls",
      activeIssues: ["SHE-7"],
      capacity: "steady",
    },
    {
      name: "Cursor",
      role: "High-context UI implementation",
      focus: "Command center UI, analyzer polish, recording route",
      activeIssues: ["SHE-12"],
      capacity: "steady",
    },
    {
      name: "Codex",
      role: "Scoped docs & integration work",
      focus: "README polish, axe review follow-ups, ops markdown",
      activeIssues: ["SHE-9", "SHE-7", "SHE-11"],
      capacity: "heavy",
    },
  ],
  nextActions: [
    {
      id: "qa-axe",
      title: "Run local QA on axe-core preview DOM checks",
      owner: "Sherv",
      priority: "P0",
      detail: "Validate SHE-7 against the five launch examples before calling it launch-ready.",
    },
    {
      id: "finish-readme",
      title: "Finish README and GitHub polish",
      owner: "Codex",
      priority: "P0",
      detail: "Close SHE-9 so the public repo matches the demo story.",
    },
    {
      id: "ship-command-center-ui",
      title: "Ship /internal/command-center dashboard",
      owner: "Cursor",
      priority: "P1",
      detail: "Land SHE-12 so sprint status is reviewable without opening Linear.",
    },
    {
      id: "fill-public-links",
      title: "Fill final repo/demo URLs in launch assets",
      owner: "Sherv",
      priority: "P1",
      detail: "Replace placeholders in docs/launch.md before publishing posts.",
    },
  ],
};
