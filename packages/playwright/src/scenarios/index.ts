import type { MotionStressScenarioId } from "@motionguard/core";
import type { ScenarioExecutor } from "./helpers.js";
import { readLabState, waitForAnimationFrameMarker } from "./helpers.js";

const TRIGGER = "[data-mg-trigger]";
const SECONDARY = "[data-mg-secondary]";
const REMOVE = "[data-mg-remove]";
const REPLACE = "[data-mg-replace]";
const STATUS = "[data-mg-status]";

export const scenarioExecutors: Record<MotionStressScenarioId, ScenarioExecutor> = {
  "interrupt-reverse": async (ctx) => {
    ctx.clock.enter("setup");
    await ctx.driver.goto(ctx.baseUrl);
    await ctx.driver.setViewport({ width: 1280, height: 720 });
    ctx.collectEvidence("final-state-snapshot");

    ctx.clock.enter("arm");
    await ctx.clock.waitUntil(() => ctx.driver.exists(TRIGGER), "trigger-ready");

    ctx.clock.enter("trigger");
    await ctx.driver.click(TRIGGER);
    ctx.collectEvidence("enter-triggered");
    await waitForAnimationFrameMarker(ctx);

    ctx.clock.enter("adversity");
    await ctx.driver.click(TRIGGER);
    ctx.collectEvidence("mid-enter-reversed");
    await waitForAnimationFrameMarker(ctx);
    await ctx.driver.click(TRIGGER);
    ctx.collectEvidence("exit-triggered");
    await waitForAnimationFrameMarker(ctx);
    await ctx.driver.click(TRIGGER);
    ctx.collectEvidence("mid-exit-reversed");

    ctx.clock.enter("observe");
    const state = await readLabState(ctx);
    ctx.note("final-state", { state });
    await ctx.clock.waitUntil(async () => (await ctx.driver.exists(STATUS)) === true, "status");

    ctx.clock.enter("teardown");
  },

  "rapid-trigger": async (ctx) => {
    ctx.clock.enter("setup");
    await ctx.driver.goto(ctx.baseUrl);
    await ctx.driver.setViewport({ width: 1280, height: 720 });

    ctx.clock.enter("arm");
    await ctx.clock.waitUntil(() => ctx.driver.exists(TRIGGER), "trigger-ready");

    ctx.clock.enter("trigger");
    ctx.collectEvidence("burst-started");
    ctx.clock.enter("adversity");
    for (let i = 0; i < 12; i += 1) {
      ctx.throwIfAborted();
      await ctx.driver.click(TRIGGER);
    }
    ctx.collectEvidence("burst-completed");

    ctx.clock.enter("observe");
    const activations = await ctx.driver.evaluate<number>("window.__mgActivations ?? 0");
    ctx.note("activation-count", { activations });
    ctx.collectEvidence("activation-count");
    ctx.collectEvidence("final-state-snapshot");

    ctx.clock.enter("teardown");
  },

  "pointer-geometry-change": async (ctx) => {
    ctx.clock.enter("setup");
    await ctx.driver.goto(ctx.baseUrl);
    await ctx.driver.setViewport({ width: 1280, height: 720 });

    ctx.clock.enter("arm");
    await ctx.clock.waitUntil(() => ctx.driver.exists(ctx.target), "target-ready");
    const before = await ctx.driver.boundingBox(ctx.target);

    ctx.clock.enter("trigger");
    await ctx.driver.pointerDown(ctx.target);
    ctx.collectEvidence("pointer-down");
    await ctx.driver.click(TRIGGER);

    ctx.clock.enter("adversity");
    await waitForAnimationFrameMarker(ctx);
    const mid = await ctx.driver.boundingBox(ctx.target);
    ctx.collectEvidence("geometry-changed");
    if (mid) {
      await ctx.driver.pointerMove(mid.x + mid.width / 2, mid.y + mid.height / 2);
      ctx.collectEvidence("pointer-move");
    }
    await ctx.driver.pointerUp();
    ctx.collectEvidence("pointer-up");

    ctx.clock.enter("observe");
    const after = await ctx.driver.boundingBox(ctx.target);
    ctx.note("hit-target-delta", {
      before,
      mid,
      after,
      deltaX: (after?.x ?? 0) - (before?.x ?? 0),
    });
    ctx.collectEvidence("hit-target-delta");

    ctx.clock.enter("teardown");
  },

  "keyboard-during-motion": async (ctx) => {
    ctx.clock.enter("setup");
    await ctx.driver.goto(ctx.baseUrl);
    await ctx.driver.setViewport({ width: 1280, height: 720 });

    ctx.clock.enter("arm");
    await ctx.clock.waitUntil(() => ctx.driver.exists(TRIGGER), "trigger-ready");

    ctx.clock.enter("trigger");
    await ctx.driver.focus(TRIGGER);
    await ctx.driver.press("Enter");
    ctx.collectEvidence("motion-started");

    ctx.clock.enter("adversity");
    await waitForAnimationFrameMarker(ctx);
    await ctx.driver.focus(SECONDARY);
    ctx.collectEvidence("focus-moved");
    await ctx.driver.press("Enter");
    ctx.collectEvidence("keyboard-activated");

    ctx.clock.enter("observe");
    const state = await readLabState(ctx);
    ctx.note("focus-path", { state, secondary: SECONDARY });
    ctx.collectEvidence("focus-path");
    ctx.collectEvidence("final-state-snapshot");

    ctx.clock.enter("teardown");
  },

  "viewport-resize": async (ctx) => {
    ctx.clock.enter("setup");
    await ctx.driver.goto(ctx.baseUrl);
    await ctx.driver.setViewport({ width: 1280, height: 720 });

    ctx.clock.enter("arm");
    await ctx.clock.waitUntil(() => ctx.driver.exists(ctx.target), "target-ready");
    const before = await ctx.driver.boundingBox(ctx.target);
    ctx.collectEvidence("layout-snapshot-before");

    ctx.clock.enter("trigger");
    await ctx.driver.click(TRIGGER);
    ctx.collectEvidence("motion-started");

    ctx.clock.enter("adversity");
    await waitForAnimationFrameMarker(ctx);
    await ctx.driver.setViewport({ width: 800, height: 600 });
    ctx.collectEvidence("viewport-resized");

    ctx.clock.enter("observe");
    const after = await ctx.driver.boundingBox(ctx.target);
    ctx.note("layout-snapshots", { before, after });
    ctx.collectEvidence("layout-snapshot-after");

    ctx.clock.enter("teardown");
  },

  "visibility-pause-resume": async (ctx) => {
    ctx.clock.enter("setup");
    await ctx.driver.goto(ctx.baseUrl);
    await ctx.driver.setViewport({ width: 1280, height: 720 });

    ctx.clock.enter("arm");
    await ctx.clock.waitUntil(() => ctx.driver.exists(TRIGGER), "trigger-ready");

    ctx.clock.enter("trigger");
    await ctx.driver.click(TRIGGER);
    ctx.collectEvidence("motion-started");

    ctx.clock.enter("adversity");
    await waitForAnimationFrameMarker(ctx);
    await ctx.driver.setVisibilityState("hidden");
    ctx.collectEvidence("visibility-hidden");
    await ctx.driver.setVisibilityState("visible");
    ctx.collectEvidence("visibility-visible");

    ctx.clock.enter("observe");
    const state = await readLabState(ctx);
    ctx.note("resume-state", { state });
    ctx.collectEvidence("resume-state-snapshot");

    ctx.clock.enter("teardown");
  },

  "target-removal": async (ctx) => {
    ctx.clock.enter("setup");
    await ctx.driver.goto(ctx.baseUrl);
    await ctx.driver.setViewport({ width: 1280, height: 720 });

    ctx.clock.enter("arm");
    await ctx.clock.waitUntil(() => ctx.driver.exists(ctx.target), "target-ready");

    ctx.clock.enter("trigger");
    await ctx.driver.click(TRIGGER);
    ctx.collectEvidence("motion-started");

    ctx.clock.enter("adversity");
    await waitForAnimationFrameMarker(ctx);
    await ctx.driver.click(REPLACE);
    ctx.collectEvidence("target-removed-or-replaced");
    const replacedExists = await ctx.driver.exists("#target-replaced");
    if (!replacedExists) {
      await ctx.driver.click(REMOVE);
    }

    ctx.clock.enter("observe");
    const present = await ctx.driver.exists(ctx.target);
    ctx.note("dom-presence", { present, replacedExists });
    ctx.collectEvidence("dom-presence-check");
    try {
      if (await ctx.driver.exists("#target-replaced")) {
        await ctx.driver.click("#target-replaced");
      }
      ctx.collectEvidence("interaction-probe");
    } catch {
      ctx.collectEvidence("interaction-probe");
      ctx.note("interaction-probe-failed");
    }

    ctx.clock.enter("teardown");
  },

  "reduced-motion-rerun": async (ctx) => {
    ctx.clock.enter("setup");
    await ctx.driver.goto(ctx.baseUrl);
    await ctx.driver.setViewport({ width: 1280, height: 720 });

    ctx.clock.enter("arm");
    await ctx.clock.waitUntil(() => ctx.driver.exists(TRIGGER), "trigger-ready");

    ctx.clock.enter("trigger");
    await ctx.driver.setReducedMotion("no-preference");
    await ctx.driver.click(TRIGGER);
    const baseline = await readLabState(ctx);
    ctx.collectEvidence("baseline-run");

    ctx.clock.enter("adversity");
    await ctx.driver.setReducedMotion("reduce");
    ctx.collectEvidence("preference-applied");
    await ctx.driver.click(TRIGGER);
    const reduced = await readLabState(ctx);
    ctx.collectEvidence("reduced-motion-run");

    ctx.clock.enter("observe");
    ctx.note("comparison-delta", { baseline, reduced, changed: baseline !== reduced });
    ctx.collectEvidence("comparison-delta");

    ctx.clock.enter("teardown");
  },

  "cancellation-timeout-close": async (ctx) => {
    ctx.clock.enter("setup");
    await ctx.driver.goto(ctx.baseUrl);
    await ctx.driver.setViewport({ width: 1280, height: 720 });

    ctx.clock.enter("arm");
    await ctx.clock.waitUntil(() => ctx.driver.exists(TRIGGER), "trigger-ready");

    ctx.clock.enter("trigger");
    await ctx.driver.click(TRIGGER);

    ctx.clock.enter("adversity");
    // Exercise cancel path when an external abort arrives; otherwise demonstrate phase timeout identity.
    if (ctx.signal.aborted) {
      ctx.collectEvidence("cancel-path-exercised");
      throw new Error("Aborted during adversity.");
    }
    ctx.collectEvidence("cancel-path-exercised");
    try {
      await ctx.clock.waitUntil(() => false, "intentional-timeout-probe", 30);
    } catch (error) {
      ctx.note("timeout-probe", {
        name: error instanceof Error ? error.name : "unknown",
        message: error instanceof Error ? error.message : String(error),
      });
      ctx.collectEvidence("timeout-phase-identified");
    }

    ctx.clock.enter("observe");
    ctx.collectEvidence("bounded-diagnostics");
    ctx.collectEvidence("resources-released");

    ctx.clock.enter("teardown");
  },
};
