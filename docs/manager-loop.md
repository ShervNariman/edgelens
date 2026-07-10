# EdgeLens manager-agent operating loop

Playbook for the manager agent (and any human acting as one). Goal: move the MVP launch sprint quickly without duplicate PRs, broken merges, stale dashboards, or product-constraint drift.

## Sources of truth

| System | Owns |
| --- | --- |
| Linear | Issue status, acceptance criteria, ownership, sprint board |
| GitHub | Code, branches, PRs, CI/validation evidence |
| `COMMAND_CENTER.md` + `lib/command-center-data.ts` | Human-readable + in-app snapshot of project truth |
| `docs/progress.md` | Issue ↔ PR tracker table |
| Sherv | Final merge approval, local QA, product taste, public launch |

If Linear, GitHub, and the command center disagree, treat **GitHub `main` + open PRs** as code truth, then update Linear and the command center to match.

## Product constraints (never violate)

- No backend / API / LLM calls inside the MVP product
- No arbitrary pasted JSX execution
- Deterministic, client-side analysis only
- State completeness is the hero feature; accessibility is a supporting risk layer
- No WCAG certification claims; score is heuristic
- Do not market as accessibility auditor / axe alternative / Storybook replacement
- Light UI for MVP launch
- `/record/edgelens` remains stable for launch capture
- Static findings labeled as static checks; axe findings labeled as preview DOM checks
- Fixes described as deterministic templates

## Agent roles

| Role | Scope | Do not |
| --- | --- | --- |
| **Cursor** | Frontend UI, layout, interaction polish, analyzer behavior, preview polish, route work | Broad docs rewrites unless the issue is UI-adjacent |
| **Codex** | README, docs, repo polish, launch docs, checklists, structured cleanup, carefully scoped rule/axe work | Parallel edits on files Cursor already owns |
| **Sherv** | Merge approval, local QA, product taste, public launch decisions | Assume agent PR summaries without spot-checking launch-critical paths |

**Hard rule:** one Linear issue → one branch → one PR. Do not let Cursor and Codex edit the same files at the same time.

## Operating loop (run every session)

1. **Inspect Linear sprint** — statuses, owners, acceptance criteria, stale “In Progress” items.
2. **Inspect open GitHub PRs** — titles, linked issues, validation sections, mergeability, duplicates.
3. **Compare actual state vs command center** — `COMMAND_CENTER.md`, `docs/progress.md`, `/internal/command-center` data.
4. **Identify:**
   - Done work (merged + criteria met)
   - Duplicate PRs / duplicate cloud agents
   - Stale issues
   - Blockers
   - Next highest-value task
5. **Create or refine a Linear issue** when work is needed (clear acceptance criteria required).
6. **Delegate:**
   - `@cursor` for frontend / product / UI
   - `@codex` for docs / repo / checklists
7. **Require validation on every coding PR:**
   - `npm run lint`
   - `npm run typecheck`
   - `npm run build`
   - Manual route checks where applicable (`/`, `/analyzer`, `/record/edgelens`, `/internal/command-center`)
8. **Run a code health and stability review** (see below) before merge/launch recommendations.
9. **Recommend merge / no-merge** with a one-line rationale.
10. **Update next actions** in Linear + command center in the same pass.

## Duplicate detection checklist

Before starting or approving work:

- [ ] Is there already an open PR for this Linear issue?
- [ ] Are two cloud agents running on the same Linear issue ID?
- [ ] Do two branches touch the same primary files?
- [ ] Did a “winner” PR already merge while a duplicate is still open?

If yes: close the loser PR, stop the duplicate agent, and leave a short note on the Linear issue.

## Merge recommendation rubric

| Recommend | When |
| --- | --- |
| **Merge** | Single PR per issue, validation green, acceptance criteria met, no constraint violations, code health not Risky, command center update included or follow-up noted |
| **Hold** | Missing validation, unclear acceptance criteria, conflicts with in-flight work on same files, product-constraint risk, or code-health cleanup marked as a merge blocker |
| **Close as duplicate** | Same issue already merged or a better PR exists; prefer the PR with cleaner validation + smaller diff |

## Code health and stability review

During manager / PR QA passes, review whether the codebase still has:

- clean file boundaries and clear ownership
- no duplicated logic between analyzer, preview, examples, docs, and command-center data
- no stale hardcoded project status after issue/PR changes
- no accidental backend/API/LLM calls
- no arbitrary pasted JSX execution
- no unnecessary dependencies
- no dead code, unused exports, or stale TODOs that matter for launch
- no fragile product copy scattered across multiple files when shared copy should be centralized
- no regressions to light-mode MVP UI
- no product-copy drift from the state-completeness-first positioning
- no console/runtime errors during manual QA
- no TypeScript, lint, or build failures

Manager output should include:

1. **Code health verdict:** Clean / Mostly clean / Needs cleanup / Risky
2. **Stability risk:** Low / Medium / High
3. **Files or areas to inspect**
4. **Any duplicated/stale logic**
5. **Any product-constraint violations**
6. **Required cleanup before merge, if any**
7. **Whether cleanup should be a blocker or a follow-up issue**

Track deeper cleanup work under Linear **SHE-21** when it is more than a small PR fix.

## Issue quality bar

Every Linear issue must include:

1. Goal (one paragraph)
2. Scope / out of scope
3. Acceptance criteria (checkbox list)
4. Owner/agent (`Cursor`, `Codex`, or `Sherv`)
5. Validation commands / routes
6. Product constraints that apply

## Command center update rule

After every merge or status change:

1. Move completed issues into Done
2. Refresh blockers and next actions
3. Sync `lib/command-center-data.ts` (powers `/internal/command-center`)
4. Sync `docs/progress.md`
5. Note the snapshot date

## Loop report template

Paste into Linear (SHE-15 or a new ops comment) after each manager pass:

```md
## Manager loop report — YYYY-MM-DD

### Sprint snapshot
- Done:
- In flight:
- Blocked:

### GitHub
- Open PRs:
- Duplicates closed:
- Main status: green / red

### Drift vs command center
- Fixed:
- Remaining:

### Code health and stability
- Verdict: Clean / Mostly clean / Needs cleanup / Risky
- Stability risk: Low / Medium / High
- Files/areas to inspect:
- Duplicated/stale logic:
- Product-constraint violations:
- Required cleanup before merge:
- Blocker or follow-up:

### Next highest-value task
- Issue:
- Delegate to:
- Why:

### Merge recommendations
- …

### Next actions
1.
2.
3.
```

## First loop snapshot (2026-07-10)

### Done on `main`

| Issue | Evidence |
| --- | --- |
| SHE-6 | PR #2 merged — trust labeling |
| SHE-8 | PR #3 merged — `/record/edgelens` |
| SHE-9 | PR #8 merged — README polish |
| SHE-10 | PR #4 merged — `docs/launch.md` |
| SHE-11 | PR #5 merged — command center docs |
| SHE-12 | PR #7 merged — `/internal/command-center` |
| SHE-13 | PR #11 merged; duplicate #10 closed — Dialog badge overlap |
| SHE-14 | PR #12 merged; duplicate #13 closed — light mode only |

### Open PRs

None at snapshot time.

### Duplicates already handled

- SHE-12: #6 closed (kept #7)
- SHE-12 follow-up #9 closed after dashboard landed
- SHE-13: #10 closed (kept #11)
- SHE-14: #13 closed (kept #12)

### Remaining blockers

1. **SHE-7 local QA (high)** — axe-core preview DOM integration exists in code; needs Sherv local QA on representative examples before launch confidence.
2. **Release checklist incomplete (medium)** — `docs/release-checklist.md` still unchecked for final launch gates.
3. **Launch capture not recorded (medium)** — route is stable; human recording/demo still pending.
4. **Launch asset placeholders (low)** — `docs/launch.md` still has `<repo link>` / `<demo link>` placeholders.

### Next highest-value tasks

1. **Sherv** — Local QA pass for SHE-7 (acceptance: examples show clear Static vs Preview DOM labels; no false WCAG claims; `/analyzer` + `/record/edgelens` clean).
2. **Cursor (this issue SHE-15)** — Land manager loop docs + refresh command center to match GitHub truth.
3. **Sherv** — Walk `docs/release-checklist.md` and mark only verified boxes.
4. **Codex (follow-up)** — Replace launch URL placeholders once public destinations are final.

### Main branch validation (this pass)

- `npm run lint` — pass
- `npm run typecheck` — pass
- `npm run build` — pass
- Routes present: `/`, `/analyzer`, `/record/edgelens`, `/internal/command-center`
