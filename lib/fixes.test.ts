import { describe, expect, it } from "vitest";
import { analyzeComponent } from "./analyze";
import { buildSuggestedFixes } from "./fixes";

describe("buildSuggestedFixes", () => {
  it("emits templates for state and a11y findings on icon button", () => {
    const report = analyzeComponent(`import { Button } from "@/components/ui/button"
import { Save } from "lucide-react"
export function SaveButton() {
  return (
    <Button size="icon" onClick={() => {}}>
      <Save className="h-4 w-4" />
    </Button>
  )
}`);
    const fixes = buildSuggestedFixes(report.issues, report.sourceCode, report.primaryType);
    expect(fixes.length).toBeGreaterThan(0);
    expect(fixes.every((f) => f.after.length > 0)).toBe(true);
    expect(fixes.some((f) => f.issueId === "state-focus")).toBe(true);
    expect(fixes.some((f) => f.issueId.startsWith("a11y-"))).toBe(true);
  });

  it("dedupes by issueId", () => {
    const report = analyzeComponent(`import { Button } from "@/components/ui/button"
import { Save } from "lucide-react"
export function SaveButton() {
  return (
    <Button size="icon">
      <Save className="h-4 w-4" />
    </Button>
  )
}`);
    const issueIds = report.suggestedFixes.map((f) => f.issueId);
    expect(new Set(issueIds).size).toBe(issueIds.length);
  });
});
