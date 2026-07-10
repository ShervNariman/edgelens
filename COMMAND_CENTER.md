# EdgeLens Command Center

Lightweight operating dashboard for the EdgeLens MVP launch sprint. Keep this file current enough that a human, Cursor agent, or Codex agent can understand the project state in one scan.

## Mission

Help React teams quickly audit UI components for interaction-state gaps and accessibility issues directly in the browser, without backend services, secrets, or generated claims.

## Product positioning

- **What it is:** A rule-based, client-side Next.js app for analyzing React UI component code and preview DOM output.
- **Who it is for:** Builders who want fast feedback on accessibility, interaction states, and UI quality before launch.
- **What it is not:** A backend product, database-backed workflow, LLM analyzer, or automated compliance guarantee.
- **Launch message:** Practical component QA for visible states, accessible markup, and preview-derived checks.

## Current sprint status

| Area | Status | Notes | Next action |
| --- | --- | --- | --- |
| Core analyzer | In review | Static checks and preview DOM checks are separated; axe-core integration needs local QA. | Validate SHE-7 locally and capture any cleanup. |
| Recording demo | Done | Clean recording route exists for launch/demo capture. | Use route for final demo pass. |
| Launch assets | Done | Launch assets document is available. | Keep copy aligned with README and public launch notes. |
| README/repo polish | In progress | README launch polish is underway. | Finish cleanup and verify links/commands. |
| Command center | In progress | Dashboard docs are being added in SHE-11. | Keep status tables updated after PR merge. |

## Completed work

| Issue | Work | Status | Notes |
| --- | --- | --- | --- |
| SHE-6 | Report trust labeling | Done | Static, preview DOM, and rule-based fix categories are clearer. |
| SHE-8 | Recording route | Done | Demo-ready route is available for clean launch recordings. |
| SHE-10 | Launch assets | Done | Launch assets document exists for launch coordination. |

## In-review work

| Issue | Work | Status | Owner/agent | Review focus |
| --- | --- | --- | --- | --- |
| SHE-7 | axe-core preview DOM integration | In review / needs local QA | Codex / Cursor | Run local QA against examples and confirm preview findings are understandable. |
| SHE-9 | README polish | In progress / cleanup | Codex / human | Confirm README positioning, commands, screenshots/assets, and launch-safe claims. |
| SHE-11 | Command center dashboard | In progress | Codex | Add dashboard docs and keep them concise. |

## Next priorities

1. Complete local QA for SHE-7 and resolve any launch-blocking analyzer issues.
2. Finish SHE-9 README cleanup so repo visitors can understand and run EdgeLens quickly.
3. Keep launch copy in README, `docs/launch.md`, and this command center aligned.
4. Use the recording route to capture or verify a clean launch demo.
5. Before public launch, perform final lint/build/smoke checks and update release status.

## Launch blockers

| Blocker | Status | Owner/agent | Exit criteria |
| --- | --- | --- | --- |
| SHE-7 local QA | Open | Codex / Cursor | Preview DOM and axe-core checks pass manual QA on representative examples. |
| SHE-9 README cleanup | Open | Codex / human | README is launch-ready, accurate, and free of unsupported traction claims. |
| Final release checklist | Open | Human / Codex | `docs/release-checklist.md` is reviewed and all launch-critical boxes are complete. |

## Agent responsibilities

| Agent/role | Responsibilities | Handoff notes |
| --- | --- | --- |
| Codex | Implement scoped issue work, update docs, run available checks, commit changes, and prepare PR summaries. | Do not invent metrics, traction, or unsupported product claims. |
| Cursor | Assist with local app iteration, UI cleanup, and manual QA using the dev server. | Prefer `npm run dev` for browser validation. |
| Human owner | Prioritize Linear issues, review PRs, approve launch messaging, and decide public launch timing. | Keep Linear statuses and blockers aligned with this dashboard. |

## Definition of done

A sprint item is done when:

- The requested files or code are updated within scope.
- App behavior remains client-side only unless a future issue explicitly changes that constraint.
- Markdown tables render cleanly in GitHub when docs are changed.
- Available checks are run and documented in the PR or Linear update.
- Linear issue status, PR status, and this dashboard are aligned.
- Any known follow-up is captured as a next action instead of left implicit.

## How to update this file

1. Update status tables when Linear issue state, PR state, or launch blockers change.
2. Keep entries concise: prefer one-line status, owner, and next action fields.
3. Link detailed plans elsewhere; use this page as an at-a-glance dashboard.
4. Do not add unsupported claims about users, stars, revenue, adoption, or compliance.
5. When an issue closes, move it from active/in-review sections into completed work.
