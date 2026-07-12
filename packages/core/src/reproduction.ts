import type { MotionStressScenarioId } from "./scenarios.js";

export type ReproductionCommandOptions = Readonly<{
  scenarioId: MotionStressScenarioId | string;
  seed: number;
  target: string;
  baseUrl?: string;
  bin?: string;
}>;

/**
 * Build a shell-safe command that reruns one scenario against one target.
 */
export function buildReproductionCommand(options: ReproductionCommandOptions): string {
  const bin = options.bin ?? "motionguard";
  const parts = [
    bin,
    "run",
    "--scenario",
    shellQuote(options.scenarioId),
    "--seed",
    String(options.seed),
    "--target",
    shellQuote(options.target),
  ];
  if (options.baseUrl !== undefined) {
    parts.push("--base-url", shellQuote(options.baseUrl));
  }
  return parts.join(" ");
}

function shellQuote(value: string): string {
  if (/^[A-Za-z0-9_./:@%=+-]+$/.test(value)) {
    return value;
  }
  return `'${value.replaceAll("'", `'\\''`)}'`;
}
