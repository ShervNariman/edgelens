import type { StepLog } from "./phase-clock.js";
import type { ScenarioPhase } from "./phase-clock.js";
import type { MotionStressScenarioId } from "./scenarios.js";

export type ArtifactKind = "screenshot" | "log" | "trace" | "json";

export type ArtifactBudget = Readonly<{
  maxScreenshots: number;
  maxLogEntries: number;
  maxArtifacts: number;
  maxArtifactBytes: number;
}>;

export const DEFAULT_ARTIFACT_BUDGET: ArtifactBudget = Object.freeze({
  maxScreenshots: 4,
  maxLogEntries: 200,
  maxArtifacts: 12,
  maxArtifactBytes: 2_000_000,
});

export type ScenarioArtifact = Readonly<{
  kind: ArtifactKind;
  name: string;
  path: string;
  bytes: number;
}>;

export type ScenarioOutcomeStatus = "passed" | "failed" | "timed_out" | "canceled" | "error";

export type ScenarioRunResult = Readonly<{
  scenarioId: MotionStressScenarioId | string;
  seed: number;
  status: ScenarioOutcomeStatus;
  startedAt: string;
  completedAt: string;
  durationMs: number;
  phase: ScenarioPhase | null;
  timeoutPhase: ScenarioPhase | null;
  evidence: readonly string[];
  missingEvidence: readonly string[];
  steps: readonly StepLog[];
  artifacts: readonly ScenarioArtifact[];
  reproductionCommand: string;
  errorMessage?: string;
  resourcesReleased: boolean;
}>;

export type RunnerRunResult = Readonly<{
  schemaVersion: typeof MOTIONGUARD_RUNNER_SCHEMA_VERSION;
  seed: number;
  startedAt: string;
  completedAt: string;
  passed: boolean;
  scenarioOrder: readonly string[];
  results: readonly ScenarioRunResult[];
}>;

export const MOTIONGUARD_RUNNER_SCHEMA_VERSION = "0.1" as const;

export type RunnerConfig = Readonly<{
  seed: number;
  baseUrl: string;
  /** CSS selector for the primary motion target under test. */
  target: string;
  /** When set, only these scenarios run (reproduction mode). */
  scenarioIds?: readonly string[];
  phaseTimeoutMs: number;
  scenarioTimeoutMs: number;
  artifactDir: string;
  artifactBudget: ArtifactBudget;
  headless?: boolean;
}>;
