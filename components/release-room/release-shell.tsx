"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { DEMO_WORKSPACE } from "@/lib/release-demo/seed";

export function ReleaseShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const onDashboard = pathname === "/" || pathname === "/releases";

  return (
    <div className="rr-shell min-h-screen text-[var(--rr-ink)]">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-white focus:px-3 focus:py-2 focus:shadow"
      >
        Skip to content
      </a>
      <header className="rr-header border-b border-[var(--rr-line)]">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link
            href="/"
            className="group flex min-w-0 items-baseline gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--rr-focus)] focus-visible:ring-offset-2"
          >
            <span className="font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight text-[var(--rr-ink)] sm:text-3xl">
              Release Room
            </span>
            <span className="hidden truncate text-sm text-[var(--rr-muted)] sm:inline">
              {DEMO_WORKSPACE}
            </span>
          </Link>
          <nav aria-label="Primary" className="flex items-center gap-1">
            <Link
              href="/"
              className={cn(
                "rounded-md px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--rr-focus)]",
                onDashboard
                  ? "bg-[var(--rr-ink)] text-[var(--rr-paper)]"
                  : "text-[var(--rr-muted)] hover:bg-black/5 hover:text-[var(--rr-ink)]",
              )}
              aria-current={onDashboard ? "page" : undefined}
            >
              Candidates
            </Link>
          </nav>
        </div>
      </header>
      <main id="main" className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        {children}
      </main>
    </div>
  );
}
