import { mkdir } from "node:fs/promises";
import path from "node:path";
import {
  buildReproductionCommand,
  DEFAULT_ARTIFACT_BUDGET,
  listMotionStressScenarioIds,
  MOTIONGUARD_RUNNER_SCHEMA_VERSION,
  PhaseAbortError,
  PhaseClock,
  PhaseTimeoutError,
  requireMotionStressScenario,
  seededOrder,
  type RunnerConfig,
  type RunnerRunResult,
  type ScenarioPhase,
  type ScenarioRunResult,
} from "@motionguard/core";
import { ArtifactRecorder } from "./artifacts.js";
import type { DriverFactory, MotionPageDriver } from "./driver.js";
import { createMockDriverFactory } from "./mock-driver.js";
import { scenarioExecutors } from "./scenarios/index.js";

export type RunMotionStressSuiteOptions = RunnerConfig &
  Readonly<{
    driverFactory?: DriverFactory;
    now?: () => number;
    signal?: AbortSignal;
  }>;

function resolveScenarioIds(config: RunnerConfig): string[] {
  const all = listMotionStressScenarioIds();
  if (!config.scenarioIds || config.scenarioIds.length === 0) {
    return seededOrder([...all], config.seed);
  }
  const unique = [...new Set(config.scenarioIds)];
  for (const id of unique) {
    requireMotionStressScenario(id);
  }
  // Reproduction mode keeps caller order for the filtered set, but still seeds when >1.
  return unique.length === 1 ? unique : seededOrder(unique, config.seed);
}

async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  onTimeout: () => Error,
  signal?: AbortSignal,
): Promise<T> {
  // Always attach a sink so late rejections after settlement cannot become unhandled.
  promise.catch(() => undefined);

  if (signal?.aborted) {
    throw new PhaseAbortError(null);
  }

  let timer: ReturnType<typeof setTimeout> | undefined;
  let onAbort: (() => void) | undefined;
  let settled = false;

  try {
    return await new Promise<T>((resolve, reject) => {
      const settleOk = (value: T) => {
        if (settled) {
          return;
        }
        settled = true;
        resolve(value);
      };
      const settleErr = (error: unknown) => {
        if (settled) {
          return;
        }
        settled = true;
        reject(error);
      };

      timer = setTimeout(() => settleErr(onTimeout()), timeoutMs);
      onAbort = () => settleErr(new PhaseAbortError(null));
      signal?.addEventListener("abort", onAbort, { once: true });
      promise.then(settleOk, settleErr);
    });
  } finally {
    if (timer) {
      clearTimeout(timer);
    }
    if (onAbort) {
      signal?.removeEventListener("abort", onAbort);
    }
  }
}

async function releaseDriver(driver: MotionPageDriver | null): Promise<boolean> {
  if (!driver) {
    return true;
  }
  try {
    if (!driver.isClosed()) {
      await driver.close();
    }
    return driver.isClosed();
  } catch {
    return driver.isClosed();
  }
}

export async function runMotionStressScenario(
  scenarioId: string,
  config: RunMotionStressSuiteOptions,
): Promise<ScenarioRunResult> {
  const definition = requireMotionStressScenario(scenarioId);
  const startedAtDate = new Date();
  const startedAt = startedAtDate.toISOString();
  const startedMs = (config.now ?? Date.now)();
  const evidence = new Set<string>();
  const controller = new AbortController();
  const external = config.signal;
  const onExternalAbort = () => controller.abort(external?.reason);
  if (external?.aborted) {
    controller.abort(external.reason);
  } else {
    external?.addEventListener("abort", onExternalAbort, { once: true });
  }

  const artifactDir = path.join(config.artifactDir, scenarioId);
  const artifacts = new ArtifactRecorder(artifactDir, config.artifactBudget);
  const clock = new PhaseClock({
    phaseTimeoutMs: config.phaseTimeoutMs,
    signal: controller.signal,
    ...(config.now === undefined ? {} : { now: config.now }),
  });

  let driver: MotionPageDriver | null = null;
  let status: ScenarioRunResult["status"] = "passed";
  let timeoutPhase: ScenarioPhase | null = null;
  let errorMessage: string | undefined;
  let resourcesReleased = false;

  const reproductionCommand = buildReproductionCommand({
    scenarioId,
    seed: config.seed,
    target: config.target,
    baseUrl: config.baseUrl,
  });

  try {
    await mkdir(artifactDir, { recursive: true });
    const factory = config.driverFactory ?? createMockDriverFactory();
    driver = await factory({
      signal: controller.signal,
      headless: config.headless ?? true,
    });

    const executor = scenarioExecutors[definition.id];
    await withTimeout(
      executor({
        driver,
        clock,
        baseUrl: config.baseUrl,
        target: config.target,
        signal: controller.signal,
        collectEvidence: (token) => evidence.add(token),
        note: (message, data) => clock.log(message, data),
        throwIfAborted: () => clock.throwIfAborted(),
      }),
      config.scenarioTimeoutMs,
      () =>
        new PhaseTimeoutError(
          clock.phase ?? "observe",
          "scenario-budget",
          config.scenarioTimeoutMs,
        ),
      controller.signal,
    );
  } catch (error) {
    if (error instanceof PhaseAbortError) {
      status = "canceled";
      errorMessage = error.message;
      evidence.add("cancel-path-exercised");
      evidence.add("resources-released");
      evidence.add("bounded-diagnostics");
    } else if (error instanceof PhaseTimeoutError) {
      status = "timed_out";
      timeoutPhase = error.phase;
      errorMessage = error.message;
      evidence.add("timeout-phase-identified");
      evidence.add("bounded-diagnostics");
      evidence.add("resources-released");
    } else {
      status = "error";
      errorMessage = error instanceof Error ? error.message : String(error);
    }
  } finally {
    external?.removeEventListener("abort", onExternalAbort);
    try {
      clock.enter("teardown");
    } catch {
      clock.log("teardown skipped due to prior abort/timeout");
    }
    resourcesReleased = await releaseDriver(driver);
    if (resourcesReleased) {
      evidence.add("resources-released");
    }
    const stepLines = clock
      .getSteps()
      .slice(0, config.artifactBudget.maxLogEntries)
      .map((step) => `[${String(step.atMs)}ms][${step.phase}] ${step.message}`);
    await artifacts.writeLog("steps.log", stepLines);
    await artifacts.writeJson("result.json", {
      scenarioId,
      status,
      timeoutPhase,
      evidence: [...evidence],
      reproductionCommand,
    });
    if (driver && !driver.isClosed()) {
      try {
        const shotPath = path.join(artifactDir, "final.png");
        const bytes = await driver.screenshot(shotPath);
        artifacts.trackScreenshot("final.png", shotPath, bytes);
      } catch {
        clock.log("screenshot skipped");
      }
    }
  }

  const missingEvidence = definition.expectedEvidence.filter((token) => !evidence.has(token));
  if (status === "passed" && missingEvidence.length > 0) {
    status = "failed";
    errorMessage = `Missing expected evidence: ${missingEvidence.join(", ")}`;
  }

  const completedMs = (config.now ?? Date.now)();
  return {
    scenarioId,
    seed: config.seed,
    status,
    startedAt,
    completedAt: new Date(
      startedAtDate.getTime() + Math.max(0, completedMs - startedMs),
    ).toISOString(),
    durationMs: Math.max(0, completedMs - startedMs),
    phase: clock.phase,
    timeoutPhase,
    evidence: [...evidence],
    missingEvidence,
    steps: clock.getSteps(),
    artifacts: artifacts.recorded,
    reproductionCommand,
    ...(errorMessage === undefined ? {} : { errorMessage }),
    resourcesReleased,
  };
}

export async function runMotionStressSuite(
  config: RunMotionStressSuiteOptions,
): Promise<RunnerRunResult> {
  const startedAt = new Date().toISOString();
  const order = resolveScenarioIds(config);
  const results: ScenarioRunResult[] = [];

  for (const scenarioId of order) {
    if (config.signal?.aborted) {
      break;
    }
    const result = await runMotionStressScenario(scenarioId, config);
    results.push(result);
  }

  const completedAt = new Date().toISOString();
  const passed =
    results.length === order.length && results.every((result) => result.status === "passed");

  return {
    schemaVersion: MOTIONGUARD_RUNNER_SCHEMA_VERSION,
    seed: config.seed,
    startedAt,
    completedAt,
    passed,
    scenarioOrder: order,
    results,
  };
}

export function createDefaultRunnerConfig(
  overrides: Partial<RunnerConfig> & Pick<RunnerConfig, "baseUrl" | "target" | "seed">,
): RunnerConfig {
  return {
    phaseTimeoutMs: 2_000,
    scenarioTimeoutMs: 8_000,
    artifactDir: ".motionguard/artifacts",
    artifactBudget: DEFAULT_ARTIFACT_BUDGET,
    headless: true,
    ...overrides,
  };
}
