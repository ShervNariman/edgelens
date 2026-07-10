/**
 * Hardcoded project-ops snapshot for /internal/command-center.
 * Source of truth until Linear/GitHub APIs are wired; update manually with sprint status.
 */

export type IssueStatus =
  | "done"
  | "in_progress"
  | "in_review"
  | "todo"
  | "blocked";

export type IssueOwner = "Sherv" | "Cursor" | "Codex" | "Unassigned";

export type ChecklistStatus = "done" | "partial" | "todo" | "blocked";

export type BlockerSeverity = "high" | "medium" | "low";

export interface SprintMetric {
  id: string;
  label: string;
  value: string;
  detail: string;
  /** 0–100 progress fill when applicable */
  progress?: number;
  tone: "neutral" | "success" | "warning" | "danger";
}

export interface SprintIssue {
  id: string;
  title: string;
  status: IssueStatus;
  owner: IssueOwner;
  priority: "P0" | "P1" | "P2";
  notes: string;
  href?: string;
}

export interface LaunchBlocker {
  id: string;
  title: string;
  severity: BlockerSeverity;
  owner: IssueOwner;
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
  id: string;
  name: IssueOwner;
  role: string;
  focus: string;
  activeIssues: string[];
  capacity: "available" | "focused" | "at_capacity";
  nextUp: string;
}

export interface NextAction {
  id: string;
  action: string;
  owner: IssueOwner;
  relatedIssue?: string;
  urgency: "now" | "soon" | "later";
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
    "Ship a demo-ready analyzer with trustworthy report labeling, recording route, launch docs, and polished README.",
  metrics: [
    {
      id: "issues",
      label: "Issue progress",
      value: "3 / 6",
      detail: "Done · 2 in flight · 1 in review",
      progress: 50,
      tone: "warning",
    },
    {
      id: "launch",
      label: "Launch readiness",
      value: "68%",
      detail: "Product core solid · docs & QA remain",
      progress: 68,
      tone: "warning",
    },
    {
      id: "blockers",
      label: "Open blockers",
      value: "2",
      detail: "Local QA + README cleanup",
      tone: "danger",
    },
    {
      id: "agents",
      label: "Agents active",
      value: "3",
      detail: "Sherv · Cursor · Codex",
      tone: "neutral",
    },
  ],
  issues: [
    {
      id: "SHE-6",
      title: "Separate static checks, preview DOM checks, and rule-based fixes",
      status: "done",
      owner: "Cursor",
      priority: "P0",
      notes: "Report trust labeling shipped",
      href: "https://linear.app/sherv-nariman/issue/SHE-6",
    },
    {
      id: "SHE-8",
      title: "Add clean recording route for launch demo",
      status: "done",
      owner: "Cursor",
      priority: "P0",
      notes: "/record/edgelens live",
      href: "https://linear.app/sherv-nariman/issue/SHE-8",
    },
    {
      id: "SHE-10",
      title: "Add launch assets document",
      status: "done",
      owner: "Codex",
      priority: "P0",
      notes: "docs/launch.md merged",
      href: "https://linear.app/sherv-nariman/issue/SHE-10",
    },
    {
      id: "SHE-9",
      title: "Create launch-ready README and repo polish",
      status: "in_progress",
      owner: "Codex",
      priority: "P0",
      notes: "In progress / cleanup",
      href: "https://linear.app/sherv-nariman/issue/SHE-9",
    },
    {
      id: "SHE-7",
      title: "Improve axe-core preview DOM check integration",
      status: "in_review",
      owner: "Codex",
      priority: "P0",
      notes: "Needs local QA pass",
      href: "https://linear.app/sherv-nariman/issue/SHE-7",
    },
    {
      id: "SHE-11",
      title: "Create project command center dashboard",
      status: "in_progress",
      owner: "Cursor",
      priority: "P1",
      notes: "Visual route in progress (SHE-12)",
      href: "https://linear.app/sherv-nariman/issue/SHE-11",
    },
    {
      id: "SHE-12",
      title: "Add visual command center dashboard route",
      status: "in_progress",
      owner: "Cursor",
      priority: "P1",
      notes: "This dashboard",
      href: "https://linear.app/sherv-nariman/issue/SHE-12",
    },
  ],
  blockers: [
    {
      id: "b1",
      title: "axe-core preview DOM integration needs local QA",
      severity: "high",
      owner: "Sherv",
      relatedIssue: "SHE-7",
      detail:
        "In review — confirm preview DOM checks label correctly and do not regress analyzer trust copy.",
    },
    {
      id: "b2",
      title: "README / repo polish still in cleanup",
      severity: "medium",
      owner: "Codex",
      relatedIssue: "SHE-9",
      detail:
        "Launch-ready README, presentable GitHub surface, and final repo hygiene before public share.",
    },
  ],
  checklist: [
    {
      id: "product",
      area: "Product",
      items: [
        {
          id: "p1",
          label: "Analyzer polished and demo-ready",
          status: "done",
        },
        {
          id: "p2",
          label: "Static / preview DOM / fix labels separated",
          status: "done",
          note: "SHE-6",
        },
        {
          id: "p3",
          label: "Five launch-demo examples produce useful reports",
          status: "done",
        },
        {
          id: "p4",
          label: "Fixes tab with copyable before/after snippets",
          status: "done",
        },
        {
          id: "p5",
          label: "axe-core preview DOM credibility pass",
          status: "partial",
          note: "SHE-7 in review",
        },
      ],
    },
    {
      id: "demo",
      area: "Demo & recording",
      items: [
        {
          id: "d1",
          label: "/record/edgelens capture-friendly route",
          status: "done",
          note: "SHE-8",
        },
        {
          id: "d2",
          label: "Live preview state-reactive and type-aware",
          status: "done",
        },
        {
          id: "d3",
          label: "Launch video / thread assets drafted",
          status: "done",
          note: "docs/launch.md",
        },
      ],
    },
    {
      id: "docs",
      area: "Docs & GitHub",
      items: [
        {
          id: "doc1",
          label: "Launch-ready README",
          status: "partial",
          note: "SHE-9",
        },
        {
          id: "doc2",
          label: "docs/launch.md exists",
          status: "done",
          note: "SHE-10",
        },
        {
          id: "doc3",
          label: "GitHub repo presentable",
          status: "partial",
          note: "Tied to SHE-9",
        },
      ],
    },
    {
      id: "quality",
      area: "Quality gates",
      items: [
        {
          id: "q1",
          label: "npm run typecheck passes",
          status: "done",
        },
        {
          id: "q2",
          label: "npm run build passes",
          status: "done",
        },
        {
          id: "q3",
          label: "No backend / API / LLM in MVP product",
          status: "done",
        },
        {
          id: "q4",
          label: "Command center dashboard route",
          status: "partial",
          note: "SHE-11 / SHE-12",
        },
      ],
    },
  ],
  agents: [
    {
      id: "sherv",
      name: "Sherv",
      role: "Owner · PM · local QA",
      focus: "Acceptance, local QA on SHE-7, launch judgment calls",
      activeIssues: ["SHE-7"],
      capacity: "focused",
      nextUp: "Local QA pass on axe-core preview DOM integration",
    },
    {
      id: "cursor",
      name: "Cursor",
      role: "High-context UI & implementation",
      focus: "Analyzer UX, recording, command center UI",
      activeIssues: ["SHE-11", "SHE-12"],
      capacity: "focused",
      nextUp: "Ship /internal/command-center dashboard",
    },
    {
      id: "codex",
      name: "Codex",
      role: "Scoped background implementation",
      focus: "README, docs, isolated rule/axe work",
      activeIssues: ["SHE-9", "SHE-7"],
      capacity: "at_capacity",
      nextUp: "Finish README polish; support SHE-7 review fixes",
    },
  ],
  nextActions: [
    {
      id: "a1",
      action: "Run local QA on axe-core preview DOM labeling (SHE-7)",
      owner: "Sherv",
      relatedIssue: "SHE-7",
      urgency: "now",
    },
    {
      id: "a2",
      action: "Land visual command center at /internal/command-center",
      owner: "Cursor",
      relatedIssue: "SHE-12",
      urgency: "now",
    },
    {
      id: "a3",
      action: "Finish launch-ready README and GitHub polish",
      owner: "Codex",
      relatedIssue: "SHE-9",
      urgency: "soon",
    },
    {
      id: "a4",
      action: "Record launch demo via /record/edgelens once QA clears",
      owner: "Sherv",
      relatedIssue: "SHE-8",
      urgency: "soon",
    },
    {
      id: "a5",
      action: "Publish launch post/thread using docs/launch.md assets",
      owner: "Sherv",
      urgency: "later",
    },
  ],
};
