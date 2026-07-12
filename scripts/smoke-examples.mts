/**
 * Stable analyzer smoke over built-in examples.
 * Prefer `npm run smoke` (pinned local tsx) over transient `npx tsx`.
 */
import { CODE_EXAMPLES } from "../examples/index";
import { analyzeComponent } from "../lib/analyze";

let failures = 0;

for (const ex of CODE_EXAMPLES) {
  try {
    const r = analyzeComponent(ex.code);
    const states = r.issues
      .filter((i) => i.category === "missing-state")
      .map((i) => i.state ?? i.title);
    const a11y = r.issues
      .filter((i) => i.category === "accessibility")
      .map((i) => i.title);
    console.log(
      "---",
      ex.id,
      "|",
      r.primaryType,
      "| score",
      r.summary.score,
      "| issues",
      r.summary.totalIssues,
      "| fixes",
      r.suggestedFixes.length
    );
    console.log("  states:", states.join(", ") || "(none)");
    console.log("  a11y:", a11y.join(", ") || "(none)");

    if (r.summary.totalIssues < 1) {
      failures += 1;
      console.error(`  ERROR: expected findings for ${ex.id}`);
    }
  } catch (err) {
    failures += 1;
    console.error(`  ERROR analyzing ${ex.id}:`, err);
  }
}

if (failures > 0) {
  console.error(`\nSmoke failed: ${failures} example(s).`);
  process.exit(1);
}

console.log(`\nSmoke passed for ${CODE_EXAMPLES.length} built-in examples.`);
