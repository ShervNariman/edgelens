import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { analyzeComponent } from "../lib/analyze";
import { RULE_CORPUS } from "../lib/rules/__fixtures__/corpus";
import { CODE_EXAMPLES } from "../examples/index";

describe("SHE-150 rule corpus", () => {
  for (const fixture of RULE_CORPUS) {
    it(`${fixture.kind} · ${fixture.family} · ${fixture.id}`, () => {
      const report = analyzeComponent(fixture.code);
      const ids = new Set(report.issues.map((i) => i.id));
      const titles = report.issues.map((i) => i.title);

      for (const id of fixture.expectIssueIds ?? []) {
        assert.ok(ids.has(id), `expected issue id ${id}; got [${[...ids].join(", ")}]`);
      }
      for (const fragment of fixture.expectTitleIncludes ?? []) {
        assert.ok(
          titles.some((t) => t.includes(fragment)),
          `expected title including "${fragment}"; got [${titles.join(" | ")}]`
        );
      }
      for (const id of fixture.forbidIssueIds ?? []) {
        assert.ok(!ids.has(id), `forbidden issue id ${id} was present`);
      }
      for (const fragment of fixture.forbidTitleIncludes ?? []) {
        assert.ok(
          !titles.some((t) => t.includes(fragment)),
          `forbidden title "${fragment}" was present`
        );
      }
      if (fixture.expectAnyIssueIds?.length) {
        assert.ok(
          fixture.expectAnyIssueIds.some((id) => ids.has(id)),
          `expected one of [${fixture.expectAnyIssueIds.join(", ")}]`
        );
      }
      if (fixture.expectLocationsUnreliable) {
        assert.equal(report.locationsUnreliable, true);
        assert.ok(report.issues.every((i) => i.location === undefined));
      }
      if (fixture.expectMinIssues != null) {
        assert.ok(
          report.issues.length >= fixture.expectMinIssues,
          `expected >= ${fixture.expectMinIssues} issues`
        );
      }

      // Every finding must carry deterministic evidence + confidence
      for (const issue of report.issues) {
        assert.ok(issue.evidence?.length, `missing evidence on ${issue.id}`);
        assert.ok(
          issue.confidence === "high" ||
            issue.confidence === "medium" ||
            issue.confidence === "low",
          `bad confidence on ${issue.id}`
        );
        assert.ok(
          issue.requirement === "required" ||
            issue.requirement === "recommended" ||
            issue.requirement === "optional",
          `bad requirement on ${issue.id}`
        );
      }
    });
  }
});

describe("built-in examples remain analyzable", () => {
  for (const ex of CODE_EXAMPLES) {
    it(`example ${ex.id}`, () => {
      const report = analyzeComponent(ex.code);
      assert.ok(report.summary.totalIssues >= 0);
      assert.ok(report.issues.every((i) => i.evidence));
      assert.ok(Array.isArray(report.checkStatuses));
    });
  }

  it("team-invite marketing example reveals multi-state + SheetTitle story", () => {
    const ex = CODE_EXAMPLES.find((e) => e.id === "team-invite");
    assert.ok(ex);
    const report = analyzeComponent(ex!.code);
    const ids = new Set(report.issues.map((i) => i.id));
    const titles = report.issues.map((i) => i.title);

    assert.ok(
      titles.some((t) => t.includes("Sheet missing SheetTitle")),
      "expected SheetTitle finding"
    );
    assert.ok(
      ids.has("state-loading") || ids.has("state-async-submit-guard"),
      "expected async/loading gap"
    );
    assert.ok(
      ids.has("state-empty") || ids.has("state-list-retry"),
      "expected empty or list retry gap"
    );
    assert.ok(
      titles.some((t) => t.includes("Select missing SelectValue")) ||
        ids.has("pattern-missing-key"),
      "expected select or key composition issue"
    );

    // Finding → fix mapping stays consistent
    for (const issue of report.issues) {
      const fix = report.suggestedFixes.find((f) => f.issueId === issue.id);
      if (issue.severity !== "info" || issue.fixSnippet) {
        // high-value findings should map to a fix template when non-info or snippeted
        if (issue.category === "accessibility" || issue.severity !== "info") {
          assert.ok(fix, `missing fix mapping for ${issue.id}`);
          assert.ok(fix!.adaptNote || fix!.after, "fix should be copyable/adaptable");
        }
      }
    }
  });
});

describe("determinism", () => {
  it("five repeated runs produce materially identical reports", () => {
    const code = CODE_EXAMPLES.find((e) => e.id === "team-invite")!.code;
    const fingerprints = Array.from({ length: 5 }, () => {
      const r = analyzeComponent(code);
      return JSON.stringify({
        score: r.summary.score,
        issueIds: r.issues.map((i) => i.id).sort(),
        evidence: r.issues.map((i) => i.evidence).sort(),
        confidence: r.issues.map((i) => `${i.id}:${i.confidence}`).sort(),
        fixIds: r.suggestedFixes.map((f) => f.issueId).sort(),
        coverage: r.stateCoverage.map((s) => `${s.state}:${s.present}:${s.requirement}`),
      });
    });
    for (let i = 1; i < fingerprints.length; i += 1) {
      assert.equal(fingerprints[i], fingerprints[0]);
    }
  });
});
