import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "EdgeLens — Record index",
  description: "Capture routes for EdgeLens marketing stills and demo recording.",
  robots: { index: false, follow: false },
};

const ROUTES = [
  {
    href: "/record/release-room?scenario=blocked",
    label: "Release room · BLOCKED",
    blurb: "High-finding login form — primary no-go capture.",
  },
  {
    href: "/record/release-room?scenario=ready",
    label: "Release room · READY",
    blurb: "Complete login form — pre-flight clear capture.",
  },
  {
    href: "/record/release-room?scenario=demo",
    label: "Release room · demo",
    blurb: "Default launch story (happy path → force states).",
  },
  {
    href: "/record/edgelens",
    label: "Legacy /record/edgelens",
    blurb: "SHE-8 continuity route (same AnalyzerApp recording mode).",
  },
] as const;

export default function RecordIndexPage() {
  return (
    <main className="mx-auto max-w-xl px-6 py-16 font-sans">
      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-emerald-600">
        edgelens · capture
      </p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">Record routes</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Quiet surfaces for screenshots and screen recording. No product analytics
        on <code className="font-mono text-xs">/record/*</code>.
      </p>
      <ul className="mt-8 space-y-3">
        {ROUTES.map((route) => (
          <li key={route.href}>
            <Link
              href={route.href}
              className="block rounded-lg border border-border/70 bg-card/30 px-4 py-3 transition-colors hover:bg-card/60"
            >
              <span className="font-medium text-sm">{route.label}</span>
              <span className="mt-1 block text-xs text-muted-foreground">
                {route.blurb}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
