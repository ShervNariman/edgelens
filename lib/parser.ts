import { parse } from "@babel/parser";
import type { File, Node } from "@babel/types";
import type {
  CodeLocation,
  DetectedComponent,
  DetectedComponentType,
} from "@/types/analysis";

export interface ParseResult {
  ast: File | null;
  errors: string[];
}

const SHADCN_MAP: Record<string, DetectedComponentType> = {
  Button: "Button",
  Dialog: "Dialog",
  DialogContent: "Dialog",
  DialogTrigger: "Dialog",
  DialogHeader: "Dialog",
  DialogTitle: "Dialog",
  DialogDescription: "Dialog",
  DialogFooter: "Dialog",
  Select: "Select",
  SelectTrigger: "Select",
  SelectContent: "Select",
  SelectItem: "Select",
  SelectValue: "Select",
  Input: "Input",
  Textarea: "Textarea",
  Checkbox: "Checkbox",
  Switch: "Switch",
  Tabs: "Tabs",
  TabsList: "Tabs",
  TabsTrigger: "Tabs",
  TabsContent: "Tabs",
  Card: "Card",
  CardHeader: "Card",
  CardTitle: "Card",
  CardDescription: "Card",
  CardContent: "Card",
  CardFooter: "Card",
  Form: "Form",
  FormField: "Form",
  FormItem: "Form",
  FormLabel: "Form",
  FormControl: "Form",
  FormMessage: "Form",
  Alert: "Alert",
  AlertTitle: "Alert",
  AlertDescription: "Alert",
  DropdownMenu: "DropdownMenu",
  DropdownMenuTrigger: "DropdownMenu",
  DropdownMenuContent: "DropdownMenu",
  DropdownMenuItem: "DropdownMenu",
  Popover: "Popover",
  PopoverTrigger: "Popover",
  PopoverContent: "Popover",
  Tooltip: "Tooltip",
  TooltipTrigger: "Tooltip",
  TooltipContent: "Tooltip",
};

function locFromNode(node: Node): CodeLocation | undefined {
  if (!node.loc) return undefined;
  return {
    line: node.loc.start.line,
    column: node.loc.start.column,
    endLine: node.loc.end.line,
    endColumn: node.loc.end.column,
  };
}

function getJsxName(node: Node): string | null {
  if (node.type !== "JSXOpeningElement" && node.type !== "JSXElement") {
    return null;
  }
  const opening = node.type === "JSXElement" ? node.openingElement : node;
  const name = opening.name;
  if (name.type === "JSXIdentifier") return name.name;
  if (name.type === "JSXMemberExpression") {
    const prop = name.property;
    if (prop.type === "JSXIdentifier") return prop.name;
  }
  return null;
}

function walk(node: Node, visit: (n: Node) => void) {
  visit(node);
  for (const key of Object.keys(node)) {
    if (key === "loc" || key === "start" || key === "end" || key === "leadingComments" || key === "trailingComments" || key === "innerComments") {
      continue;
    }
    const value = (node as unknown as Record<string, unknown>)[key];
    if (Array.isArray(value)) {
      for (const child of value) {
        if (child && typeof child === "object" && "type" in child) {
          walk(child as Node, visit);
        }
      }
    } else if (value && typeof value === "object" && "type" in value) {
      walk(value as Node, visit);
    }
  }
}

export function parseSource(source: string): ParseResult {
  try {
    const wrapped = wrapIfNeeded(source);
    const ast = parse(wrapped, {
      sourceType: "module",
      plugins: ["jsx", "typescript"],
      errorRecovery: true,
    });
    const errors =
      // @babel/parser attaches errors when errorRecovery is true
      ((ast as File & { errors?: Array<{ message: string }> }).errors ?? []).map(
        (e) => e.message
      );
    return { ast, errors };
  } catch (err) {
    return {
      ast: null,
      errors: [err instanceof Error ? err.message : "Failed to parse source"],
    };
  }
}

function wrapIfNeeded(source: string): string {
  const trimmed = source.trim();
  if (
    trimmed.startsWith("export ") ||
    trimmed.startsWith("function ") ||
    trimmed.startsWith("const ") ||
    trimmed.startsWith("import ") ||
    trimmed.startsWith("class ") ||
    trimmed.startsWith("(") ||
    trimmed.startsWith("<>") ||
    trimmed.startsWith("<")
  ) {
    // Fragment / bare JSX — wrap in a component for parsing
    if (trimmed.startsWith("<") || trimmed.startsWith("<>")) {
      return `function Preview() {\n  return (\n${trimmed}\n  );\n}`;
    }
    return trimmed;
  }
  return `function Preview() {\n  return (\n${trimmed}\n  );\n}`;
}

export function extractComponentName(ast: File | null, source: string): string | null {
  if (ast) {
    let found: string | null = null;
    walk(ast, (node) => {
      if (found) return;
      if (node.type === "FunctionDeclaration" && node.id?.name) {
        found = node.id.name;
      }
      if (
        node.type === "VariableDeclarator" &&
        node.id.type === "Identifier" &&
        (node.init?.type === "ArrowFunctionExpression" ||
          node.init?.type === "FunctionExpression")
      ) {
        found = node.id.name;
      }
    });
    if (found) return found;
  }

  const fnMatch = source.match(
    /(?:export\s+(?:default\s+)?)?(?:function|const)\s+([A-Z][A-Za-z0-9]*)/
  );
  return fnMatch?.[1] ?? null;
}

export function detectComponents(
  ast: File | null,
  source: string
): DetectedComponent[] {
  const found = new Map<string, DetectedComponent>();

  if (ast) {
    walk(ast, (node) => {
      if (node.type !== "JSXOpeningElement") return;
      const name = getJsxName(node);
      if (!name) return;
      const type = SHADCN_MAP[name];
      if (!type) return;

      const props = node.attributes
        .map((attr) => {
          if (attr.type !== "JSXAttribute" || attr.name.type !== "JSXIdentifier") {
            return null;
          }
          const propName = attr.name.name;
          if (!attr.value) return propName;
          if (attr.value.type === "StringLiteral") {
            return `${propName}=${attr.value.value}`;
          }
          if (
            attr.value.type === "JSXExpressionContainer" &&
            attr.value.expression.type === "StringLiteral"
          ) {
            return `${propName}=${attr.value.expression.value}`;
          }
          return propName;
        })
        .filter((p): p is string => Boolean(p));

      const key = `${type}:${name}`;
      const existing = found.get(key);
      if (existing) {
        existing.props = Array.from(new Set([...existing.props, ...props]));
        return;
      }

      found.set(key, {
        name,
        type,
        props,
        hasChildren: !node.selfClosing,
        location: locFromNode(node),
      });
    });
  }

  // Regex fallback when AST fails or misses imports-only usage
  if (found.size === 0) {
    for (const [tag, type] of Object.entries(SHADCN_MAP)) {
      const re = new RegExp(`<${tag}[\\s/>]`);
      if (re.test(source)) {
        found.set(`${type}:${tag}`, {
          name: tag,
          type,
          props: [],
          hasChildren: true,
        });
      }
    }
  }

  return Array.from(found.values());
}

export { SHADCN_MAP };
