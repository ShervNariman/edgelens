# EdgeLens Command Center

Lightweight operating dashboard for the EdgeLens MVP launch sprint. Keep this file current enough that a human, Cursor agent, or Codex agent can understand the project state in one scan.

**Manager loop:** see [`docs/manager-loop.md`](docs/manager-loop.md) for the full operating playbook (includes **code health and stability review**). Visual dashboard: `/internal/command-center` (data in `lib/command-center-data.ts`).

**Snapshot date:** 2026-07-12 (SHE-148 Milestone 1 baseline in progress) · Report: [`docs/milestone-1.md`](docs/milestone-1.md)

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
| Core analyzer | Done | Trust labels + axe preview DOM verified; SHE-7 closed. | Protect labeling in future PRs. |
| Recording demo | Done | `/record/edgelens` stable on `main` (SHE-8); SHE-16 confirmed clean load. | Capture final launch recording with forced-states story. |
| Launch assets | Done | `docs/launch.md` merged (SHE-10); SHE-19 framing on `main`. | Replace `<repo link>` / `<demo link>` placeholders before public post. |
| README/repo polish | Done | Launch-ready README + prior art on `main` (SHE-9 / SHE-19). | Spot-check links/commands before announce. |
| MVP positioning | Done | SHE-19 merged via PR #16. | Keep UI + docs aligned. |
| Release checklist | Active | Human launch gates remain; SHE-148 hardens CI/tests/license. | Finish SHE-148 QA; then demo, URLs, nariman.dev, public launch. |
| Milestone 1 baseline | Active | SHE-148 — Vitest, determinism×5, CodeQL/Dependabot, MIT, isolation. | Independent QA + senior code-health review (do not merge early). |
| Command center | Done | Docs (SHE-11) + visual route (SHE-12) on `main`. | Keep tables + `lib/command-center-data.ts` synced after each merge. |
| Manager ops loop | Done | SHE-15 + SHE-21 code-health review on `main` (PR #14 / #16). | Run loop + code health pass after each sprint change. |
| Light UI | Done | MVP forced to light mode (SHE-14); reconfirmed in SHE-16. | Protect in future PRs. |
| Preview polish | Done | Dialog badge overlap fixed (SHE-13). | Re-checked during SHE-16 QA. |

## Completed work

| Issue | Work | Status | Notes |
| --- | --- | --- | --- |
| SHE-6 | Report trust labeling | Done | Static, preview DOM, and rule-based fix categories separated. |
| SHE-7 | axe-core preview DOM integration | Done | Preview DOM checks labeled; local QA accepted. |
| SHE-8 | Recording route | Done | `/record/edgelens` available for clean launch recordings. |
| SHE-9 | README polish | Done | Launch-ready README and repo polish merged (PR #8). |
| SHE-10 | Launch assets | Done | `docs/launch.md` exists for launch coordination. |
| SHE-11 | Command center docs | Done | `COMMAND_CENTER.md`, progress, release checklist. |
| SHE-12 | Visual command center | Done | `/internal/command-center` route shipped (PR #7). |
| SHE-13 | Dialog preview badge overlap | Done | Badges no longer overlay Dialog trigger (PR #11). |
| SHE-14 | Force MVP light mode | Done | Light-only UI for launch consistency (PR #12). |
| SHE-15 | Manager agent operating loop | Done | Playbook + command center truth sync (PR #14). |
| SHE-19 | Narrow MVP positioning | Done | State completeness hero + prior art (PR #16). |
| SHE-21 | Code health & stability review | Done | Manager-loop code-health section landed (PR #16). |

## In-flight work

| Issue | Work | Status | Owner/agent | Review focus |
| --- | --- | --- | --- | --- |
| SHE-148 | Milestone 1 production baseline | In progress | Cursor | Tests, CI, determinism, license, isolation, CodeQL/Dependabot. |

## Next priorities

1. Complete independent QA on SHE-148 (commands in `docs/milestone-1.md`); do not merge until signed off.
2. Record the launch demo via `/record/edgelens` (forced-states story) and approve screenshots.
3. Replace launch URL placeholders and complete nariman.dev readiness.
4. Run remaining public-launch checklist boxes only after demo + URLs clear.

## Launch blockers

Human launch gates only (engineering blockers cleared):

| Blocker | Status | Owner/agent | Exit criteria |
| --- | --- | --- | --- |
| Launch demo capture | Open | Sherv | Recording or screenshots approved from `/record/edgelens`. |
| Launch URL placeholders | Open | Codex / Sherv | Public repo/demo links substituted in `docs/launch.md` before posting. |
| nariman.dev readiness | Open | Sherv | Destination, copy, and publish readiness confirmed. |
| Public launch steps | Open | Sherv | Linear statuses aligned; announce only after demo + links verified. |

## Duplicate PR log (resolved)

| Issue | Winner | Closed duplicate(s) |
| --- | --- | --- |
| SHE-12 | PR #7 | PR #6, PR #9 |
| SHE-13 | PR #11 | PR #10 |
| SHE-14 | PR #12 | PR #13 |

Open PRs at last snapshot: **PR #17 (SHE-16)** only. PR #16 (SHE-19 / SHE-21) is merged. Open PRs → **0** after PR #17 merges.

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
