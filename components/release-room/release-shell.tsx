"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useState } from "react";
import {
  LayoutList,
  Menu,
  Settings2,
  X,
  CircleDot,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DEMO_WORKSPACE } from "@/lib/release-demo/seed";
import { setupProgress } from "@/lib/release-demo/integrations";
import { FeedbackProvider } from "@/components/release-room/feedback-toast";

const NAV = [
  { href: "/", label: "Candidates", icon: LayoutList, match: "candidates" as const },
  { href: "/setup", label: "Setup", icon: Settings2, match: "setup" as const },
];

function useActiveNav(pathname: string) {
  if (pathname.startsWith("/setup")) return "setup";
  if (pathname.startsWith("/releases") || pathname === "/") return "candidates";
  return null;
}

function NavLinks({
  active,
  onNavigate,
  compact = false,
}: {
  active: ReturnType<typeof useActiveNav>;
  onNavigate?: () => void;
  compact?: boolean;
}) {
  return (
    <ul className={cn("space-y-1", compact && "space-y-0.5")}>
      {NAV.map((item) => {
        const Icon = item.icon;
        const isActive = active === item.match;
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-[var(--rr-ink)] text-[var(--rr-paper)]"
                  : "text-[var(--rr-muted)] hover:bg-black/[0.04] hover:text-[var(--rr-ink)]",
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon className="size-4 shrink-0" aria-hidden />
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function ReleaseShell({
  children,
  recording = false,
}: {
  children: React.ReactNode;
  recording?: boolean;
}) {
  const pathname = usePathname();
  const active = useActiveNav(pathname);
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuId = useId();
  const progress = setupProgress();

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileOpen]);

  return (
    <FeedbackProvider>
      <div
        className={cn(
          "rr-shell min-h-screen text-[var(--rr-ink)]",
          recording && "rr-recording",
        )}
      >
        <a
          href="#main"
          className="rr-skip sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-white focus:px-3 focus:py-2 focus:shadow"
        >
          Skip to content
        </a>

        {/* Desktop sidebar */}
        <aside
          className="rr-sidebar fixed inset-y-0 left-0 z-30 hidden w-[var(--rr-sidebar-width)] flex-col lg:flex"
          aria-label="Workspace"
        >
          <div className="flex h-[var(--rr-topbar-height)] items-center border-b border-[var(--rr-line)] px-5">
            <Link
              href="/"
              className="group min-w-0 focus-visible:outline-none"
            >
              <span className="font-[family-name:var(--font-display)] text-xl font-semibold tracking-tight">
                Release Room
              </span>
              <span className="mt-0.5 block truncate text-xs text-[var(--rr-muted)]">
                {DEMO_WORKSPACE}
              </span>
            </Link>
          </div>
          <nav aria-label="Primary" className="flex-1 px-3 py-4">
            <NavLinks active={active} />
          </nav>
          <div className="border-t border-[var(--rr-line)] px-4 py-4">
            <p className="text-[11px] font-semibold tracking-[0.14em] text-[var(--rr-muted-soft)] uppercase">
              First-run setup
            </p>
            <p className="mt-1 text-sm text-[var(--rr-ink)]">
              {progress.done}/{progress.total} complete
            </p>
            <div
              className="mt-2 h-1.5 overflow-hidden rounded-full bg-black/[0.06]"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={progress.total}
              aria-valuenow={progress.done}
              aria-label="Setup progress"
            >
              <div
                className="h-full rounded-full bg-[var(--rr-ink)] transition-[width]"
                style={{
                  width: `${(progress.done / progress.total) * 100}%`,
                }}
              />
            </div>
            {!progress.complete ? (
              <Link
                href="/setup"
                className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-[var(--rr-focus)] hover:underline"
              >
                <CircleDot className="size-3.5" aria-hidden />
                Finish setup
              </Link>
            ) : null}
          </div>
        </aside>

        {/* Mobile topbar */}
        <header className="rr-header rr-mobile-nav sticky top-0 z-40 border-b border-[var(--rr-line)] lg:hidden">
          <div className="flex h-[var(--rr-topbar-height)] items-center justify-between gap-3 px-4">
            <Link href="/" className="min-w-0">
              <span className="font-[family-name:var(--font-display)] text-lg font-semibold tracking-tight">
                Release Room
              </span>
            </Link>
            <button
              type="button"
              className="inline-flex size-9 items-center justify-center rounded-lg border border-[var(--rr-line)] bg-[var(--rr-surface)] text-[var(--rr-ink)]"
              aria-expanded={mobileOpen}
              aria-controls={menuId}
              onClick={() => setMobileOpen((v) => !v)}
            >
              {mobileOpen ? (
                <X className="size-4" aria-hidden />
              ) : (
                <Menu className="size-4" aria-hidden />
              )}
              <span className="sr-only">
                {mobileOpen ? "Close menu" : "Open menu"}
              </span>
            </button>
          </div>
          {mobileOpen ? (
            <div
              id={menuId}
              className="border-t border-[var(--rr-line)] bg-[var(--rr-surface)] px-3 py-3 shadow-sm"
            >
              <nav aria-label="Primary">
                <NavLinks
                  active={active}
                  onNavigate={() => setMobileOpen(false)}
                  compact
                />
              </nav>
              <p className="mt-3 px-3 text-xs text-[var(--rr-muted)]">
                {DEMO_WORKSPACE} · setup {progress.done}/{progress.total}
              </p>
            </div>
          ) : null}
        </header>

        <div className="rr-main-frame lg:ml-[var(--rr-sidebar-width)]">
          <div className="rr-header sticky top-0 z-20 hidden h-[var(--rr-topbar-height)] items-center justify-between border-b border-[var(--rr-line)] px-6 lg:flex">
            <p className="text-sm text-[var(--rr-muted)]">
              Evidence-backed go / no-go
            </p>
            <p className="font-mono text-xs text-[var(--rr-muted-soft)]">
              Light experience · dark tokens ready
            </p>
          </div>
          <main id="main" className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
            {children}
          </main>
        </div>
      </div>
    </FeedbackProvider>
  );
}
