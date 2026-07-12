import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const forbiddenTrackedPaths = [
  /(^|\/)\.env($|\.)/i,
  /(^|\/)(content|screenshots|reports)\/private(\/|$)/i,
  /\.(pem|key|p12|pfx)$/i,
];

const allowedTrackedPaths = new Set([".env.example"]);

const secretPatterns = [
  ["private key", /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/],
  ["OpenAI key", /\bsk-(?:proj-)?[A-Za-z0-9_-]{20,}\b/],
  ["xAI key", /\bxai-[A-Za-z0-9_-]{20,}\b/],
  ["GitHub token", /\bgh[pousr]_[A-Za-z0-9]{30,}\b/],
  ["Linear key", /\blin_api_[A-Za-z0-9_-]{20,}\b/],
  ["Slack token", /\bxox[baprs]-[A-Za-z0-9-]{20,}\b/],
  ["AWS access key", /\bAKIA[0-9A-Z]{16}\b/],
  ["Resend key", /\bre_[A-Za-z0-9]{20,}\b/],
];

/** Runtime app surfaces only — docs/history may mention sibling products for governance. */
const runtimePath = /^(app|components|lib|public|styles)\//;

/**
 * Sibling / wrong-repo product terminology that must not leak into EdgeLens runtime code.
 * Prefer specific multi-token forms for Release Room to avoid false positives on "release".
 */
const otherProductNames = [
  "headroom",
  "slopcheck",
  "popover-fit",
  "hover-bridge",
  "motionguard",
  "motion-guard",
  "motion_guard",
  "release room",
  "releaseroom",
  "release-room",
  "release_room",
  "xproductinsights",
  "x-product-insights",
  "sherv-website",
];

function git(...args) {
  return execFileSync("git", args, {
    encoding: "utf8",
    maxBuffer: 128 * 1024 * 1024,
  });
}

const failures = [];
const trackedFiles = git("ls-files", "-z").split("\0").filter(Boolean);

for (const path of trackedFiles) {
  if (!allowedTrackedPaths.has(path) && forbiddenTrackedPaths.some((pattern) => pattern.test(path))) {
    failures.push(`forbidden tracked path: ${path}`);
  }

  if (path === "scripts/public-safety-scan.mjs") continue;

  let content;
  try {
    content = readFileSync(path, "utf8");
  } catch {
    continue;
  }

  for (const [label, pattern] of secretPatterns) {
    if (pattern.test(content)) failures.push(`${label} pattern in ${path}`);
  }

  if (runtimePath.test(path)) {
    const lower = content.toLowerCase();
    for (const product of otherProductNames) {
      if (lower.includes(product)) {
        failures.push(`cross-product runtime reference (${product}) in ${path}`);
      }
    }
  }
}

const history = git("log", "-p", "--all", "--no-color", "--format=");
for (const [label, pattern] of secretPatterns) {
  if (pattern.test(history)) failures.push(`${label} pattern in Git history`);
}

if (failures.length) {
  console.error("Public safety scan failed:");
  for (const failure of [...new Set(failures)]) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Public safety scan passed for ${trackedFiles.length} tracked files and Git history.`);
