import { describe, expect, it, vi } from "vitest";
import { runCli } from "../src/index.js";

function createIo() {
  return {
    stdout: vi.fn<(message: string) => void>(),
    stderr: vi.fn<(message: string) => void>(),
  };
}

describe("runCli", () => {
  it("prints help describing check and run", async () => {
    const io = createIo();
    expect(await runCli([], io)).toBe(0);
    expect(io.stdout).toHaveBeenCalledWith(expect.stringContaining("check"));
    expect(io.stdout).toHaveBeenCalledWith(expect.stringContaining("run"));
  });

  it("lists built-in scenarios", async () => {
    const io = createIo();
    expect(await runCli(["list"], io)).toBe(0);
    expect(io.stdout).toHaveBeenCalledWith("interrupt-reverse");
    expect(io.stdout).toHaveBeenCalledWith("reduced-motion-rerun");
  });

  it("requires --scenario for run", async () => {
    const io = createIo();
    expect(await runCli(["run", "--seed", "1"], { io })).toBe(1);
    expect(io.stderr).toHaveBeenCalledWith("run requires --scenario <id>");
  });

  it("delegates check to the suite runner", async () => {
    const io = createIo();
    const runSuite = vi.fn(async () => ({ passed: true, output: "ok" }));
    expect(await runCli(["check", "--seed", "2", "--target", "#x"], { io, runSuite })).toBe(0);
    expect(runSuite).toHaveBeenCalledWith(expect.objectContaining({ seed: 2, target: "#x" }));
    expect(io.stdout).toHaveBeenCalledWith("ok");
  });

  it("returns a failure for an unknown command", async () => {
    const io = createIo();
    expect(await runCli(["unknown"], io)).toBe(1);
    expect(io.stderr).toHaveBeenCalledWith("Unknown command: unknown");
  });
});
