export { ArtifactRecorder } from "./artifacts.js";
export type {
  BoundingBox,
  DriverFactory,
  MotionPageDriver,
  ReducedMotionPreference,
} from "./driver.js";
export { createMockDriverFactory, MockMotionPageDriver } from "./mock-driver.js";
export { createPlaywrightDriverFactory } from "./playwright-driver.js";
export {
  createDefaultRunnerConfig,
  runMotionStressScenario,
  runMotionStressSuite,
} from "./runner.js";
export type { RunMotionStressSuiteOptions } from "./runner.js";
export { scenarioExecutors } from "./scenarios/index.js";
