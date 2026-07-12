# Marketing proof — SHE-153

Capture only after the SaaS-grade UX work is on the branch. Do **not** mock
unimplemented capability.

## Product screenshot (1)

**Frame:** `/` or `/analyzer` after Analyze on the Login Form example, with a
missing state forced (e.g. `loading` or `error`) and the Findings summary
visible.

**Must show**
- Brand / EdgeLens hero or analyzer header
- Workflow strip (Source · Preview · Findings · Fixes)
- Forced-state toolbar with a selected gap state
- Analysis report score + state completeness hero summary
- Real findings (not empty marketing copy)

**Save as:** `docs/assets/edgelens-she-153-product.png` (or artifacts folder for
the PR walkthrough).

## 15–22 second real workflow shot list

Record on `/record/edgelens` (analytics excluded, auto-loaded login demo).

| Seconds | Action | On-screen focus |
| --- | --- | --- |
| 0–3 | Hold on recording chrome + EdgeLens title + demo story | Brand + honest story |
| 3–6 | Show preloaded source briefly, click **Analyze** if not auto-done | Source → analysis |
| 6–10 | Force `loading` then `error` on the preview toolbar | States AI forgot |
| 10–15 | Pan to Findings: score, state gaps, check layers | Credible report |
| 15–20 | Open **Fixes**, copy one after snippet (Copied feedback) | Deterministic templates |
| 20–22 | Hold on forced-state preview + report together | Closing beat |

**Audio / caption line:** “The component looked done on the happy path until
EdgeLens forced the states AI forgot.”

## Honesty rules

- Label static vs preview DOM vs rule-based fixes if those tabs appear.
- Do not imply WCAG certification, live JSX execution, or cloud analysis.
- Prefer `/record/edgelens` for the video; use the default analyzer for the
  still if you need the workflow strip in frame.
