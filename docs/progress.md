# EdgeLens Progress Tracker

Use this table as the source of truth for launch-sprint issue status across Linear, GitHub, Cursor, and Codex. Keep rows short so future agents can scan quickly.

**Snapshot date:** 2026-07-12 (SHE-148 in progress) · Manager playbook: [`docs/manager-loop.md`](manager-loop.md) · Milestone 1: [`docs/milestone-1.md`](milestone-1.md)

| Issue | Workstream | Status | Owner/agent | PR status | Notes | Next action |
| --- | --- | --- | --- | --- | --- | --- |
| [SHE-6](https://linear.app/sherv-nariman/issue/SHE-6/edgelens-separate-static-checks-preview-dom-checks-and-rule-based) | Report trust labeling | Done | Cursor | Merged #2 | Static / preview DOM / rule-based fixes separated. | Watch for wording drift. |
| [SHE-7](https://linear.app/sherv-nariman/issue/SHE-7/edgelens-improve-axe-core-preview-dom-check-integration) | axe-core preview DOM | Done | Sherv / Cursor | On `main` | Preview DOM labeling + local QA accepted. | Protect trust copy. |
| [SHE-8](https://linear.app/sherv-nariman/issue/SHE-8/edgelens-add-clean-recording-route-for-launch-demo) | Recording route | Done | Cursor | Merged #3 | `/record/edgelens` on `main`. | Use for final demo capture (forced-states story). |
| [SHE-10](https://linear.app/sherv-nariman/issue/SHE-10/edgelens-add-launch-assets-document) | Launch assets | Done | Codex | Merged #4 | `docs/launch.md` exists; SHE-19 framing on `main`. | Replace URL placeholders before post. |
| [SHE-9](https://linear.app/sherv-nariman/issue/SHE-9/edgelens-create-launch-ready-readme-and-repo-polish) | README polish | Done | Codex | Merged #8 | Launch-ready README + prior art on `main`. | Spot-check commands/links at announce time. |
| [SHE-11](https://linear.app/sherv-nariman/issue/SHE-11/edgelens-create-project-command-center) | Command center docs | Done | Codex | Merged #5 | Dashboard markdown + checklists. | Keep synced with GitHub truth. |
| [SHE-12](https://linear.app/sherv-nariman/issue/SHE-12) | Visual command center | Done | Cursor | Merged #7; dups #6/#9 closed | `/internal/command-center` live. | Update `lib/command-center-data.ts` after merges. |
| [SHE-13](https://linear.app/sherv-nariman/issue/SHE-13) | Dialog preview badge overlap | Done | Cursor | Merged #11; dup #10 closed | Badges stacked above Dialog trigger. | None. |
| [SHE-14](https://linear.app/sherv-nariman/issue/SHE-14) | Force MVP light mode | Done | Cursor | Merged #12; dup #13 closed | Light-only UI for launch recording. | Protect in future PRs. |
| [SHE-15](https://linear.app/sherv-nariman/issue/SHE-15) | Manager operating loop | Done | Cursor | Merged #14 | Playbook + command center truth refresh. | Run loop after each sprint change. |
| [SHE-16](https://linear.app/sherv-nariman/issue/SHE-16) | Final local QA + release checklist | In progress | Cursor | Active PR #17 | Verified checklist + snapshot refresh; only open PR. | Merge PR #17 (open PRs → 0). |
| [SHE-19](https://linear.app/sherv-nariman/issue/SHE-19/edgelens-narrow-mvp-positioning-around-state-completeness-pre) | MVP positioning (state completeness) | Done | Cursor | Merged #16 | Pre-flight state checks hero; a11y supporting; limitation copy; prior art. | Keep positioning stable. |
| SHE-21 | Code health & stability review | Done | Cursor | Merged #16 | Manager-loop code-health section on `main`. | Use on PR QA passes. |
| [SHE-148](https://linear.app/sherv-nariman/issue/SHE-148) | Milestone 1 production baseline | In progress | Cursor | Open | Vitest, determinism×5, CI, MIT, isolation, CodeQL/Dependabot. | Independent QA + senior code-health review; do not merge until signed off. |

## Recommended Linear views

| View | Filter/grouping | Purpose |
| --- | --- | --- |
| Launch sprint board | Project: EdgeLens MVP Launch Sprint, grouped by status | See active, blocked, in-review, and done launch work. |
| Agent-owned work | Labels: `codex`, `edgelens`, `docs`; grouped by assignee/status | Track work that can be picked up by Codex or Cursor. |
| Release readiness | SHE-16 + human launch gates (demo, URLs, nariman.dev, public launch) | Focus review on items that still gate public launch. |

## Update rules

- Update this file when Linear status, owner, PR status, or next action changes.
- Keep the table GitHub-renderable: every row should have the same number of columns.
- Do not record user counts, stars, revenue, or traction unless verified in a future source of truth.
- When duplicates appear, record winner + closed losers in Notes and in `COMMAND_CENTER.md`.
