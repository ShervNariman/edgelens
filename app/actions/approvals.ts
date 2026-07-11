"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth/session";
import { getDatabase } from "@/lib/db";

export type ApprovalState = {
  error?: string;
  ok?: boolean;
};

export async function addApprovalAction(
  releaseId: string,
  _prev: ApprovalState,
  formData: FormData,
): Promise<ApprovalState> {
  const session = await requireSession().catch(() => null);
  if (!session) {
    return { error: "You must be signed in." };
  }

  const kindRaw = String(formData.get("kind") ?? "approve");
  const note = String(formData.get("note") ?? "").trim();
  const kind = kindRaw === "exception" ? "exception" : "approve";

  if (!note) {
    return { error: "A note is required for approvals and exceptions." };
  }

  try {
    await getDatabase().addApproval(releaseId, {
      actorEmail: session.email,
      kind,
      note,
    });
  } catch {
    return { error: "Unable to record approval." };
  }

  revalidatePath(`/app/releases/${releaseId}`);
  revalidatePath("/app");
  return { ok: true };
}
