import { readFile } from "node:fs/promises";

const coreTypes = await readFile("packages/core/src/types.ts", "utf8");
for (const contract of ["reducedMotion", "viewport", "interaction"]) {
  if (!coreTypes.includes(contract)) {
    throw new Error(`Core contract is missing experience dimension: ${contract}`);
  }
}

const scenarios = await readFile("packages/core/src/scenarios.ts", "utf8");
for (const adversity of [
  "interrupt-reverse",
  "rapid-trigger",
  "pointer-geometry-change",
  "keyboard-during-motion",
  "viewport-resize",
  "visibility-pause-resume",
  "target-removal",
  "reduced-motion-rerun",
  "cancellation-timeout-close",
]) {
  if (!scenarios.includes(adversity)) {
    throw new Error(`Motion stress catalog is missing adversity scenario: ${adversity}`);
  }
}

console.log(
  "Verified accessibility, responsive, interaction, and motion-adversity dimensions in core contracts.",
);
