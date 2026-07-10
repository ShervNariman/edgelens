"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight, ScanSearch } from "lucide-react";
import { cn } from "@/lib/utils";
import { HERO_SUPPORT, HERO_TAGLINE } from "@/lib/product-copy";

interface HeroProps {
  onTryDemo: () => void;
  /** Compact hero for demo-ready analyzer pages */
  compact?: boolean;
}

export function Hero({ onTryDemo, compact = false }: HeroProps) {
  return (
    <section className="relative overflow-hidden border-b border-border/60">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_oklch(0.35_0.08_160_/_0.25),_transparent_55%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.035] [background-image:linear-gradient(to_right,currentColor_1px,transparent_1px),linear-gradient(to_bottom,currentColor_1px,transparent_1px)] [background-size:48px_48px]"
      />

      <div
        className={cn(
          "relative mx-auto flex max-w-7xl flex-col px-4 sm:px-6",
          compact ? "gap-4 py-8 sm:py-10" : "gap-8 py-16 sm:py-20 lg:py-24"
        )}
      >
        <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
          <ScanSearch className="h-3.5 w-3.5 text-emerald-400" />
          <span>edgelens.preflight()</span>
          <span className="text-emerald-400/80">|</span>
        </div>

        <div className={cn("max-w-3xl", compact ? "space-y-2" : "space-y-5")}>
          <h1
            className={cn(
              "font-heading font-semibold tracking-tight text-foreground",
              compact
                ? "text-3xl sm:text-4xl"
                : "text-4xl sm:text-5xl lg:text-6xl"
            )}
          >
            EdgeLens
          </h1>
          <p
            className={cn(
              "max-w-2xl text-muted-foreground",
              compact ? "text-sm sm:text-base" : "text-lg sm:text-xl"
            )}
          >
            {HERO_TAGLINE}
          </p>
          {!compact && (
            <p className="max-w-2xl text-sm text-muted-foreground/90">
              {HERO_SUPPORT}
            </p>
          )}
          {!compact && (
            <p className="font-mono text-sm text-muted-foreground/80">
              pre-flight · state completeness · client-side · no LLM
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            size={compact ? "default" : "lg"}
            onClick={onTryDemo}
            className="gap-2"
          >
            Try Demo
            <ArrowRight className="h-4 w-4" />
          </Button>
          <a
            href="#analyzer"
            className={cn(
              "inline-flex items-center justify-center rounded-lg border border-border bg-background px-2.5 text-sm font-medium transition-colors hover:bg-muted hover:text-foreground",
              compact ? "h-8" : "h-9"
            )}
          >
            Paste your component
          </a>
        </div>

        {!compact && (
          <dl className="grid max-w-2xl grid-cols-1 gap-4 pt-2 sm:grid-cols-3">
            {[
              { label: "hero check", value: "state completeness" },
              { label: "runtime", value: "client-side" },
              { label: "llm", value: "none (mvp)" },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-lg border border-border/70 bg-card/40 px-4 py-3 font-mono text-xs"
              >
                <dt className="text-muted-foreground">{item.label}</dt>
                <dd className="mt-1 text-foreground">{item.value}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </section>
  );
}
