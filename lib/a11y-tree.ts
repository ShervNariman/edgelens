import type { A11yNode, AnalysisIssue, DetectedComponent } from "@/types/analysis";

export function buildA11yTree(
  source: string,
  components: DetectedComponent[],
  a11yIssues: AnalysisIssue[]
): A11yNode[] {
  const issueByElement = new Map<string, string[]>();
  for (const issue of a11yIssues) {
    const key = issue.element ?? "document";
    const list = issueByElement.get(key) ?? [];
    list.push(issue.title);
    issueByElement.set(key, list);
  }

  const roots: A11yNode[] = [];

  const push = (
    role: string,
    name: string,
    tag: string,
    elementKey?: string
  ) => {
    roots.push({
      role,
      name,
      tag,
      issues: issueByElement.get(elementKey ?? tag) ?? [],
    });
  };

  if (components.some((c) => c.type === "Dialog") || /DialogContent/.test(source)) {
    push(
      "dialog",
      /DialogTitle[^>]*>([^<]+)/.exec(source)?.[1]?.trim() || "Unnamed dialog",
      "Dialog",
      "Dialog"
    );
  }

  if (components.some((c) => c.type === "Button") || /<Button[\s>]/.test(source)) {
    const labelMatch =
      /aria-label\s*=\s*["']([^"']+)["']/.exec(source) ||
      /<Button[^>]*>\s*([^<{]+)\s*</.exec(source);
    push("button", labelMatch?.[1]?.trim() || "Button", "Button", "Button");
  }

  if (components.some((c) => c.type === "Input") || /<Input[\s/>]/.test(source)) {
    const label =
      /<Label[^>]*>([^<]+)/.exec(source)?.[1]?.trim() ||
      /aria-label\s*=\s*["']([^"']+)["']/.exec(source)?.[1] ||
      "Unlabeled input";
    push("textbox", label, "Input", "Input");
  }

  if (components.some((c) => c.type === "Select")) {
    push(
      "combobox",
      /SelectValue[^>]*placeholder\s*=\s*["']([^"']+)["']/.exec(source)?.[1] ||
        "Select",
      "Select",
      "Select"
    );
  }

  if (components.some((c) => c.type === "Checkbox")) {
    push("checkbox", "Checkbox", "Checkbox", "Checkbox");
  }

  if (components.some((c) => c.type === "Switch")) {
    push("switch", "Switch", "Switch", "Switch");
  }

  if (components.some((c) => c.type === "Tabs")) {
    push("tablist", "Tabs", "Tabs", "Tabs");
  }

  if (/<img[\s>]/.test(source)) {
    push(
      "img",
      /alt\s*=\s*["']([^"']*)["']/.exec(source)?.[1] || "Missing alt",
      "img",
      "img"
    );
  }

  if (roots.length === 0) {
    roots.push({
      role: "region",
      name: "Component root",
      tag: "div",
      issues: a11yIssues.map((i) => i.title),
    });
  }

  return roots;
}
