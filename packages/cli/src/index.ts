import {
  listMotionStressScenarioIds,
  MOTIONGUARD_SCHEMA_VERSION,
  parseSeed,
} from "@motionguard/core";

const VERSION = "0.0.0";

export type CliIo = Readonly<{
  stdout: (message: string) => void;
  stderr: (message: string) => void;
}>;

const defaultIo: CliIo = {
  stdout: (message) => console.log(message),
  stderr: (message) => console.error(message),
};

export type RunCliOptions = Readonly<{
  io?: CliIo;
  runSuite?: (args: RunCommandArgs) => Promise<{ passed: boolean; output: string }>;
}>;

export type RunCommandArgs = Readonly<{
  scenarioId?: string;
  seed: number;
  target: string;
  baseUrl: string;
  browser: boolean;
  artifactDir: string;
}>;

function printHelp(io: CliIo): void {
  io.stdout(
    `MotionGuard ${VERSION}

Usage: motionguard <command> [options]

Commands:
  check    Run the full seeded motion stress suite
  run      Reproduce one scenario against one target
  list     List built-in motion stress scenarios

Options:
  --scenario <id>     Scenario id for reproduction
  --seed <n>          Deterministic seed (default: 0)
  --target <sel>      CSS selector for the motion target
  --base-url <url>    Fixture or app URL
  --artifact-dir <p>  Artifact output directory
  --browser           Use Playwright Chromium instead of the mock driver
  -h, --help          Show help
  -v, --version       Show version

Schema: ${MOTIONGUARD_SCHEMA_VERSION}

Example:
  motionguard run --scenario rapid-trigger --seed 42 --target '[data-mg-target]' --base-url http://127.0.0.1:4173/fixtures/motion-lab.html`,
  );
}

function readFlag(args: readonly string[], name: string): string | undefined {
  const index = args.indexOf(name);
  if (index === -1) {
    return undefined;
  }
  return args[index + 1];
}

function hasFlag(args: readonly string[], name: string): boolean {
  return args.includes(name);
}

function parseRunArgs(args: readonly string[]): RunCommandArgs {
  const seedRaw = readFlag(args, "--seed") ?? "0";
  const target = readFlag(args, "--target") ?? "[data-mg-target]";
  const baseUrl = readFlag(args, "--base-url") ?? "http://127.0.0.1:4173/fixtures/motion-lab.html";
  const artifactDir = readFlag(args, "--artifact-dir") ?? ".motionguard/artifacts";
  const scenarioId = readFlag(args, "--scenario");
  return {
    ...(scenarioId === undefined ? {} : { scenarioId }),
    seed: parseSeed(seedRaw),
    target,
    baseUrl,
    browser: hasFlag(args, "--browser"),
    artifactDir,
  };
}

async function defaultRunSuite(args: RunCommandArgs): Promise<{ passed: boolean; output: string }> {
  const playwright = await import("@motionguard/playwright");
  const config = playwright.createDefaultRunnerConfig({
    seed: args.seed,
    baseUrl: args.baseUrl,
    target: args.target,
    artifactDir: args.artifactDir,
    ...(args.scenarioId === undefined ? {} : { scenarioIds: [args.scenarioId] }),
  });
  const result = await playwright.runMotionStressSuite({
    ...config,
    ...(args.browser
      ? { driverFactory: playwright.createPlaywrightDriverFactory() }
      : { driverFactory: playwright.createMockDriverFactory() }),
  });
  const lines = [
    `seed=${String(result.seed)}`,
    `order=${result.scenarioOrder.join(",")}`,
    `passed=${String(result.passed)}`,
    ...result.results.map(
      (item) =>
        `${item.scenarioId}: ${item.status} evidence=${String(item.evidence.length)} repro=${item.reproductionCommand}`,
    ),
  ];
  return { passed: result.passed, output: lines.join("\n") };
}

export async function runCli(
  args: readonly string[],
  ioOrOptions: CliIo | RunCliOptions = defaultIo,
): Promise<number> {
  const options: RunCliOptions =
    typeof ioOrOptions === "object" && ioOrOptions !== null && "stdout" in ioOrOptions
      ? { io: ioOrOptions }
      : ioOrOptions;
  const io = options.io ?? defaultIo;
  const runSuite = options.runSuite ?? defaultRunSuite;

  if (args.includes("--version") || args.includes("-v")) {
    io.stdout(VERSION);
    return 0;
  }

  if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
    printHelp(io);
    return 0;
  }

  const [command, ...rest] = args;
  if (command === "list") {
    for (const id of listMotionStressScenarioIds()) {
      io.stdout(id);
    }
    return 0;
  }

  if (command === "check" || command === "run") {
    try {
      const parsed = parseRunArgs(rest);
      if (command === "run" && !parsed.scenarioId) {
        io.stderr("run requires --scenario <id>");
        return 1;
      }
      const result = await runSuite(parsed);
      io.stdout(result.output);
      return result.passed ? 0 : 1;
    } catch (error) {
      io.stderr(error instanceof Error ? error.message : String(error));
      return 1;
    }
  }

  io.stderr(`Unknown command: ${command ?? ""}`);
  return 1;
}
