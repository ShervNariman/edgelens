#!/usr/bin/env node
import { register } from "node:module";
import { pathToFileURL } from "node:url";

// Lightweight launcher — prefer tsx when available via npm script.
import("tsx/esm").then(() => import("./release-room.ts")).catch(async () => {
  // Fallback: run compiled-less via dynamic import after register
  try {
    register("tsx/esm", pathToFileURL("./"));
  } catch {
    // ignore
  }
  await import("./release-room.ts");
});
