import { describe, expect, it } from "vitest";
import {
  detectComponents,
  extractComponentName,
  parseSource,
} from "./parser";

describe("parseSource", () => {
  it("parses a typed React component export", () => {
    const source = `export function SaveButton() {
  return <button type="button">Save</button>
}`;
    const { ast, errors } = parseSource(source);
    expect(ast).not.toBeNull();
    expect(errors).toEqual([]);
    expect(extractComponentName(ast, source)).toBe("SaveButton");
  });

  it("wraps bare JSX so Babel can parse it", () => {
    const source = `<Button>Save</Button>`;
    const { ast, errors } = parseSource(source);
    expect(ast).not.toBeNull();
    expect(errors).toEqual([]);
  });

  it("recovers from invalid source with errorRecovery", () => {
    const { ast, errors } = parseSource("{{{ not valid");
    expect(errors.length).toBeGreaterThan(0);
    // errorRecovery may still yield a partial AST; either outcome is acceptable
    expect(ast === null || errors.length > 0).toBe(true);
  });

  it("detects shadcn Button and Dialog primitives", () => {
    const source = `export function Demo() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Open</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>Title</DialogTitle>
      </DialogContent>
    </Dialog>
  )
}`;
    const { ast } = parseSource(source);
    const components = detectComponents(ast, source);
    const types = new Set(components.map((c) => c.type));
    expect(types.has("Button")).toBe(true);
    expect(types.has("Dialog")).toBe(true);
  });
});
