# EdgeLens Command Center

Lightweight operating dashboard for the EdgeLens MVP launch sprint. Keep this file current enough that a human, Cursor agent, or Codex agent can understand the project state in one scan.

## Mission

Help React teams run a deterministic, client-side pre-flight check on AI-generated React/shadcn components — focused on **state completeness** and common shadcn/Radix accessibility risks — without backend services, secrets, or overclaimed compliance.

## Product positioning

- **What it is:** A local deterministic pre-flight checker for generated React/shadcn UI (state completeness hero; supporting static JSX/shadcn and preview DOM checks).
- **Who it is for:** Builders shipping AI-generated shadcn/React components who want a fast sanity check before review or QA.
- **What it is not:** A broad accessibility auditor, WCAG checker, Storybook replacement, axe alternative, generic React analyzer, AI code-review tool, backend product, or LLM analyzer.
- **Launch message:** EdgeLens helps catch missing loading, empty, error, disabled, focus, active, selected states and common shadcn/Radix accessibility gotchas before components ship.
- **Demo story:** The component looked done on the happy path until EdgeLens forced the states AI forgot.

## Current sprint status

| Area | Status | Notes | Next action |
| --- | --- | --- | --- |
| Core analyzer | In review | Static checks and preview DOM checks are separated; axe-core integration needs local QA. | Validate SHE-7 locally and capture any cleanup. |
| Recording demo | Done | Clean recording route exists for launch/demo capture. | Use route for final demo pass with state-forcing story. |
| Launch assets | Done | Launch assets document is available; SHE-19 narrows positioning. | Keep copy aligned with README and public launch notes. |
| README/repo polish | In progress | README launch polish + prior-art section (SHE-19). | Finish cleanup and verify links/commands. |
| MVP positioning | In progress | SHE-19: state completeness wedge, limitation copy, prior art. | Land PR; align UI + docs. |
| Command center | In progress | Dashboard docs are being added in SHE-11. | Keep status tables updated after PR merge. |

## Completed work

| Issue | Work | Status | Notes |
| --- | --- | --- | --- |
| SHE-6 | Report trust labeling | Done | Static, preview DOM, and rule-based fix categories are clearer. |
| SHE-8 | Recording route | Done | Demo-ready route is available for clean launch recordings. |
| SHE-10 | Launch assets | Done | Launch assets document exists for launch coordination. |

## In-review / active work

| Issue | Work | Status | Owner/agent | Review focus |
| --- | --- | --- | --- | --- |
| SHE-7 | axe-core preview DOM integration | In review / needs local QA | Codex / Cursor | Run local QA against examples and confirm preview findings are understandable. |
| SHE-9 | README polish | In progress / cleanup | Codex / human | Confirm README positioning, commands, screenshots/assets, and launch-safe claims. |
| SHE-11 | Command center dashboard | In progress | Codex | Add dashboard docs and keep them concise. |
| SHE-19 | Narrow MVP positioning (state completeness) | In progress | Cursor | UI layers, limitation copy, README prior art, launch framing. |

## Next priorities

1. Land SHE-19 positioning: state completeness hero, four check layers, limitation copy, prior art.
2. Complete local QA for SHE-7 and resolve any launch-blocking analyzer issues.
3. Finish SHE-9 README cleanup so repo visitors can understand and run EdgeLens quickly.
4. Keep launch copy in README, `docs/launch.md`, and this command center aligned.
5. Use the recording route to capture the forced-states demo story.
6. Before public launch, perform final lint/build/smoke checks and update release status.

## Launch blockers

| Blocker | Status | Owner/agent | Exit criteria |
| --- | --- | --- | --- |
| SHE-7 local QA | Open | Codex / Cursor | Preview DOM and axe-core checks pass manual QA on representative examples. |
| SHE-9 README cleanup | Open | Codex / human | README is launch-ready, accurate, and free of unsupported traction claims. |
| Final release checklist | Open | Human / Codex | `docs/release-checklist.md` is reviewed and all launch-critical boxes are complete. |

## Agent responsibilities

| Agent/role | Responsibilities | Handoff notes |
| --- | --- | --- |
| Codex | Implement scoped issue work, update docs, run available checks, commit changes, and prepare PR summaries. | Do not invent metrics, traction, or unsupported product claims. Avoid forbidden phrases (first/only/WCAG compliant/accessibility auditor/etc.). |
| Cursor | Assist with local app iteration, UI cleanup, positioning copy, and manual QA using the dev server. | Prefer `npm run dev` for browser validation. |
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
