import type { PhaseClock } from "@motionguard/core";
import type { MotionPageDriver } from "../driver.js";

export type ScenarioContext = Readonly<{
  driver: MotionPageDriver;
  clock: PhaseClock;
  baseUrl: string;
  target: string;
  signal: AbortSignal;
  collectEvidence: (token: string) => void;
  note: (message: string, data?: Readonly<Record<string, unknown>>) => void;
  throwIfAborted: () => void;
}>;

export type ScenarioExecutor = (ctx: ScenarioContext) => Promise<void>;

export async function waitForAnimationFrameMarker(ctx: ScenarioContext): Promise<void> {
  await ctx.clock.waitUntil(async () => {
    const value = await ctx.driver.evaluate<number>(
      "new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve(1))))",
    );
    return value === 1;
  }, "animation-frame");
}

export async function readLabState(ctx: ScenarioContext): Promise<string> {
  return (
    (await ctx.driver.evaluate<string>(
      "document.querySelector('[data-mg-status]')?.dataset.state ?? 'unknown'",
    )) ?? "unknown"
  );
}
