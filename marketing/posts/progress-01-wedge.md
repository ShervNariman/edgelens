# Progress post 01 — wedge

Building EdgeLens: a local deterministic pre-flight checker for generated React/shadcn UI.

Focus is narrow on purpose:

- **State completeness** first (loading, empty, error, disabled, focus…)
- Supporting static JSX / shadcn checks
- Preview DOM signals (axe-core where available)
- Rule-based fix templates

No backend. No product-side LLM. Paste component → analyze → force states → review findings.

Not a WCAG certifier — a sanity check for the states AI-generated components often skip.
