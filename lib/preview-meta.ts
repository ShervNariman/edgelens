import type {
  AnalysisIssue,
  ComponentState,
  DetectedComponent,
  DetectedComponentType,
} from "@/types/analysis";

export type ButtonVariant = "default" | "outline" | "secondary" | "ghost" | "destructive";
export type ButtonSize = "default" | "sm" | "lg" | "icon";

export interface PreviewMeta {
  componentName: string | null;
  primaryType: DetectedComponentType;
  label: string;
  buttonVariant: ButtonVariant;
  buttonSize: ButtonSize;
  isIconOnly: boolean;
  hasLoadingProp: boolean;
  placeholder: string;
  title: string;
  description: string;
  missingStates: ComponentState[];
  a11yIssues: string[];
  detectedNames: string[];
}

const TYPE_PRIORITY: DetectedComponentType[] = [
  "Dialog",
  "Sheet",
  "Form",
  "Select",
  "DropdownMenu",
  "Tabs",
  "Card",
  "Button",
  "Input",
  "Textarea",
  "Checkbox",
  "Switch",
  "Alert",
  "Popover",
  "Tooltip",
];

export function inferPrimaryType(
  components: DetectedComponent[],
  source: string
): DetectedComponentType {
  if (components.length > 0) {
    for (const type of TYPE_PRIORITY) {
      if (components.some((c) => c.type === type)) return type;
    }
    return components[0].type;
  }

  // Source heuristics when AST detection is thin
  if (/<Dialog[\s>]/.test(source) || /DialogContent/.test(source)) return "Dialog";
  if (/<Sheet[\s>]/.test(source) || /SheetContent/.test(source)) return "Sheet";
  if (/<Select[\s>]/.test(source) || /SelectTrigger/.test(source)) return "Select";
  if (/DropdownMenu/.test(source)) return "DropdownMenu";
  if (/<Card[\s>]/.test(source) || /CardContent/.test(source)) return "Card";
  if (/<Input[\s/>]/.test(source)) return "Input";
  if (/<Textarea[\s/>]/.test(source)) return "Textarea";
  if (/<Button[\s>]/.test(source) || /<button[\s>]/.test(source)) return "Button";
  if (/<form[\s>]/.test(source) || /FormField/.test(source)) return "Form";
  return "Unknown";
}

function extractStringProp(source: string, prop: string): string | null {
  const re = new RegExp(`${prop}\\s*=\\s*["'\`]([^"'\`]+)["'\`]`);
  return re.exec(source)?.[1] ?? null;
}

function extractButtonVariant(source: string): ButtonVariant {
  const v = extractStringProp(source, "variant");
  if (
    v === "outline" ||
    v === "secondary" ||
    v === "ghost" ||
    v === "destructive" ||
    v === "default"
  ) {
    return v;
  }
  if (/variant=outline/.test(source)) return "outline";
  if (/variant=secondary/.test(source)) return "secondary";
  if (/variant=ghost/.test(source)) return "ghost";
  if (/variant=destructive/.test(source)) return "destructive";
  if (/bg-blue-|bg-primary/.test(source)) return "default";
  return "default";
}

function extractButtonSize(source: string, isIconOnly: boolean): ButtonSize {
  const s = extractStringProp(source, "size");
  if (s === "sm" || s === "lg" || s === "icon" || s === "default") return s;
  return isIconOnly ? "icon" : "default";
}

function extractVisibleLabel(source: string): string {
  const aria = extractStringProp(source, "aria-label");
  if (aria) return aria;

  // Text between Button tags (ignore nested JSX)
  const buttonText = /<Button[^>]*>\s*([^<{][^<]*)\s*<\/Button>/.exec(source);
  if (buttonText?.[1]?.trim()) return buttonText[1].trim();

  const cardTitle = /<CardTitle[^>]*>\s*([^<]+)\s*<\/CardTitle>/.exec(source);
  if (cardTitle?.[1]?.trim()) return cardTitle[1].trim();

  const dialogTitle = /<DialogTitle[^>]*>\s*([^<]+)\s*<\/DialogTitle>/.exec(source);
  if (dialogTitle?.[1]?.trim()) return dialogTitle[1].trim();

  if (/Save/.test(source)) return "Save changes";
  if (/Sign in|Login/i.test(source)) return "Sign in";
  if (/Settings/i.test(source)) return "Settings";
  if (/Refresh/i.test(source)) return "Refresh";
  if (/Apply/i.test(source)) return "Apply";
  if (/Open/i.test(source)) return "Open";

  return "Action";
}

function isIconOnlyButton(source: string): boolean {
  if (/size\s*=\s*["']icon["']/.test(source)) return true;
  // Button whose children are only a self-closing icon component
  return /<Button[^>]*>\s*<[A-Z][A-Za-z0-9.]*[^>]*\/>\s*<\/Button>/.test(source);
}

export function buildPreviewMeta(
  source: string,
  componentName: string | null,
  detectedComponents: DetectedComponent[],
  issues: AnalysisIssue[] = []
): PreviewMeta {
  const primaryType = inferPrimaryType(detectedComponents, source);
  const iconOnly = primaryType === "Button" && isIconOnlyButton(source);
  const label = extractVisibleLabel(source);
  const placeholder =
    extractStringProp(source, "placeholder") ||
    (primaryType === "Select" ? "Select an option" : "Enter value…");

  const title =
    /<CardTitle[^>]*>\s*([^<]+)/.exec(source)?.[1]?.trim() ||
    /<DialogTitle[^>]*>\s*([^<]+)/.exec(source)?.[1]?.trim() ||
    componentName?.replace(/([a-z])([A-Z])/g, "$1 $2") ||
    "Component preview";

  const description =
    /<CardDescription[^>]*>\s*([^<]+)/.exec(source)?.[1]?.trim() ||
    /<DialogDescription[^>]*>\s*([^<]+)/.exec(source)?.[1]?.trim() ||
    "Simulated shadcn preview — force states below.";

  return {
    componentName,
    primaryType,
    label,
    buttonVariant: extractButtonVariant(source),
    buttonSize: extractButtonSize(source, iconOnly),
    isIconOnly: iconOnly,
    hasLoadingProp: /isLoading|loading|pending|aria-busy/.test(source),
    placeholder,
    title,
    description,
    missingStates: issues
      .filter((i) => i.category === "missing-state" && i.state)
      .map((i) => i.state as ComponentState),
    a11yIssues: issues
      .filter((i) => i.category === "accessibility")
      .map((i) => i.title),
    detectedNames: detectedComponents.map((c) => c.name),
  };
}
