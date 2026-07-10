# EdgeLens Progress Tracker

Use this table as the source of truth for launch-sprint issue status across Linear, GitHub, Cursor, and Codex. Keep rows short so future agents can scan quickly.

| Issue | Workstream | Status | Owner/agent | PR status | Notes | Next action |
| --- | --- | --- | --- | --- | --- | --- |
| [SHE-6](https://linear.app/sherv-nariman/issue/SHE-6/edgelens-separate-static-checks-preview-dom-checks-and-rule-based) | Report trust labeling | Done | Codex | Merged / done | Static checks, preview DOM checks, and rule-based fixes are separated for clearer trust labeling. | Monitor for wording drift as reports evolve. |
| [SHE-8](https://linear.app/sherv-nariman/issue/SHE-8/edgelens-add-clean-recording-route-for-launch-demo) | Recording route | Done | Codex | Merged / done | Clean demo route is available for launch recording. | Use route during final demo QA with forced-states story. |
| [SHE-10](https://linear.app/sherv-nariman/issue/SHE-10/edgelens-add-launch-assets-document) | Launch assets | Done | Codex | Merged / done | Launch assets document exists for copy and coordination. | Keep assets aligned with SHE-19 positioning. |
| [SHE-9](https://linear.app/sherv-nariman/issue/SHE-9/edgelens-create-launch-ready-readme-and-repo-polish) | README polish | In progress / cleanup | Codex / human | Active | Repo polish underway; SHE-19 adds prior-art + narrowed claims. | Finish cleanup, verify links, and confirm commands. |
| [SHE-7](https://linear.app/sherv-nariman/issue/SHE-7/edgelens-improve-axe-core-preview-dom-check-integration) | axe-core preview DOM integration | In review / needs local QA | Codex / Cursor | In review | Preview DOM integration needs local QA before launch confidence. | Run representative examples through local app and capture any fixes. |
| SHE-11 | Command center dashboard | In progress | Codex | Draft PR planned | Adds `COMMAND_CENTER.md`, `docs/progress.md`, and `docs/release-checklist.md`. | Review dashboard docs and keep status current after merge. |
| [SHE-19](https://linear.app/sherv-nariman/issue/SHE-19/edgelens-narrow-mvp-positioning-around-state-completeness-pre) | MVP positioning (state completeness) | In progress | Cursor | Draft PR | Narrow wedge: pre-flight state checks; a11y supporting; limitation copy; prior art. | Land UI + docs; validate lint/typecheck/build. |

## Recommended Linear views

| View | Filter/grouping | Purpose |
| --- | --- | --- |
| Launch sprint board | Project: EdgeLens MVP Launch Sprint, grouped by status | See active, blocked, in-review, and done launch work. |
| Agent-owned work | Labels: `codex`, `edgelens`, `docs`; grouped by assignee/status | Track work that can be picked up by Codex or Cursor. |
| Release readiness | Issues SHE-7, SHE-9, SHE-11, SHE-19 plus launch blockers | Focus review on items that gate public launch. |

## Update rules

- Update this file when Linear status, owner, PR status, or next action changes.
- Keep the table GitHub-renderable: every row should have the same number of columns.
- Do not record user counts, stars, revenue, or traction unless verified in a future source of truth.
