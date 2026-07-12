import { describe, expect, it } from "vitest";
import { analyzeComponent } from "./analyze";
import { issueIndex, stableFingerprint } from "./test-utils";

describe("analyzeComponent", () => {
  it("recovers from empty source with a critical finding", () => {
    const report = analyzeComponent("   ");
    expect(report.summary.score).toBe(0);
    expect(report.summary.criticalCount).toBe(1);
    expect(report.issues[0]?.id).toBe("empty-source");
    expect(report.parseErrors).toContain("Empty source");
    expect(report.suggestedFixes).toEqual([]);
  });

  it("recovers from invalid source without throwing", () => {
    const report = analyzeComponent("{{{ not valid");
    expect(report.parseErrors.length).toBeGreaterThan(0);
    expect(report.primaryType).toBe("Unknown");
    expect(typeof report.summary.score).toBe("number");
  });

  it("groups findings by provenance sources", () => {
    const report = analyzeComponent(`import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
export function Login() {
  return (
    <form>
      <Input type="email" placeholder="Email" />
      <Button className="bg-blue-600">Sign in</Button>
    </form>
  )
}`);
    const sources = new Set(report.issues.map((i) => i.source));
    expect(sources.has("state-rule") || sources.has("a11y-rule") || sources.has("static")).toBe(
      true
    );
    const categories = new Set(report.issues.map((i) => i.category));
    expect(categories.size).toBeGreaterThan(0);
    expect(report.summary.totalIssues).toBe(report.issues.length);
    expect(
      report.summary.criticalCount +
        report.summary.warningCount +
        report.summary.infoCount
    ).toBe(report.issues.length);
  });

  it("merges axe preview violations as preview-sourced issues", () => {
    const report = analyzeComponent(`export function Ok() { return <Button>Hi</Button> }`, {
      axeViolations: [
        {
          id: "button-name",
          impact: "critical",
          description: "Buttons must have discernible text",
          help: "Buttons must have discernible text",
          helpUrl: "https://example.com",
          nodes: 1,
        },
      ],
    });
    expect(report.previewDomChecked).toBe(true);
    const axeIssue = report.issues.find((i) => i.id === "axe-button-name");
    expect(axeIssue?.source).toBe("preview");
    expect(axeIssue?.category).toBe("accessibility");
  });

  it("scores consistently for the same source", () => {
    const source = `import { Button } from "@/components/ui/button"
export function Save() {
  return <Button size="icon" aria-label="Save"><span /></Button>
}`;
    const a = analyzeComponent(source);
    const b = analyzeComponent(source);
    expect(a.summary.score).toBe(b.summary.score);
    expect(issueIndex(a)).toEqual(issueIndex(b));
    expect(stableFingerprint(a)).toBe(stableFingerprint(b));
  });
});
