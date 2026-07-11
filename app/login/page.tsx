import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { LoginForm } from "@/components/login-form";

export default async function LoginPage() {
  const session = await getSession();
  if (session) {
    redirect("/app");
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-4 py-16">
      <div className="rounded-2xl border border-[var(--color-line)] bg-[var(--color-paper)]/95 p-8 shadow-[0_20px_60px_rgba(20,32,27,0.08)]">
        <h1 className="font-[family-name:var(--font-display)] text-3xl tracking-tight">
          Owner sign in
        </h1>
        <p className="mt-2 text-sm text-[var(--color-muted)]">
          Single private-owner boundary for the Release Room MVP.
        </p>
        <div className="mt-6">
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
