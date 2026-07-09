import type { AxeViolation } from "@/types/analysis";

/**
 * Client-side axe-core runner for live DOM preview checks.
 * Static source analysis lives in lib/rules/a11y.ts; this augments
 * the report when a real DOM node is available in the preview pane.
 */
export async function runAxeOnElement(
  element: HTMLElement
): Promise<AxeViolation[]> {
  if (typeof window === "undefined") return [];

  try {
    const axe = await import("axe-core");
    const results = await axe.default.run(element, {
      resultTypes: ["violations"],
      runOnly: {
        type: "tag",
        values: ["wcag2a", "wcag2aa", "best-practice"],
      },
    });

    return results.violations.map((v) => ({
      id: v.id,
      impact: v.impact,
      description: v.description,
      help: v.help,
      helpUrl: v.helpUrl,
      nodes: v.nodes.length,
    }));
  } catch {
    return [];
  }
}
