# ADR 0002: Deterministic scenario runner

- Status: Accepted
- Date: 2026-07-12

## Decision

Milestone 2 introduces:

- Browser-agnostic scenario catalog, seeded ordering, phase clock, evidence, and reproduction
  command builders in `@motionguard/core`.
- A Playwright adapter package `@motionguard/playwright` that owns browser automation, page
  drivers, artifact budgets, and scenario executors.
- CLI `check` / `run` / `list` commands that orchestrate the runner without embedding Playwright
  types into core.

## Rationale

Keeping core free of Playwright preserves deterministic unit testing and package boundaries from
ADR 0001 while still delivering a reproducible adversity engine.

## Consequences

- Live Chromium runs require the optional `playwright` peer dependency and `--browser`.
- Default CI/unit paths use the mock driver so the five-loop gate stays fast and hermetic.
- Reproduction always targets one scenario id, one seed, and one target selector.
