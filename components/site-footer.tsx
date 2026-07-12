import { Code2, ExternalLink } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="space-y-1">
          <p className="font-mono text-sm text-foreground">EdgeLens</p>
          <p className="text-xs text-muted-foreground">
            Built by{" "}
            <a
              href="https://nariman.dev"
              className="underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              target="_blank"
              rel="noreferrer"
              aria-label="Sherv Nariman on nariman.dev (opens in new tab)"
            >
              Sherv Nariman
            </a>
            {" · "}
            pre-flight for React/shadcn UI states
          </p>
        </div>

        <nav
          aria-label="External links"
          className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground"
        >
          <a
            href="https://github.com/ShervNariman/edgelens"
            className="inline-flex items-center gap-1.5 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            target="_blank"
            rel="noreferrer"
            aria-label="EdgeLens on GitHub (opens in new tab)"
          >
            <Code2 className="h-3.5 w-3.5" aria-hidden />
            GitHub
          </a>
          <a
            href="https://x.com/ShervNariman"
            className="inline-flex items-center gap-1.5 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            target="_blank"
            rel="noreferrer"
            aria-label="@ShervNariman on X (opens in new tab)"
          >
            <ExternalLink className="h-3.5 w-3.5" aria-hidden />
            @ShervNariman
          </a>
          <a
            href="https://nariman.dev"
            className="hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            target="_blank"
            rel="noreferrer"
            aria-label="nariman.dev (opens in new tab)"
          >
            nariman.dev
          </a>
        </nav>
      </div>
    </footer>
  );
}
