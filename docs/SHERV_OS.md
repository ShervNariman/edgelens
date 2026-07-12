# Sherv OS Integration

EdgeLens participates in Sherv OS.

- ChatGPT: executive brain, strategy, prioritization, cross-system coordination, final review.
- Cursor: primary supervised editor for visual, architectural, debugging, and broad repository work.
- Codex: tightly scoped background implementation with explicit acceptance criteria.
- Linear: operational truth for status, ownership, dependencies, and decisions.
- GitHub: technical truth for code, review, CI, and release history.

## Required controls

1. Read the repository and linked Linear issue before editing.
2. Keep scope bounded to the approved issue.
3. Prefer existing architecture and dependencies.
4. Run typecheck, lint, tests, production build, and relevant browser checks.
5. Never transmit pasted source code or user-authored component content to logs, analytics, prompts, replay, or external services without explicit approval.
6. Production deploys, publishing, destructive changes, billing changes, and credentials require human approval.
7. Releases must document validation, remaining risk, rollback, screenshots, and recording artifacts.
8. Missing integrations fail closed and are reported rather than guessed.

Activation is a successful deterministic component analysis. Recording routes must not pollute product analytics.
