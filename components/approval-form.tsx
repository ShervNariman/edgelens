"use client";

import { useActionState } from "react";
import { addApprovalAction, type ApprovalState } from "@/app/actions/approvals";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

const initial: ApprovalState = {};

export function ApprovalForm({ releaseId }: { releaseId: string }) {
  const action = addApprovalAction.bind(null, releaseId);
  const [state, formAction, pending] = useActionState(action, initial);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <Textarea
        name="note"
        label="Approval or exception note"
        placeholder="Why this release can ship, or why an exception is justified."
        required
      />
      <div className="flex flex-wrap gap-3">
        <Button type="submit" name="kind" value="approve" disabled={pending}>
          Record approval
        </Button>
        <Button
          type="submit"
          name="kind"
          value="exception"
          variant="secondary"
          disabled={pending}
        >
          Record exception
        </Button>
      </div>
      {state.error ? (
        <p className="text-sm text-[var(--color-danger)]" role="alert">
          {state.error}
        </p>
      ) : null}
      {state.ok ? (
        <p className="text-sm text-[var(--color-ready)]" role="status">
          Saved to the audit trail.
        </p>
      ) : null}
    </form>
  );
}
