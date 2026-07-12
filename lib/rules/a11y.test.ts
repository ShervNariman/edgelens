import { describe, expect, it } from "vitest";
import { detectComponents, parseSource } from "../parser";
import { checkAccessibility } from "./a11y";

function runA11y(source: string) {
  const { ast } = parseSource(source);
  return checkAccessibility(source, detectComponents(ast, source));
}

describe("checkAccessibility", () => {
  it("flags icon-only Button missing accessible name", () => {
    const source = `import { Button } from "@/components/ui/button"
import { Save } from "lucide-react"
export function SaveButton() {
  return (
    <Button size="icon">
      <Save className="h-4 w-4" />
    </Button>
  )
}`;
    const issues = runA11y(source);
    expect(issues.some((i) => i.a11yRuleId === "button-name")).toBe(true);
  });

  it("flags Input missing label", () => {
    const source = `import { Input } from "@/components/ui/input"
export function EmailField() {
  return <Input type="email" placeholder="Email" />
}`;
    const issues = runA11y(source);
    expect(issues.some((i) => i.a11yRuleId === "label")).toBe(true);
  });

  it("flags Dialog missing DialogTitle", () => {
    const source = `import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
export function Settings() {
  return (
    <Dialog>
      <DialogTrigger asChild><Button>Open</Button></DialogTrigger>
      <DialogContent>Body only</DialogContent>
    </Dialog>
  )
}`;
    const issues = runA11y(source);
    expect(issues.some((i) => /DialogTitle/i.test(i.title))).toBe(true);
  });

  it("passes when icon Button has aria-label", () => {
    const source = `import { Button } from "@/components/ui/button"
import { Save } from "lucide-react"
export function SaveButton() {
  return (
    <Button size="icon" aria-label="Save">
      <Save className="h-4 w-4" />
    </Button>
  )
}`;
    const issues = runA11y(source);
    expect(issues.some((i) => i.a11yRuleId === "button-name")).toBe(false);
  });
});
