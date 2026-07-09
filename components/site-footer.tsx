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
              className="underline-offset-4 hover:text-foreground hover:underline"
              target="_blank"
              rel="noreferrer"
            >
              Sherv Nariman
            </a>
          </p>
        </div>

        <nav className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
          <a
            href="https://github.com/placeholder/edgelens"
            className="inline-flex items-center gap-1.5 hover:text-foreground"
            target="_blank"
            rel="noreferrer"
          >
            <Code2 className="h-3.5 w-3.5" />
            GitHub
          </a>
          <a
            href="https://x.com/ShervNariman"
            className="inline-flex items-center gap-1.5 hover:text-foreground"
            target="_blank"
            rel="noreferrer"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            @ShervNariman
          </a>
          <a
            href="https://nariman.dev"
            className="hover:text-foreground"
            target="_blank"
            rel="noreferrer"
          >
            nariman.dev
          </a>
        </nav>
      </div>
    </footer>
  );
}
