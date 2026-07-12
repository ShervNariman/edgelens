import type { ScenarioPhase } from "./phase-clock.js";

/**
 * Built-in motion adversity scenarios for Milestone 2.
 * IDs are stable and used by reproduction commands.
 */
export type MotionStressScenarioId =
  | "interrupt-reverse"
  | "rapid-trigger"
  | "pointer-geometry-change"
  | "keyboard-during-motion"
  | "viewport-resize"
  | "visibility-pause-resume"
  | "target-removal"
  | "reduced-motion-rerun"
  | "cancellation-timeout-close";

export type MotionStressScenarioDefinition = Readonly<{
  id: MotionStressScenarioId;
  name: string;
  description: string;
  /** Observable evidence each successful run must produce. */
  expectedEvidence: readonly string[];
  phases: readonly ScenarioPhase[];
  defaultTimeoutMs: number;
}>;

export const MOTION_STRESS_SCENARIOS: readonly MotionStressScenarioDefinition[] = Object.freeze([
  Object.freeze({
    id: "interrupt-reverse",
    name: "Interrupt and reverse during enter/exit",
    description:
      "Trigger enter, reverse mid-transition, then reverse again during exit to surface stuck or mismatched motion states.",
    expectedEvidence: Object.freeze([
      "enter-triggered",
      "mid-enter-reversed",
      "exit-triggered",
      "mid-exit-reversed",
      "final-state-snapshot",
    ]),
    phases: Object.freeze(["setup", "arm", "trigger", "adversity", "observe", "teardown"] as const),
    defaultTimeoutMs: 5_000,
  }),
  Object.freeze({
    id: "rapid-trigger",
    name: "Rapid repeated trigger/input",
    description:
      "Hammer the motion trigger to detect race conditions and incoherent intermediate states.",
    expectedEvidence: Object.freeze([
      "burst-started",
      "burst-completed",
      "activation-count",
      "final-state-snapshot",
    ]),
    phases: Object.freeze(["setup", "arm", "trigger", "adversity", "observe", "teardown"] as const),
    defaultTimeoutMs: 5_000,
  }),
  Object.freeze({
    id: "pointer-geometry-change",
    name: "Pointer path while target geometry changes",
    description:
      "Perform pointer down/move/up while the target's box changes under motion to catch moving hit targets.",
    expectedEvidence: Object.freeze([
      "pointer-down",
      "geometry-changed",
      "pointer-move",
      "pointer-up",
      "hit-target-delta",
    ]),
    phases: Object.freeze(["setup", "arm", "trigger", "adversity", "observe", "teardown"] as const),
    defaultTimeoutMs: 5_000,
  }),
  Object.freeze({
    id: "keyboard-during-motion",
    name: "Keyboard focus and activation during motion",
    description: "Move focus and activate via keyboard while a transition is in flight.",
    expectedEvidence: Object.freeze([
      "motion-started",
      "focus-moved",
      "keyboard-activated",
      "focus-path",
      "final-state-snapshot",
    ]),
    phases: Object.freeze(["setup", "arm", "trigger", "adversity", "observe", "teardown"] as const),
    defaultTimeoutMs: 5_000,
  }),
  Object.freeze({
    id: "viewport-resize",
    name: "Viewport/container resize during motion",
    description:
      "Resize the viewport while motion is active to catch layout-coupled transition failures.",
    expectedEvidence: Object.freeze([
      "motion-started",
      "viewport-resized",
      "layout-snapshot-before",
      "layout-snapshot-after",
    ]),
    phases: Object.freeze(["setup", "arm", "trigger", "adversity", "observe", "teardown"] as const),
    defaultTimeoutMs: 5_000,
  }),
  Object.freeze({
    id: "visibility-pause-resume",
    name: "Page visibility pause/resume",
    description: "Hide and show the page mid-transition to probe lifecycle pause/resume handling.",
    expectedEvidence: Object.freeze([
      "motion-started",
      "visibility-hidden",
      "visibility-visible",
      "resume-state-snapshot",
    ]),
    phases: Object.freeze(["setup", "arm", "trigger", "adversity", "observe", "teardown"] as const),
    defaultTimeoutMs: 5_000,
  }),
  Object.freeze({
    id: "target-removal",
    name: "Target removal/replacement during motion",
    description:
      "Remove or replace the animated target mid-transition and observe cleanup behavior.",
    expectedEvidence: Object.freeze([
      "motion-started",
      "target-removed-or-replaced",
      "dom-presence-check",
      "interaction-probe",
    ]),
    phases: Object.freeze(["setup", "arm", "trigger", "adversity", "observe", "teardown"] as const),
    defaultTimeoutMs: 5_000,
  }),
  Object.freeze({
    id: "reduced-motion-rerun",
    name: "Reduced-motion rerun and comparison",
    description:
      "Run the same trigger under no-preference and reduce, then compare observable motion markers.",
    expectedEvidence: Object.freeze([
      "baseline-run",
      "reduced-motion-run",
      "comparison-delta",
      "preference-applied",
    ]),
    phases: Object.freeze(["setup", "arm", "trigger", "adversity", "observe", "teardown"] as const),
    defaultTimeoutMs: 8_000,
  }),
  Object.freeze({
    id: "cancellation-timeout-close",
    name: "Cancellation, timeout, and browser/page close",
    description:
      "Exercise abort propagation, phase-identified timeouts, and resource release on page/browser close.",
    expectedEvidence: Object.freeze([
      "cancel-path-exercised",
      "timeout-phase-identified",
      "resources-released",
      "bounded-diagnostics",
    ]),
    phases: Object.freeze(["setup", "arm", "trigger", "adversity", "observe", "teardown"] as const),
    defaultTimeoutMs: 3_000,
  }),
]);

const byId = new Map(MOTION_STRESS_SCENARIOS.map((scenario) => [scenario.id, scenario]));

export function listMotionStressScenarioIds(): readonly MotionStressScenarioId[] {
  return MOTION_STRESS_SCENARIOS.map((scenario) => scenario.id);
}

export function getMotionStressScenario(id: string): MotionStressScenarioDefinition | undefined {
  return byId.get(id as MotionStressScenarioId);
}

export function requireMotionStressScenario(id: string): MotionStressScenarioDefinition {
  const scenario = getMotionStressScenario(id);
  if (!scenario) {
    throw new TypeError(`Unknown motion stress scenario: ${id}`);
  }
  return scenario;
}
