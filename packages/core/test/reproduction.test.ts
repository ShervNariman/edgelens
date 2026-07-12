import { describe, expect, it } from "vitest";
import { buildReproductionCommand } from "../src/index.js";

describe("buildReproductionCommand", () => {
  it("builds a single-scenario reproduction command", () => {
    expect(
      buildReproductionCommand({
        scenarioId: "rapid-trigger",
        seed: 42,
        target: "[data-mg-target]",
        baseUrl: "http://127.0.0.1:4173/fixtures/motion-lab.html",
      }),
    ).toBe(
      "motionguard run --scenario rapid-trigger --seed 42 --target '[data-mg-target]' --base-url http://127.0.0.1:4173/fixtures/motion-lab.html",
    );
  });

  it("shell-quotes unsafe target selectors", () => {
    const command = buildReproductionCommand({
      scenarioId: "interrupt-reverse",
      seed: 1,
      target: "button[data-open='yes']",
    });
    expect(
      command.startsWith("motionguard run --scenario interrupt-reverse --seed 1 --target "),
    ).toBe(true);
    expect(command).toContain("yes");
    expect(command).toContain("'");
  });
});
