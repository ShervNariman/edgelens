import { describe, expect, it } from "vitest";
import { detectComponents, parseSource } from "../parser";
import { inferPrimaryType } from "../preview-meta";
import { checkMissingStates } from "./states";

function runStates(source: string) {
  const { ast } = parseSource(source);
  const components = detectComponents(ast, source);
  const primary = inferPrimaryType(components, source);
  return { primary, issues: checkMissingStates(source, primary, components) };
}

describe("checkMissingStates", () => {
  it("flags missing focus/loading/disabled on icon Button", () => {
    const source = `import { Button } from "@/components/ui/button"
import { Save } from "lucide-react"
export function SaveButton() {
  return (
    <Button size="icon" onClick={() => {}}>
      <Save className="h-4 w-4" />
    </Button>
  )
}`;
    const { issues } = runStates(source);
    const states = issues.map((i) => i.state);
    expect(states).toContain("focus");
    expect(states).toContain("loading");
    expect(states).toContain("disabled");
  });

  it("does not flag hover/focus/disabled for plain shadcn Button without className", () => {
    const source = `import { Button } from "@/components/ui/button"
export function ContinueButton() {
  return <Button onClick={() => {}}>Continue</Button>
}`;
    const { issues } = runStates(source);
    const states = new Set(issues.map((i) => i.state));
    expect(states.has("hover")).toBe(false);
    expect(states.has("focus")).toBe(false);
    expect(states.has("disabled")).toBe(false);
  });

  it("flags missing empty/loading on mapped Card list", () => {
    const source = `import { Card, CardContent } from "@/components/ui/card"
export function List({ items }: { items: { id: string }[] }) {
  return (
    <Card>
      <CardContent>
        {items.map((item) => <div key={item.id}>{item.id}</div>)}
      </CardContent>
    </Card>
  )
}`;
    const { issues } = runStates(source);
    const states = issues.map((i) => i.state);
    expect(states).toContain("empty");
    expect(states).toContain("loading");
  });
});
