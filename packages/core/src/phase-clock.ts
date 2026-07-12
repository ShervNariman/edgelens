export type ScenarioPhase = "setup" | "arm" | "trigger" | "adversity" | "observe" | "teardown";

export const SCENARIO_PHASES: readonly ScenarioPhase[] = Object.freeze([
  "setup",
  "arm",
  "trigger",
  "adversity",
  "observe",
  "teardown",
]);

export type PhaseClockOptions = Readonly<{
  phaseTimeoutMs: number;
  now?: () => number;
  signal?: AbortSignal;
  /** Polling interval for waitUntil. Not a correctness sleep — predicate decides readiness. */
  pollIntervalMs?: number;
}>;

export type StepLog = Readonly<{
  phase: ScenarioPhase | "runner";
  atMs: number;
  message: string;
  data?: Readonly<Record<string, unknown>>;
}>;

export class PhaseTimeoutError extends Error {
  readonly phase: ScenarioPhase;
  readonly label: string;
  readonly timeoutMs: number;

  constructor(phase: ScenarioPhase, label: string, timeoutMs: number) {
    super(`Timed out in phase "${phase}" while waiting for: ${label} (${String(timeoutMs)}ms)`);
    this.name = "PhaseTimeoutError";
    this.phase = phase;
    this.label = label;
    this.timeoutMs = timeoutMs;
  }
}

export class PhaseAbortError extends Error {
  readonly phase: ScenarioPhase | null;

  constructor(phase: ScenarioPhase | null) {
    super(phase ? `Aborted during phase "${phase}".` : "Aborted before a phase started.");
    this.name = "PhaseAbortError";
    this.phase = phase;
  }
}

function delay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new PhaseAbortError(null));
      return;
    }
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(timer);
      reject(new PhaseAbortError(null));
    };
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

/**
 * Explicit phase clock for scenario execution.
 * Correctness depends on predicates and phase transitions — never on fixed sleeps alone.
 */
export class PhaseClock {
  private currentPhase: ScenarioPhase | null = null;
  private phaseStartedAt = 0;
  private readonly startedAt: number;
  private readonly logs: StepLog[] = [];
  private readonly now: () => number;
  private readonly phaseTimeoutMs: number;
  private readonly pollIntervalMs: number;
  private readonly signal: AbortSignal | undefined;

  constructor(options: PhaseClockOptions) {
    if (!Number.isFinite(options.phaseTimeoutMs) || options.phaseTimeoutMs <= 0) {
      throw new TypeError("phaseTimeoutMs must be a positive finite number.");
    }
    this.phaseTimeoutMs = options.phaseTimeoutMs;
    this.pollIntervalMs = options.pollIntervalMs ?? 16;
    this.now = options.now ?? Date.now;
    this.signal = options.signal;
    this.startedAt = this.now();
  }

  get phase(): ScenarioPhase | null {
    return this.currentPhase;
  }

  elapsedMs(): number {
    return this.now() - this.startedAt;
  }

  phaseElapsedMs(): number {
    if (this.currentPhase === null) {
      return 0;
    }
    return this.now() - this.phaseStartedAt;
  }

  getSteps(): readonly StepLog[] {
    return this.logs;
  }

  enter(phase: ScenarioPhase): void {
    this.throwIfAborted();
    this.currentPhase = phase;
    this.phaseStartedAt = this.now();
    this.log(`enter phase ${phase}`);
  }

  log(message: string, data?: Readonly<Record<string, unknown>>): void {
    const entry: StepLog = {
      phase: this.currentPhase ?? "runner",
      atMs: this.elapsedMs(),
      message,
      ...(data === undefined ? {} : { data }),
    };
    this.logs.push(entry);
  }

  throwIfAborted(): void {
    if (this.signal?.aborted) {
      throw new PhaseAbortError(this.currentPhase);
    }
  }

  /**
   * Wait until predicate is true. Polling interval is not a correctness condition.
   */
  async waitUntil(
    predicate: () => boolean | Promise<boolean>,
    label: string,
    timeoutMs: number = this.phaseTimeoutMs,
  ): Promise<void> {
    if (this.currentPhase === null) {
      throw new Error("Cannot waitUntil before entering a phase.");
    }
    const phase = this.currentPhase;
    const deadline = this.now() + timeoutMs;
    this.log(`waitUntil: ${label}`, { timeoutMs });

    while (this.now() < deadline) {
      this.throwIfAborted();
      if (await predicate()) {
        this.log(`waitUntil satisfied: ${label}`);
        return;
      }
      const remaining = deadline - this.now();
      if (remaining <= 0) {
        break;
      }
      await delay(Math.min(this.pollIntervalMs, remaining), this.signal);
    }

    this.throwIfAborted();
    throw new PhaseTimeoutError(phase, label, timeoutMs);
  }
}
