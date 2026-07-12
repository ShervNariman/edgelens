import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  createDefaultRunnerConfig,
  createMockDriverFactory,
  runMotionStressScenario,
  runMotionStressSuite,
} from "../src/index.js";

async function withArtifacts<T>(fn: (artifactDir: string) => Promise<T>): Promise<T> {
  const artifactDir = await mkdtemp(path.join(tmpdir(), "motionguard-"));
  try {
    return await fn(artifactDir);
  } finally {
    await rm(artifactDir, { recursive: true, force: true });
  }
}

function baseOptions(artifactDir: string, seed = 42) {
  return {
    ...createDefaultRunnerConfig({
      seed,
      baseUrl: "http://127.0.0.1/fixtures/motion-lab.html",
      target: "[data-mg-target]",
      artifactDir,
    }),
    driverFactory: createMockDriverFactory(),
  };
}

describe("runMotionStressSuite", () => {
  it("uses seeded deterministic scenario order", async () => {
    await withArtifacts(async (artifactDir) => {
      const a = await runMotionStressSuite(baseOptions(path.join(artifactDir, "a"), 42));
      const b = await runMotionStressSuite(baseOptions(path.join(artifactDir, "b"), 42));
      expect(a.scenarioOrder).toEqual(b.scenarioOrder);
      expect(a.results.map((result) => result.status)).toEqual(
        b.results.map((result) => result.status),
      );
      expect(a.passed).toBe(true);
    });
  });

  it("passes five repeated runs for the same seed profile", async () => {
    await withArtifacts(async (artifactDir) => {
      const first = await runMotionStressSuite(baseOptions(path.join(artifactDir, "first"), 7));
      for (let i = 0; i < 5; i += 1) {
        const result = await runMotionStressSuite(
          baseOptions(path.join(artifactDir, `run-${String(i)}`), 7),
        );
        expect(result.passed).toBe(true);
        expect(result.scenarioOrder).toEqual(first.scenarioOrder);
        expect(result.results.map((item) => item.status)).toEqual(
          first.results.map((item) => item.status),
        );
      }
    });
  });

  it("releases resources when canceled", async () => {
    await withArtifacts(async (artifactDir) => {
      const controller = new AbortController();
      queueMicrotask(() => controller.abort());
      const result = await runMotionStressScenario("rapid-trigger", {
        ...baseOptions(artifactDir, 1),
        signal: controller.signal,
      });
      expect(result.resourcesReleased).toBe(true);
      expect(result.reproductionCommand).toContain("--scenario rapid-trigger");
    });
  });

  it("identifies timeout phase for hanging waits", async () => {
    await withArtifacts(async (artifactDir) => {
      const result = await runMotionStressScenario("cancellation-timeout-close", {
        ...baseOptions(artifactDir, 3),
        phaseTimeoutMs: 50,
        scenarioTimeoutMs: 2_000,
      });
      expect(result.status).toBe("passed");
      expect(result.evidence).toContain("timeout-phase-identified");
      expect(result.resourcesReleased).toBe(true);
    });
  });

  it("supports single-scenario reproduction", async () => {
    await withArtifacts(async (artifactDir) => {
      const result = await runMotionStressSuite({
        ...baseOptions(artifactDir, 99),
        scenarioIds: ["viewport-resize"],
      });
      expect(result.scenarioOrder).toEqual(["viewport-resize"]);
      expect(result.results).toHaveLength(1);
      expect(result.results[0]?.status).toBe("passed");
      expect(result.results[0]?.reproductionCommand).toContain("viewport-resize");
    });
  });

  it("covers adversity scenarios including reduced-motion and target removal", async () => {
    await withArtifacts(async (artifactDir) => {
      const result = await runMotionStressSuite({
        ...baseOptions(artifactDir, 11),
        scenarioIds: [
          "pointer-geometry-change",
          "visibility-pause-resume",
          "target-removal",
          "reduced-motion-rerun",
          "keyboard-during-motion",
        ],
      });
      expect(result.passed).toBe(true);
      expect(result.results.every((item) => item.resourcesReleased)).toBe(true);
    });
  });
});
