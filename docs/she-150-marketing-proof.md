# SHE-150 marketing proof — Team invite

## Story

The **Team invite** example (`examples/index.ts` · `team-invite`) looks production-ready on the happy path: branded card, role select, primary CTA, pending members list, and a “Manage seats” sheet.

EdgeLens still surfaces multiple missing states plus a shadcn/Radix composition gap — without any LLM.

## Finding → fix (truthful)

| Finding (deterministic signal) | Confidence | Fix template |
| --- | --- | --- |
| Async submit lacks duplicate-submit protection (`onClick` invite without `disabled`+pending pairing) | high | Disable + `aria-busy` while pending |
| No loading / pending state | high | Spinner + disabled Button |
| No empty state / list retry cues on pending members `.map` | medium–high | Empty branch + error/Retry |
| Select missing SelectValue | high | Add `<SelectValue placeholder="…" />` |
| Sheet missing SheetTitle | high | Add `<SheetTitle>` (+ description) inside `SheetContent` |
| Destructive “Remove member” without confirmation | high | AlertDialog confirm flow |
| Hard-coded `bg-blue-600` palette | medium | Prefer theme tokens |

Copyable snippets are conceptual templates — adapt prop names and imports manually (`adaptNote` on each fix).

## How to reproduce

1. Open the analyzer and load **Team invite · founder demo**.
2. Click **Analyze**.
3. States tab: loading / disabled / empty / error gaps.
4. Static tab: SheetTitle + SelectValue (+ optional destructive confirm).
5. Fixes tab: before/after templates mapped to those issue ids.
