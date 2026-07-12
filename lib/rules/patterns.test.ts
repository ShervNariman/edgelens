import { describe, expect, it } from "vitest";
import { detectComponents, parseSource } from "../parser";
import { checkPatterns } from "./patterns";

function runPatterns(source: string) {
  const { ast } = parseSource(source);
  return checkPatterns(source, detectComponents(ast, source));
}

describe("checkPatterns", () => {
  it("flags form without submit handler", () => {
    const source = `export function Login() {
  return (
    <form className="space-y-2">
      <input type="email" />
      <button type="submit">Sign in</button>
    </form>
  )
}`;
    const issues = runPatterns(source);
    expect(issues.some((i) => i.id === "pattern-form-submit")).toBe(true);
  });

  it("flags hardcoded blue palette utilities", () => {
    const source = `import { Button } from "@/components/ui/button"
export function Cta() {
  return <Button className="bg-blue-600 text-white">Go</Button>
}`;
    const issues = runPatterns(source);
    expect(issues.some((i) => i.id === "pattern-hardcoded-color")).toBe(true);
  });

  it("flags mapped list missing key", () => {
    const source = `export function List({ items }: { items: string[] }) {
  return <ul>{items.map((item) => <li>{item}</li>)}</ul>
}`;
    const issues = runPatterns(source);
    expect(issues.some((i) => i.id === "pattern-missing-key")).toBe(true);
  });

  it("flags uncontrolled Dialog without open/onOpenChange", () => {
    const source = `import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
export function Box() {
  return (
    <Dialog>
      <DialogContent>
        <DialogTitle>Hi</DialogTitle>
      </DialogContent>
    </Dialog>
  )
}`;
    const issues = runPatterns(source);
    expect(issues.some((i) => i.id === "pattern-dialog-uncontrolled")).toBe(true);
  });
});
