# EdgeLens Command Center

Lightweight operating dashboard for the EdgeLens MVP launch sprint. Keep this file current enough that a human, Cursor agent, or Codex agent can understand the project state in one scan.

**Manager loop:** see [`docs/manager-loop.md`](docs/manager-loop.md) for the full operating playbook. Visual dashboard: `/internal/command-center` (data in `lib/command-center-data.ts`).

**Snapshot date:** 2026-07-10

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
| Core analyzer | Needs local QA | Static / preview DOM / fix labels shipped; axe-core runner present. | Sherv: validate SHE-7 on representative examples. |
| Recording demo | Done | `/record/edgelens` stable on `main` (SHE-8). | Capture final launch recording with forced-states story. |
| Launch assets | Done | `docs/launch.md` merged (SHE-10); SHE-19 narrows framing. | Replace `<repo link>` / `<demo link>` placeholders before public post. |
| README/repo polish | Done | Launch-ready README merged (SHE-9); SHE-19 adds prior art + wedge. | Spot-check links/commands before announce. |
| MVP positioning | In progress | SHE-19: state completeness wedge, limitation copy, prior art. | Land PR #16; keep UI + docs aligned. |
| Command center | Done | Docs (SHE-11) + visual route (SHE-12) on `main`. | Keep tables + `lib/command-center-data.ts` synced after each merge. |
| Manager ops loop | Done | SHE-15 playbook + truth refresh merged (PR #14). | Run loop after each sprint change. |
| Light UI | Done | MVP forced to light mode (SHE-14). | Protect in future PRs. |
| Preview polish | Done | Dialog badge overlap fixed (SHE-13). | Re-check during SHE-7 QA. |

## Completed work

| Issue | Work | Status | Notes |
| --- | --- | --- | --- |
| SHE-6 | Report trust labeling | Done | Static, preview DOM, and rule-based fix categories separated. |
| SHE-8 | Recording route | Done | `/record/edgelens` available for clean launch recordings. |
| SHE-9 | README polish | Done | Launch-ready README and repo polish merged (PR #8). |
| SHE-10 | Launch assets | Done | `docs/launch.md` exists for launch coordination. |
| SHE-11 | Command center docs | Done | `COMMAND_CENTER.md`, progress, release checklist. |
| SHE-12 | Visual command center | Done | `/internal/command-center` route shipped (PR #7). |
| SHE-13 | Dialog preview badge overlap | Done | Badges no longer overlay Dialog trigger (PR #11). |
| SHE-14 | Force MVP light mode | Done | Light-only UI for launch consistency (PR #12). |
| SHE-15 | Manager agent operating loop | Done | Playbook + command center truth sync (PR #14). |

## In-flight work

| Issue | Work | Status | Owner/agent | Review focus |
| --- | --- | --- | --- | --- |
| SHE-7 | axe-core preview DOM integration | Needs local QA | Sherv (+ Cursor if fixes) | Confirm preview DOM findings are labeled and understandable on examples. |
| SHE-19 | Narrow MVP positioning (state completeness) | In progress | Cursor | UI layers, limitation copy, README prior art, launch framing; reconcile with main. |

## Next priorities

1. Land SHE-19 positioning: state completeness hero, four check layers, limitation copy, prior art.
2. Complete local QA for SHE-7 and file any launch-blocking analyzer fixes.
3. Walk `docs/release-checklist.md` and check only verified boxes.
4. Record the launch demo via `/record/edgelens` (forced-states story).
5. Replace launch URL placeholders and publish only after checklist + QA clear.

## Launch blockers

| Blocker | Status | Owner/agent | Exit criteria |
| --- | --- | --- | --- |
| SHE-7 local QA | Open | Sherv | Preview DOM + axe-core checks pass manual QA on representative examples; labels remain honest. |
| Final release checklist | Open | Sherv | `docs/release-checklist.md` launch-critical boxes verified. |
| Launch demo capture | Open | Sherv | Recording or screenshots approved from `/record/edgelens`. |
| Launch URL placeholders | Open | Codex / Sherv | Public repo/demo links substituted in `docs/launch.md` before posting. |

## Duplicate PR log (resolved)

| Issue | Winner | Closed duplicate(s) |
| --- | --- | --- |
| SHE-12 | PR #7 | PR #6, PR #9 |
| SHE-13 | PR #11 | PR #10 |
| SHE-14 | PR #12 | PR #13 |

Open PRs at last snapshot: **PR #16 (SHE-19)**. Prefer closing loser duplicates immediately after the winner merges.

## Agent responsibilities

| Agent/role | Responsibilities | Handoff notes |
| --- | --- | --- |
| Manager loop | Inspect Linear + GitHub, detect duplicates/blockers, refine issues, recommend merge order, refresh this dashboard. | Follow `docs/manager-loop.md`. |
| Codex | Scoped issue work, docs, checklists, available checks, PR summaries. | Do not invent metrics, traction, or unsupported product claims. Avoid forbidden phrases (WCAG compliant / accessibility auditor / axe alternative / etc.). |
| Cursor | Local app iteration, UI cleanup, analyzer/preview/route work, positioning copy, manual QA via `npm run dev`. | One issue / one branch / one PR. |
| Sherv | Prioritize Linear, approve merges, local QA, launch messaging and timing. | Keep Linear statuses aligned with this dashboard. |

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
3. Mirror material changes into `lib/command-center-data.ts` and `docs/progress.md`.
4. Do not add unsupported claims about users, stars, revenue, adoption, or compliance.
5. When an issue closes, move it from in-flight into completed work.
6. After each manager pass, append or refresh the snapshot date and blockers.
