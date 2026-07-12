/**
 * Five-repeat deterministic regression check.
 * Compares materially stable analysis outputs (volatile id/analyzedAt stripped).
 * Fails on drift/flakiness across repeats.
 */
import { CODE_EXAMPLES } from "../examples/index";
import { analyzeComponent } from "../lib/analyze";
import { stableFingerprint } from "../lib/test-utils";

const REPEATS = 5;

const EXTRA_CASES: Array<{ id: string; code: string }> = [
  { id: "empty-source", code: "" },
  { id: "whitespace-only", code: "   \n\t  " },
  { id: "invalid-source", code: "{{{ not valid" },
];

type Case = { id: string; code: string };

const cases: Case[] = [
  ...CODE_EXAMPLES.map((ex) => ({ id: ex.id, code: ex.code })),
  ...EXTRA_CASES,
];

let failures = 0;

for (const testCase of cases) {
  const fingerprints: string[] = [];
  const summaries: string[] = [];

  for (let i = 0; i < REPEATS; i += 1) {
    const report = analyzeComponent(testCase.code);
    fingerprints.push(stableFingerprint(report));
    summaries.push(
      JSON.stringify({
        score: report.summary.score,
        totalIssues: report.summary.totalIssues,
        issueIds: report.issues.map((issue) => issue.id),
        fixIds: report.suggestedFixes.map((fix) => fix.id),
        parseErrors: report.parseErrors,
        primaryType: report.primaryType,
      })
    );
  }

  const uniqueFingerprints = new Set(fingerprints);
  const uniqueSummaries = new Set(summaries);

  if (uniqueFingerprints.size !== 1 || uniqueSummaries.size !== 1) {
    failures += 1;
    console.error(`FAIL ${testCase.id}: drifted across ${REPEATS} runs`);
    console.error(`  fingerprints: ${uniqueFingerprints.size}`);
    console.error(`  summaries: ${uniqueSummaries.size}`);
    for (let i = 0; i < REPEATS; i += 1) {
      console.error(`  run ${i + 1} summary: ${summaries[i]}`);
    }
  } else {
    console.log(`OK   ${testCase.id} ×${REPEATS}`);
  }
}

if (failures > 0) {
  console.error(`\nDeterminism check failed for ${failures} case(s).`);
  process.exit(1);
}

console.log(
  `\nDeterminism check passed: ${cases.length} cases × ${REPEATS} repeats.`
);
