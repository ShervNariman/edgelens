import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth/session";

export default async function HomePage() {
  const session = await getSession();
  if (session) {
    redirect("/app");
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col justify-center px-4 py-16 sm:px-6">
      <section className="max-w-2xl">
        <p className="mb-4 text-sm font-semibold tracking-[0.18em] text-[var(--color-accent)] uppercase">
          Private MVP
        </p>
        <h1 className="font-[family-name:var(--font-display)] text-5xl leading-tight tracking-tight text-[var(--color-ink)] sm:text-6xl">
          Release Room
        </h1>
        <p className="mt-5 max-w-xl text-lg text-[var(--color-muted)]">
          Connect product intent, engineering checks, preview evidence, and human approval
          into one deterministic READY / BLOCKED release decision.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/login"
            className="inline-flex h-12 items-center justify-center rounded-md bg-[var(--color-ink)] px-5 text-base font-medium text-[var(--color-paper)] transition-colors hover:bg-[var(--color-ink-soft)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]"
          >
            Owner sign in
          </Link>
          <Link
            href="/login"
            className="inline-flex h-12 items-center justify-center rounded-md border border-[var(--color-line)] bg-[var(--color-paper)] px-5 text-base font-medium text-[var(--color-ink)] transition-colors hover:bg-[var(--color-wash)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]"
          >
            Open demo workspace
          </Link>
        </div>
      </section>
    </main>
  );
}
