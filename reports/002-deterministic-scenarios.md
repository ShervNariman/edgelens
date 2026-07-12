# MotionGuard Major-Step Report 002 — Deterministic Scenarios & Runner

**Objective:** Implement the deterministic Playwright scenario engine that applies bounded motion adversity and produces reproducible evidence (SHE-116).

## Shipped

- Nine built-in adversity scenarios in `@motionguard/core` with explicit expected evidence tokens.
- Seeded scenario ordering, phase clock, abort/timeout errors, artifact budget types, and reproduction command builder.
- `@motionguard/playwright` runner with mock and Playwright drivers, isolated per-scenario cleanup, step logs, and artifact budgets.
- CLI `check`, `run`, and `list` commands, including single-scenario reproduction.
- Controlled `motion-lab.html` fixture for live or mock runs.

## Five-loop evidence

1. **Requirements:** Scenario semantics and expected evidence are encoded in `MOTION_STRESS_SCENARIOS`; experience-contract verifier checks all nine adversity ids.
2. **Static quality:** Biome format/lint and strict TypeScript across core, playwright, and CLI packages.
3. **Automated behavior:** Unit/integration tests cover seeded order, five repeated seed-profile runs, cancellation resource release, timeout phase identity, reduced-motion/target-removal adversity, and CLI wiring.
4. **Adversity:** Rapid input, resize, visibility, target removal/replacement, timeout/cancel paths, and reduced-motion comparison are executable scenarios.
5. **Release readiness:** `pnpm qa` is the merge gate; Playwright remains an optional peer for live browser execution.

## Defects found and fixed

- Avoided fixed-sleep correctness by making `PhaseClock.waitUntil` predicate-driven with bounded polling.
- Ensured every scenario path releases drivers in `finally`, including abort and timeout exits.
- Kept core browser-agnostic by placing Playwright imports only in the adapter package.

## Code-health status

Package boundaries remain acyclic. Public runner results include reproduction commands and bounded diagnostics. No intentional `any` or suppression comments introduced.

## User value

Contributors can deterministically stress motion under hostile conditions and rerun one failing scenario with a copy-paste command.

## X Marketing handoff

**Truthful narrative:** MotionGuard now has a deterministic motion adversity runner and scenario catalog; live Chromium execution is available behind an optional Playwright dependency. Do not claim production browser-cloud SaaS or automatic visual QA replacement.

## Next step

Implement the first high-confidence rules (moving target, interrupted-state mismatch, exited-but-interactive, reduced-motion mismatch) on top of this evidence stream.
