# EdgeLens Release Checklist

Operational checklist for deciding when EdgeLens is ready for public launch. Check boxes should reflect verified work only.

## Product readiness

- [ ] Core analyzer flows work in the browser without backend services or secrets.
- [ ] Static checks, preview DOM checks, and rule-based fixes are clearly labeled.
- [ ] axe-core preview DOM integration has passed local QA on representative examples.
- [ ] Error states are understandable and do not block the main demo path.
- [ ] No unsupported compliance, automation, or traction claims appear in product UI.

## Repo readiness

- [ ] README explains what EdgeLens is, who it is for, and how to run it locally.
- [ ] Standard commands are accurate: `npm run dev`, `npm run build`, `npm run start`, and `npm run lint`.
- [ ] Launch docs are aligned: `README.md`, `docs/launch.md`, and `COMMAND_CENTER.md`.
- [ ] No app code depends on environment variables, backend services, or hidden setup.
- [ ] Final lint/build checks have been run and results are documented in the launch PR or Linear update.

## Demo readiness

- [ ] Recording route from SHE-8 loads cleanly using `npm run dev`.
- [ ] Demo script uses realistic component examples and avoids unsupported claims.
- [ ] Demo path shows both useful findings and clear trust labeling.
- [ ] Browser viewport, theme, and sample code are ready for recording.
- [ ] Final demo recording or screenshots are approved by the human owner.

## Launch copy readiness

- [ ] Primary positioning is concise: rule-based component QA for interaction states and accessibility issues.
- [ ] Copy does not claim users, stars, revenue, benchmarks, or compliance guarantees.
- [ ] Launch assets from SHE-10 are reviewed and consistent with README language.
- [ ] Any social or announcement copy links to the correct repo/demo destination.
- [ ] Known limitations are framed honestly and practically.

## nariman.dev readiness

- [ ] Destination page or link target for EdgeLens is selected.
- [ ] Link text and summary match current product positioning.
- [ ] Any screenshots, embeds, or launch notes are current.
- [ ] External links resolve correctly.
- [ ] Site update is ready to publish after repo/demo approval.

## Final QA

- [ ] `npm run lint` passes.
- [ ] `npm run build` passes or any environment limitation is documented.
- [ ] Manual smoke pass covers built-in examples.
- [ ] Preview DOM and accessibility findings are reviewed for clarity.
- [ ] Mobile or narrow viewport basics are checked for the primary pages.
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
