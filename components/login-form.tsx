"use client";

import { useActionState } from "react";
import { loginAction, type LoginState } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const initial: LoginState = {};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, initial);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <Input
        name="email"
        type="email"
        autoComplete="username"
        label="Owner email"
        defaultValue="owner@release-room.local"
        required
      />
      <Input
        name="password"
        type="password"
        autoComplete="current-password"
        label="Password"
        hint="Local default is in .env.example"
        required
      />
      {state.error ? (
        <p className="text-sm text-[var(--color-danger)]" role="alert">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" disabled={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
