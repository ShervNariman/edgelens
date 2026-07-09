"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { CODE_EXAMPLES, type CodeExample } from "@/examples";
import { cn } from "@/lib/utils";
import { Loader2, Sparkles } from "lucide-react";

interface CodeInputPanelProps {
  code: string;
  onChange: (value: string) => void;
  onAnalyze: () => void;
  isAnalyzing: boolean;
  selectedExample: CodeExample | null;
  onSelectExample: (example: CodeExample) => void;
}

export function CodeInputPanel({
  code,
  onChange,
  onAnalyze,
  isAnalyzing,
  selectedExample,
  onSelectExample,
}: CodeInputPanelProps) {
  return (
    <div className="flex h-full flex-col gap-3">
      <div>
        <h2 className="text-sm font-medium tracking-wide text-foreground">
          Component source
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Intentionally imperfect AI-style shadcn components — load one, then
          Analyze.
        </p>
      </div>

      <div className="grid gap-1.5 sm:grid-cols-1">
        {CODE_EXAMPLES.map((example) => {
          const active = selectedExample?.id === example.id;
          return (
            <button
              key={example.id}
              type="button"
              onClick={() => onSelectExample(example)}
              className={cn(
                "rounded-lg border px-3 py-2 text-left transition-all duration-200",
                "hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                active
                  ? "border-foreground/25 bg-foreground/[0.06] shadow-sm"
                  : "border-border/80 bg-background/40"
              )}
            >
              <span className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                <Sparkles
                  className={cn(
                    "h-3 w-3 shrink-0",
                    active ? "text-emerald-400" : "text-muted-foreground"
                  )}
                />
                {example.label}
              </span>
              <span className="mt-0.5 block pl-[18px] text-[10px] leading-snug text-muted-foreground">
                {example.description}
              </span>
            </button>
          );
        })}
      </div>

      {selectedExample && (
        <div className="rounded-lg border border-emerald-500/25 bg-emerald-500/8 px-3 py-2 text-xs leading-relaxed">
          <p className="font-medium text-emerald-800 dark:text-emerald-200">
            This example should reveal…
          </p>
          <p className="mt-0.5 text-muted-foreground">{selectedExample.reveals}</p>
          <p className="mt-1.5 font-mono text-[10px] text-emerald-700/80 dark:text-emerald-300/80">
            Click Analyze to generate the report
          </p>
        </div>
      )}

      <div className="flex min-h-0 flex-1 flex-col gap-2">
        <Label htmlFor="component-source" className="sr-only">
          Component source code
        </Label>
        <Textarea
          id="component-source"
          value={code}
          onChange={(e) => onChange(e.target.value)}
          spellCheck={false}
          placeholder={`// Paste a React / shadcn component…\nexport function Example() {\n  return <Button>Click</Button>\n}`}
          className="min-h-[220px] flex-1 resize-y font-mono text-xs leading-relaxed lg:min-h-[min(42vh,380px)]"
        />
      </div>

      <Button
        size="lg"
        className="w-full gap-2"
        onClick={onAnalyze}
        disabled={isAnalyzing || !code.trim()}
      >
        {isAnalyzing ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Analyzing…
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" />
            Analyze
          </>
        )}
      </Button>
    </div>
  );
}
