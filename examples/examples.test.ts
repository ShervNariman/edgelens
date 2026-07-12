import { describe, expect, it } from "vitest";
import { CODE_EXAMPLES } from "./index";
import { analyzeComponent } from "@/lib/analyze";
import { issueIndex, stableFingerprint } from "@/lib/test-utils";

const EXPECTED_PRIMARY: Record<string, string> = {
  "icon-button": "Button",
  "login-form": "Card",
  "project-list": "Card",
  "settings-dialog": "Dialog",
  "theme-select": "Select",
};

describe("built-in examples", () => {
  it("exposes five launch-demo examples", () => {
    expect(CODE_EXAMPLES).toHaveLength(5);
    expect(CODE_EXAMPLES.map((ex) => ex.id).sort()).toEqual(
      [
        "icon-button",
        "login-form",
        "project-list",
        "settings-dialog",
        "theme-select",
      ].sort()
    );
  });

  it.each(CODE_EXAMPLES)(
    "analyzes $id deterministically with useful findings",
    (example) => {
      const first = analyzeComponent(example.code);
      const second = analyzeComponent(example.code);

      expect(first.primaryType).toBe(EXPECTED_PRIMARY[example.id]);
      expect(first.parseErrors).toEqual([]);
      expect(first.summary.totalIssues).toBeGreaterThan(0);
      expect(first.suggestedFixes.length).toBeGreaterThan(0);
      expect(first.summary.score).toBeGreaterThanOrEqual(0);
      expect(first.summary.score).toBeLessThanOrEqual(100);

      expect(issueIndex(first)).toEqual(issueIndex(second));
      expect(stableFingerprint(first)).toBe(stableFingerprint(second));
      expect(first.summary).toEqual(second.summary);
    }
  );

  it("icon-button surfaces state + accessible name gaps", () => {
    const report = analyzeComponent(
      CODE_EXAMPLES.find((ex) => ex.id === "icon-button")!.code
    );
    const ids = report.issues.map((i) => i.id);
    expect(ids).toContain("state-focus");
    expect(ids).toContain("state-loading");
    expect(report.issues.some((i) => i.category === "accessibility")).toBe(true);
  });
});
