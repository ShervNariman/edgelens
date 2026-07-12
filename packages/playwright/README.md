# @motionguard/playwright

Deterministic Playwright scenario engine for MotionGuard. Applies bounded motion adversity and
produces reproducible evidence.

## Capabilities

- Seeded scenario order
- Explicit phase clock (no fixed-sleep correctness)
- Bounded per-phase and per-scenario timeouts
- Abort propagation with cleanup in `finally`
- Isolated page/context state per scenario
- Actionable step logs, artifact budgets, and reproduction commands

## Usage

```ts
import { runMotionStressSuite } from "@motionguard/playwright";

const result = await runMotionStressSuite({
  seed: 42,
  baseUrl: "http://127.0.0.1:4173/fixtures/motion-lab.html",
  target: "[data-mg-target]",
  phaseTimeoutMs: 2_000,
  scenarioTimeoutMs: 8_000,
  artifactDir: ".motionguard/artifacts",
  artifactBudget: {
    maxScreenshots: 4,
    maxLogEntries: 200,
    maxArtifacts: 12,
    maxArtifactBytes: 2_000_000,
  },
});
```

Reproduce one scenario:

```bash
motionguard run --scenario rapid-trigger --seed 42 --target '[data-mg-target]'
```
