# EdgeLens Release Checklist

Operational checklist for deciding when EdgeLens is ready for public launch. Check boxes should reflect verified work only.

**Last local QA pass:** 2026-07-10 (SHE-16 · Cursor) — see [QA evidence](#she-16-local-qa-evidence-2026-07-10) below.

## Product readiness

- [x] Core analyzer flows work in the browser without backend services or secrets.
- [x] Report UI clearly separates: state completeness, static JSX/shadcn, preview DOM, and rule-based fixes.
- [x] State completeness is the hero story; accessibility is framed as supporting risk detection.
- [x] Visible limitation copy is present and not overwhelming.
- [x] axe-core preview DOM integration has passed local QA on representative examples.
- [x] Error states are understandable and do not block the main demo path.
- [x] No unsupported compliance, automation, or traction claims appear in product UI.
- [x] Forbidden phrases absent: first / only / guarantees accessibility / WCAG compliant / accessibility auditor / axe alternative / Storybook replacement / catches everything.

## Repo readiness

- [x] README explains what EdgeLens is (pre-flight state checker), who it is for, and how to run it locally.
- [x] README includes a “Related ecosystem / prior art” section.
- [x] Standard commands are accurate: `npm run dev`, `npm run build`, `npm run start`, and `npm run lint`.
- [x] Launch docs are aligned: `README.md`, `docs/launch.md`, and `COMMAND_CENTER.md`.
- [x] No app code depends on environment variables, backend services, or hidden setup.
- [x] Final lint/build checks have been run and results are documented in the launch PR or Linear update.

## Demo readiness

- [x] Recording route from SHE-8 loads cleanly using `npm run dev`.
- [x] Demo script tells: “The component looked done on the happy path until EdgeLens forced the states AI forgot.”
- [x] Demo path shows forced state preview and clear trust labeling.
- [x] Browser viewport, theme, and sample code are ready for recording.
- [ ] Final demo recording or screenshots are approved by the human owner.

## Launch copy readiness

- [x] Primary positioning: local deterministic pre-flight checker for generated React/shadcn UI (state completeness hero).
- [x] Copy does not claim users, stars, revenue, benchmarks, or compliance guarantees.
- [x] Launch assets from SHE-10 / SHE-19 are reviewed and consistent with README language.
- [ ] Any social or announcement copy links to the correct repo/demo destination.
- [x] Known limitations are framed honestly and practically.

## nariman.dev readiness

- [ ] Destination page or link target for EdgeLens is selected.
- [ ] Link text and summary match current product positioning.
- [ ] Any screenshots, embeds, or launch notes are current.
- [ ] External links resolve correctly.
- [ ] Site update is ready to publish after repo/demo approval.

## Final QA

- [x] `npm run lint` passes.
- [x] `npm run typecheck` passes.
- [x] `npm run build` passes or any environment limitation is documented.
- [x] Manual smoke pass covers built-in examples.
- [x] Preview DOM and accessibility findings are reviewed for clarity (supporting layer).
- [x] Mobile or narrow viewport basics are checked for the primary pages.
- [ ] Launch blockers in `COMMAND_CENTER.md` are closed or explicitly accepted.

## Public launch checklist

- [ ] Merge launch-critical PRs.
- [ ] Confirm Linear issue statuses match actual repo state.
- [ ] Publish or update nariman.dev entry if in scope for launch day.
- [ ] Post announcement copy only after demo and repo links are verified.
- [ ] Monitor initial feedback and capture follow-up issues in Linear.

## Post-launch follow-up

- [ ] Triage feedback into bugs, polish, docs, or future features.
- [ ] Update `docs/progress.md` with post-launch issue status.
- [ ] Add follow-up screenshots or examples if they help future contributors.
- [ ] Revisit launch copy for clarity after real feedback.
- [ ] Archive or close launch-only checklist items once no longer useful.

## Explicitly out of MVP scope

Save for later (do not block launch):

- [ ] VS Code integration
- [ ] CI integration
- [ ] GitHub PR integration
- [ ] Storybook integration

---

## SHE-16 local QA evidence (2026-07-10)

Automated gates (this pass):

| Check | Result |
| --- | --- |
| `npm run lint` | Pass |
| `npm run typecheck` | Pass |
| `npm run build` | Pass |
| `npx tsx scripts/smoke-examples.mts` | Pass — all 5 examples produce findings + fixes |

Browser QA (Cursor · `npm run dev` · localhost:3000):

| Surface | Result | Notes |
| --- | --- | --- |
| `/` landing | Pass | Brand + state-completeness hero; limitation copy; no forbidden claims |
| `/analyzer` · icon-button | Pass | Four check layers; heuristic score; Preview DOM labeled; Fixes copyable |
| `/analyzer` · login-form | Pass | Useful report; forced-state controls present |
| `/analyzer` · project-list | Pass | Useful report |
| `/analyzer` · settings-dialog | Pass | Score 17; DialogTitle/description findings |
| `/analyzer` · theme-select | Pass | Score 30; SelectValue/label findings |
| `/record/edgelens` | Pass | Chrome stripped; demo auto-analyzes; trust labels intact |
| Light mode | Pass | MVP light-only UI confirmed |
| Mobile ~390px | Pass | Landing/analyzer usable; no catastrophic overflow |
| Invalid paste error path | Pass | App does not brick; analysis continues |
| `/internal/command-center` | Pass | Dashboard loads |

Smoke example scores (engine):

| Example | Score | Issues | Fixes |
| --- | --- | --- | --- |
| icon-button | 33 | 5 | 5 |
| login-form | 27 | 9 | 8 |
| project-list | 37 | 9 | 7 |
| settings-dialog | 17 | 9 | 8 |
| theme-select | 30 | 8 | 8 |

### Still human-owned before public announce

1. Approve final demo recording/screenshots from `/record/edgelens`.
2. Replace `<repo link>` / `<demo link>` placeholders in `docs/launch.md`.
3. nariman.dev destination + publish readiness.
4. Accept or close remaining launch blockers in `COMMAND_CENTER.md`, then run the public launch checklist.
