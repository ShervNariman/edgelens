"use client";

import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { DecisionAction } from "@/types/release";

const ACTIONS: {
  id: DecisionAction;
  label: string;
  description: string;
  variant: "default" | "destructive" | "outline";
}[] = [
  {
    id: "approve",
    label: "Approve",
    description: "Mark ready to ship. Use when required evidence is complete.",
    variant: "default",
  },
  {
    id: "block",
    label: "Block",
    description: "Explicitly hold the release with a recorded rationale.",
    variant: "destructive",
  },
  {
    id: "approve_with_exception",
    label: "Approve with exception",
    description:
      "Waive remaining required gaps and ship with a mandatory rationale.",
    variant: "outline",
  },
];

export function DecisionPanel({
  onDecide,
  disabled,
}: {
  onDecide: (action: DecisionAction, rationale: string) => void;
  disabled?: boolean;
}) {
  const [action, setAction] = useState<DecisionAction>("approve_with_exception");
  const [rationale, setRationale] = useState("");
  const [error, setError] = useState<string | null>(null);
  const rationaleId = useId();
  const errorId = useId();

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!rationale.trim()) {
      setError("Rationale is required for every decision.");
      return;
    }
    setError(null);
    onDecide(action, rationale);
    setRationale("");
  }

  return (
    <section
      aria-labelledby="decision-panel-title"
      className="rounded-xl border border-[var(--rr-line)] bg-[var(--rr-surface)] p-4 sm:p-5"
    >
      <h2
        id="decision-panel-title"
        className="font-[family-name:var(--font-display)] text-lg font-semibold tracking-tight"
      >
        Decision
      </h2>
      <p className="mt-1 text-sm text-[var(--rr-muted)]">
        Approve, block, or waive missing evidence. Every action appends an
        immutable audit event.
      </p>

      <form onSubmit={submit} className="mt-4 space-y-4">
        <fieldset className="space-y-2" disabled={disabled}>
          <legend className="sr-only">Decision action</legend>
          {ACTIONS.map((item) => (
            <label
              key={item.id}
              className="flex cursor-pointer gap-3 rounded-lg border border-[var(--rr-line)] p-3 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-[var(--rr-focus)] has-[:checked]:border-[var(--rr-ink)] has-[:checked]:bg-black/[0.03]"
            >
              <input
                type="radio"
                name="decision-action"
                value={item.id}
                checked={action === item.id}
                onChange={() => setAction(item.id)}
                className="mt-1 size-4 accent-[var(--rr-ink)]"
              />
              <span>
                <span className="block text-sm font-semibold text-[var(--rr-ink)]">
                  {item.label}
                </span>
                <span className="mt-0.5 block text-xs text-[var(--rr-muted)]">
                  {item.description}
                </span>
              </span>
            </label>
          ))}
        </fieldset>

        <div className="space-y-2">
          <Label htmlFor={rationaleId}>Rationale</Label>
          <Textarea
            id={rationaleId}
            value={rationale}
            onChange={(e) => setRationale(e.target.value)}
            placeholder="Why are you approving, blocking, or waiving?"
            rows={3}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? errorId : undefined}
            className="min-h-20 resize-y bg-white"
            disabled={disabled}
            required
          />
          {error ? (
            <p id={errorId} className="text-sm text-[var(--rr-blocked)]" role="alert">
              {error}
            </p>
          ) : null}
        </div>

        <Button
          type="submit"
          disabled={disabled}
          variant={
            action === "block"
              ? "destructive"
              : action === "approve"
                ? "default"
                : "outline"
          }
          className="w-full sm:w-auto"
        >
          Record decision
        </Button>
      </form>
    </section>
  );
}
