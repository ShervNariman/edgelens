"use client";

import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useFeedback } from "@/components/release-room/feedback-toast";
import {
  EVIDENCE_GROUP_LABELS,
  EVIDENCE_GROUP_ORDER,
  type EvidenceGroup,
  type ManualEvidenceInput,
} from "@/types/release";

const initial: ManualEvidenceInput = {
  group: "experience",
  title: "",
  summary: "",
  status: "pass",
  owner: "",
  sourceLabel: "Manual capture",
  sourceUrl: "",
  required: false,
};

export function ManualEvidenceForm({
  onCapture,
}: {
  onCapture: (input: ManualEvidenceInput) => void;
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<ManualEvidenceInput>(initial);
  const [error, setError] = useState<string | null>(null);
  const titleId = useId();
  const formId = useId();
  const feedback = useFeedback();

  function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!form.title.trim() || !form.summary.trim()) {
      setError("Title and summary are required.");
      feedback.push({
        tone: "error",
        title: "Evidence not saved",
        detail: "Title and summary are required.",
      });
      return;
    }
    setError(null);
    try {
      onCapture(form);
      feedback.push({
        tone: "success",
        title: "Evidence captured",
        detail: `${form.title.trim()} added to the audit trail.`,
      });
      setForm(initial);
      setOpen(false);
    } catch {
      feedback.push({
        tone: "error",
        title: "Could not save evidence",
        detail: "Try again. Nothing was written.",
      });
    }
  }

  return (
    <section
      aria-labelledby="manual-evidence-title"
      className="rounded-xl border border-dashed border-[var(--rr-line)] bg-[var(--rr-surface)]/70 p-4 sm:p-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2
            id="manual-evidence-title"
            className="font-[family-name:var(--font-display)] text-lg font-semibold tracking-tight"
          >
            Manual evidence capture
          </h2>
          <p className="mt-1 text-sm text-[var(--rr-muted)]">
            Attach a note, link, or local check when an adapter has not filled
            the gap yet.
          </p>
        </div>
        <Button
          type="button"
          variant={open ? "secondary" : "outline"}
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls={formId}
        >
          {open ? "Close" : "Add evidence"}
        </Button>
      </div>

      {open ? (
        <form
          id={formId}
          onSubmit={submit}
          className="mt-4 grid gap-3 sm:grid-cols-2"
        >
          <div className="space-y-1.5">
            <Label htmlFor={`${titleId}-group`}>Group</Label>
            <select
              id={`${titleId}-group`}
              className="flex h-9 w-full rounded-lg border border-[var(--rr-line)] bg-[var(--rr-surface)] px-3 text-sm outline-none"
              value={form.group}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  group: e.target.value as EvidenceGroup,
                }))
              }
            >
              {EVIDENCE_GROUP_ORDER.map((group) => (
                <option key={group} value={group}>
                  {EVIDENCE_GROUP_LABELS[group]}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`${titleId}-status`}>Status</Label>
            <select
              id={`${titleId}-status`}
              className="flex h-9 w-full rounded-lg border border-[var(--rr-line)] bg-[var(--rr-surface)] px-3 text-sm outline-none"
              value={form.status}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  status: e.target.value as ManualEvidenceInput["status"],
                }))
              }
            >
              <option value="pass">Pass</option>
              <option value="fail">Fail</option>
              <option value="pending">Pending</option>
            </select>
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor={`${titleId}-title`}>Title</Label>
            <input
              id={`${titleId}-title`}
              className="flex h-9 w-full rounded-lg border border-[var(--rr-line)] bg-[var(--rr-surface)] px-3 text-sm outline-none"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="e.g. Keyboard pass on checkout preview"
              required
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor={`${titleId}-summary`}>Summary</Label>
            <Textarea
              id={`${titleId}-summary`}
              className="min-h-20 bg-[var(--rr-surface)]"
              value={form.summary}
              onChange={(e) =>
                setForm((f) => ({ ...f, summary: e.target.value }))
              }
              placeholder="What was checked, and what was the result?"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`${titleId}-owner`}>Owner</Label>
            <input
              id={`${titleId}-owner`}
              className="flex h-9 w-full rounded-lg border border-[var(--rr-line)] bg-[var(--rr-surface)] px-3 text-sm outline-none"
              value={form.owner}
              onChange={(e) => setForm((f) => ({ ...f, owner: e.target.value }))}
              placeholder="Your name"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`${titleId}-source`}>Source label</Label>
            <input
              id={`${titleId}-source`}
              className="flex h-9 w-full rounded-lg border border-[var(--rr-line)] bg-[var(--rr-surface)] px-3 text-sm outline-none"
              value={form.sourceLabel}
              onChange={(e) =>
                setForm((f) => ({ ...f, sourceLabel: e.target.value }))
              }
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor={`${titleId}-url`}>Source URL (optional)</Label>
            <input
              id={`${titleId}-url`}
              type="url"
              className="flex h-9 w-full rounded-lg border border-[var(--rr-line)] bg-[var(--rr-surface)] px-3 text-sm outline-none"
              value={form.sourceUrl ?? ""}
              onChange={(e) =>
                setForm((f) => ({ ...f, sourceUrl: e.target.value }))
              }
              placeholder="https://"
            />
          </div>
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input
              type="checkbox"
              className="size-4 accent-[var(--rr-ink)]"
              checked={Boolean(form.required)}
              onChange={(e) =>
                setForm((f) => ({ ...f, required: e.target.checked }))
              }
            />
            Required for go / no-go
          </label>
          {error ? (
            <p className="text-sm text-[var(--rr-blocked)] sm:col-span-2" role="alert">
              {error}
            </p>
          ) : null}
          <div className="sm:col-span-2">
            <Button type="submit">Save evidence</Button>
          </div>
        </form>
      ) : null}
    </section>
  );
}
