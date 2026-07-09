import { CODE_EXAMPLES } from "../examples/index";
import { analyzeComponent } from "../lib/analyze";

for (const ex of CODE_EXAMPLES) {
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
}
