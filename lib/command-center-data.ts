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
    "Ship a demo-ready pre-flight checker with state completeness as the hero, trustworthy report layers, recording route, launch docs, and polished README.",
  metrics: [
    {
      id: "issues",
      label: "Issue progress",
      value: "12 / 13",
      detail: "SHE-16 active · SHE-7/19/21 done",
      progress: 92,
      tone: "success",
    },
    {
      id: "launch",
      label: "Launch readiness",
      value: "94%",
      detail: "Engineering clear · human launch gates remain",
      progress: 94,
      tone: "warning",
    },
    {
      id: "blockers",
      label: "Open blockers",
      value: "4",
      detail: "Demo · URLs · nariman.dev · public launch",
      tone: "warning",
    },
    {
      id: "prs",
      label: "Open PRs",
      value: "1",
      detail: "PR #17 SHE-16 · → 0 after merge",
      tone: "warning",
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
      id: "SHE-7",
      title: "Improve axe-core preview DOM check integration",
      status: "done",
      owner: "Sherv",
      priority: "P0",
      notes: "Preview DOM labeling + local QA accepted",
      href: "https://linear.app/sherv-nariman/issue/SHE-7",
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
      id: "SHE-15",
      title: "Set up manager agent operating loop",
      status: "done",
      owner: "Cursor",
      priority: "P0",
      notes: "Playbook + command center truth refresh (PR #14)",
      href: "https://linear.app/sherv-nariman/issue/SHE-15",
    },
    {
      id: "SHE-16",
      title: "Final local QA and release checklist",
      status: "in_progress",
      owner: "Cursor",
      priority: "P0",
      notes: "Active PR #17 — only open PR; → 0 after merge",
      href: "https://linear.app/sherv-nariman/issue/SHE-16",
    },
    {
      id: "SHE-19",
      title: "Narrow MVP positioning around state completeness pre-flight checks",
      status: "done",
      owner: "Cursor",
      priority: "P0",
      notes: "Merged PR #16 — state hero · four layers · prior art",
      href: "https://linear.app/sherv-nariman/issue/SHE-19",
    },
    {
      id: "SHE-21",
      title: "Code health & stability review in manager loop",
      status: "done",
      owner: "Cursor",
      priority: "P1",
      notes: "Merged via PR #16 — manager-loop code-health section",
      href: "https://linear.app/sherv-nariman/issue/SHE-21",
    },
  ],
  blockers: [
    {
      id: "b3",
      title: "Launch demo capture not recorded",
      severity: "medium",
      owner: "Sherv",
      relatedIssue: "SHE-8",
      detail:
        "/record/edgelens is stable and SHE-16-verified; human recording/screenshots still pending approval.",
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
    {
      id: "b5",
      title: "nariman.dev readiness",
      severity: "low",
      owner: "Sherv",
      detail:
        "Destination page, link copy, and publish readiness still pending.",
    },
    {
      id: "b6",
      title: "Public launch steps",
      severity: "medium",
      owner: "Sherv",
      detail:
        "Align Linear statuses and announce only after demo + repo/demo links are verified.",
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
          note: "SHE-16 QA",
        },
        {
          id: "p2",
          label: "State / static / preview / fix layers separated",
          status: "done",
          note: "SHE-6 + SHE-19",
        },
        {
          id: "p3",
          label: "Five launch-demo examples produce useful reports",
          status: "done",
          note: "SHE-16 smoke + browser",
        },
        {
          id: "p4",
          label: "Fixes tab with copyable before/after snippets",
          status: "done",
        },
        {
          id: "p5",
          label: "State completeness hero + limitation copy",
          status: "done",
          note: "SHE-19 merged",
        },
        {
          id: "p6",
          label: "axe-core preview DOM credibility pass",
          status: "done",
          note: "SHE-7 Done",
        },
        {
          id: "p7",
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
          note: "SHE-8 · rechecked SHE-16",
        },
        {
          id: "d2",
          label: "Live preview state-reactive and type-aware",
          status: "done",
        },
        {
          id: "d3",
          label: "Forced-states demo story in launch assets",
          status: "done",
          note: "docs/launch.md · SHE-19",
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
          label: "Launch-ready README + prior art",
          status: "done",
          note: "SHE-9 + SHE-19 merged",
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
          status: "done",
          note: "SHE-15 + SHE-21",
        },
        {
          id: "doc5",
          label: "Release checklist walked (local QA)",
          status: "partial",
          note: "SHE-16 / PR #17 in flight",
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
          note: "SHE-16",
        },
        {
          id: "q2",
          label: "npm run build passes",
          status: "done",
          note: "SHE-16",
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
        {
          id: "q6",
          label: "npm run lint + smoke-examples",
          status: "done",
          note: "SHE-16",
        },
      ],
    },
  ],
  agents: [
    {
      id: "sherv",
      name: "Sherv",
      role: "Owner · PM · local QA",
      focus: "Demo capture, URLs, nariman.dev, public launch",
      activeIssues: [],
      capacity: "focused",
      nextUp: "Approve launch demo; finish human launch gates",
    },
    {
      id: "cursor",
      name: "Cursor",
      role: "High-context UI & implementation",
      focus: "SHE-16 release checklist snapshot (PR #17)",
      activeIssues: ["SHE-16"],
      capacity: "focused",
      nextUp: "Land PR #17; open PRs → 0",
    },
    {
      id: "codex",
      name: "Codex",
      role: "Scoped background implementation",
      focus: "Docs polish, placeholders",
      activeIssues: [],
      capacity: "available",
      nextUp: "Replace launch URL placeholders once destinations are final",
    },
  ],
  nextActions: [
    {
      id: "a0",
      action: "Merge SHE-16 / PR #17 (open PRs → 0)",
      owner: "Sherv",
      relatedIssue: "SHE-16",
      urgency: "now",
    },
    {
      id: "a3",
      action: "Record launch demo via /record/edgelens and approve screenshots",
      owner: "Sherv",
      relatedIssue: "SHE-8",
      urgency: "soon",
    },
    {
      id: "a4",
      action: "Replace launch URL placeholders in docs/launch.md",
      owner: "Codex",
      relatedIssue: "SHE-10",
      urgency: "soon",
    },
    {
      id: "a5",
      action: "Complete nariman.dev readiness and public launch steps",
      owner: "Sherv",
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
