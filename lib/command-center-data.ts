/**
 * Hardcoded project-ops snapshot for /internal/command-center.
 * Source of truth until Linear/GitHub APIs are wired; update manually with sprint status.
 * Manager playbook: docs/manager-loop.md
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
      value: "8 / 10",
      detail: "Done · SHE-7 QA · SHE-15 ops",
      progress: 80,
      tone: "success",
    },
    {
      id: "launch",
      label: "Launch readiness",
      value: "86%",
      detail: "Product core shipped · QA + checklist remain",
      progress: 86,
      tone: "warning",
    },
    {
      id: "blockers",
      label: "Open blockers",
      value: "4",
      detail: "SHE-7 QA · checklist · demo · URLs",
      tone: "warning",
    },
    {
      id: "prs",
      label: "Open PRs",
      value: "0",
      detail: "Duplicates closed · main green",
      tone: "success",
    },
  ],
  issues: [
    {
      id: "SHE-6",
      title: "Separate static checks, preview DOM checks, and rule-based fixes",
      status: "done",
      owner: "Cursor",
      priority: "P0",
      notes: "Report trust labeling shipped (PR #2)",
      href: "https://linear.app/sherv-nariman/issue/SHE-6",
    },
    {
      id: "SHE-8",
      title: "Add clean recording route for launch demo",
      status: "done",
      owner: "Cursor",
      priority: "P0",
      notes: "/record/edgelens live (PR #3)",
      href: "https://linear.app/sherv-nariman/issue/SHE-8",
    },
    {
      id: "SHE-10",
      title: "Add launch assets document",
      status: "done",
      owner: "Codex",
      priority: "P0",
      notes: "docs/launch.md merged (PR #4)",
      href: "https://linear.app/sherv-nariman/issue/SHE-10",
    },
    {
      id: "SHE-9",
      title: "Create launch-ready README and repo polish",
      status: "done",
      owner: "Codex",
      priority: "P0",
      notes: "README polish merged (PR #8)",
      href: "https://linear.app/sherv-nariman/issue/SHE-9",
    },
    {
      id: "SHE-11",
      title: "Create project command center dashboard",
      status: "done",
      owner: "Codex",
      priority: "P1",
      notes: "Docs + checklists merged (PR #5)",
      href: "https://linear.app/sherv-nariman/issue/SHE-11",
    },
    {
      id: "SHE-12",
      title: "Add visual command center dashboard route",
      status: "done",
      owner: "Cursor",
      priority: "P1",
      notes: "/internal/command-center (PR #7); dups closed",
      href: "https://linear.app/sherv-nariman/issue/SHE-12",
    },
    {
      id: "SHE-13",
      title: "Fix live preview badge overlap in Dialog demo",
      status: "done",
      owner: "Cursor",
      priority: "P1",
      notes: "Merged PR #11; duplicate #10 closed",
      href: "https://linear.app/sherv-nariman/issue/SHE-13",
    },
    {
      id: "SHE-14",
      title: "Force MVP UI to light mode",
      status: "done",
      owner: "Cursor",
      priority: "P0",
      notes: "Merged PR #12; duplicate #13 closed",
      href: "https://linear.app/sherv-nariman/issue/SHE-14",
    },
    {
      id: "SHE-7",
      title: "Improve axe-core preview DOM check integration",
      status: "in_review",
      owner: "Sherv",
      priority: "P0",
      notes: "Code on main — needs local QA pass",
      href: "https://linear.app/sherv-nariman/issue/SHE-7",
    },
    {
      id: "SHE-15",
      title: "Set up manager agent operating loop",
      status: "in_progress",
      owner: "Cursor",
      priority: "P0",
      notes: "Playbook + command center truth refresh",
      href: "https://linear.app/sherv-nariman/issue/SHE-15",
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
        "Integration is on main; confirm preview DOM checks label correctly and do not regress analyzer trust copy.",
    },
    {
      id: "b2",
      title: "Final release checklist not fully verified",
      severity: "medium",
      owner: "Sherv",
      detail:
        "docs/release-checklist.md still has unchecked launch-critical boxes.",
    },
    {
      id: "b3",
      title: "Launch demo capture not recorded",
      severity: "medium",
      owner: "Sherv",
      relatedIssue: "SHE-8",
      detail:
        "/record/edgelens is stable; human recording/screenshots still pending approval.",
    },
    {
      id: "b4",
      title: "Launch asset URL placeholders",
      severity: "low",
      owner: "Codex",
      relatedIssue: "SHE-10",
      detail:
        "docs/launch.md still contains <repo link> / <demo link> placeholders.",
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
          note: "SHE-7 needs local QA",
        },
        {
          id: "p6",
          label: "MVP light UI only",
          status: "done",
          note: "SHE-14",
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
        {
          id: "d4",
          label: "Final demo recording approved",
          status: "todo",
          note: "Human capture pending",
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
          status: "done",
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
          status: "done",
          note: "SHE-9",
        },
        {
          id: "doc4",
          label: "Manager operating loop documented",
          status: "partial",
          note: "SHE-15",
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
          status: "done",
          note: "SHE-11 / SHE-12",
        },
        {
          id: "q5",
          label: "No open duplicate PRs",
          status: "done",
          note: "SHE-12/13/14 dups closed",
        },
      ],
    },
  ],
  agents: [
    {
      id: "sherv",
      name: "Sherv",
      role: "Owner · PM · local QA",
      focus: "SHE-7 local QA, release checklist, launch capture",
      activeIssues: ["SHE-7"],
      capacity: "focused",
      nextUp: "Local QA pass on axe-core preview DOM integration",
    },
    {
      id: "cursor",
      name: "Cursor",
      role: "High-context UI & implementation",
      focus: "Manager loop + UI/analyzer follow-ups",
      activeIssues: ["SHE-15"],
      capacity: "focused",
      nextUp: "Land SHE-15; fix any SHE-7 QA findings if filed",
    },
    {
      id: "codex",
      name: "Codex",
      role: "Scoped background implementation",
      focus: "Docs polish, placeholders, checklists",
      activeIssues: [],
      capacity: "available",
      nextUp: "Replace launch URL placeholders once destinations are final",
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
      action: "Land manager loop playbook + sync command center (SHE-15)",
      owner: "Cursor",
      relatedIssue: "SHE-15",
      urgency: "now",
    },
    {
      id: "a3",
      action: "Walk docs/release-checklist.md and verify launch-critical boxes",
      owner: "Sherv",
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
      action: "Replace launch URL placeholders in docs/launch.md",
      owner: "Codex",
      relatedIssue: "SHE-10",
      urgency: "soon",
    },
    {
      id: "a6",
      action: "Publish launch post/thread using docs/launch.md assets",
      owner: "Sherv",
      urgency: "later",
    },
  ],
};
