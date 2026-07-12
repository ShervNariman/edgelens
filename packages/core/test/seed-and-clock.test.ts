import { describe, expect, it } from "vitest";
import {
  createSeededRng,
  listMotionStressScenarioIds,
  MOTION_STRESS_SCENARIOS,
  parseSeed,
  PhaseAbortError,
  PhaseClock,
  PhaseTimeoutError,
  seededOrder,
} from "../src/index.js";

describe("seededOrder", () => {
  it("is deterministic for the same seed", () => {
    const ids = listMotionStressScenarioIds();
    const a = seededOrder(ids, 42);
    const b = seededOrder(ids, 42);
    expect(a).toEqual(b);
    expect(a).not.toEqual(ids);
  });

  it("changes order for different seeds", () => {
    const ids = listMotionStressScenarioIds();
    const a = seededOrder(ids, 1);
    const b = seededOrder(ids, 2);
    expect(a).not.toEqual(b);
  });

  it("preserves membership", () => {
    const ids = listMotionStressScenarioIds();
    const ordered = seededOrder(ids, 99);
    expect([...ordered].sort()).toEqual([...ids].sort());
  });
});

describe("createSeededRng", () => {
  it("emits a stable sequence", () => {
    const a = createSeededRng(7);
    const b = createSeededRng(7);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });
});

describe("parseSeed", () => {
  it("accepts non-negative integers", () => {
    expect(parseSeed(0)).toBe(0);
    expect(parseSeed("123")).toBe(123);
  });

  it("rejects invalid values", () => {
    expect(() => parseSeed(-1)).toThrow(TypeError);
    expect(() => parseSeed("1.5")).toThrow(TypeError);
    expect(() => parseSeed("abc")).toThrow(TypeError);
  });
});

describe("MOTION_STRESS_SCENARIOS", () => {
  it("includes the milestone-2 adversity set", () => {
    expect(MOTION_STRESS_SCENARIOS).toHaveLength(9);
    expect(listMotionStressScenarioIds()).toEqual([
      "interrupt-reverse",
      "rapid-trigger",
      "pointer-geometry-change",
      "keyboard-during-motion",
      "viewport-resize",
      "visibility-pause-resume",
      "target-removal",
      "reduced-motion-rerun",
      "cancellation-timeout-close",
    ]);
  });

  it("declares expected evidence for every scenario", () => {
    for (const scenario of MOTION_STRESS_SCENARIOS) {
      expect(scenario.expectedEvidence.length).toBeGreaterThan(0);
      expect(scenario.phases).toContain("setup");
      expect(scenario.phases).toContain("teardown");
    }
  });
});

describe("PhaseClock", () => {
  it("records phase transitions and waitUntil success", async () => {
    let ready = false;
    queueMicrotask(() => {
      ready = true;
    });
    const clock = new PhaseClock({ phaseTimeoutMs: 1_000, pollIntervalMs: 5 });
    clock.enter("setup");
    await clock.waitUntil(() => ready, "ready");
    expect(clock.getSteps().map((step) => step.message)).toEqual(
      expect.arrayContaining([
        "enter phase setup",
        "waitUntil: ready",
        "waitUntil satisfied: ready",
      ]),
    );
  });

  it("identifies the exact phase on timeout", async () => {
    const clock = new PhaseClock({ phaseTimeoutMs: 40, pollIntervalMs: 5 });
    clock.enter("adversity");
    await expect(clock.waitUntil(() => false, "never")).rejects.toBeInstanceOf(PhaseTimeoutError);
    try {
      await clock.waitUntil(() => false, "never-again");
    } catch (error) {
      expect(error).toBeInstanceOf(PhaseTimeoutError);
      if (error instanceof PhaseTimeoutError) {
        expect(error.phase).toBe("adversity");
        expect(error.label).toBe("never-again");
      }
    }
  });

  it("propagates abort without completing waits", async () => {
    const controller = new AbortController();
    const clock = new PhaseClock({
      phaseTimeoutMs: 1_000,
      pollIntervalMs: 5,
      signal: controller.signal,
    });
    clock.enter("trigger");
    queueMicrotask(() => controller.abort());
    await expect(clock.waitUntil(() => false, "blocked")).rejects.toBeInstanceOf(PhaseAbortError);
  });
});
