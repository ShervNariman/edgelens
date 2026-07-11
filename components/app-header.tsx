import Link from "next/link";
import { logoutAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";

export function AppHeader({
  workspaceName,
  ownerEmail,
}: {
  workspaceName: string;
  ownerEmail: string;
}) {
  return (
    <header className="border-b border-[var(--color-line)] bg-[var(--color-paper)]/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <div className="min-w-0">
          <Link
            href="/app"
            className="font-[family-name:var(--font-display)] text-xl tracking-tight text-[var(--color-ink)]"
          >
            Release Room
          </Link>
          <p className="truncate text-sm text-[var(--color-muted)]">
            {workspaceName} · {ownerEmail}
          </p>
        </div>
        <form action={logoutAction}>
          <Button type="submit" variant="secondary" size="sm">
            Sign out
          </Button>
        </form>
      </div>
    </header>
  );
}
