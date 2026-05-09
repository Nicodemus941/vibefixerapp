"use server";

import { revalidatePath } from "next/cache";
import { getEntry, patchEntry, type Status } from "../lib/store";
import { notifyLead, type Lead } from "../lib/notifications";

const VALID_STATUSES: Status[] = [
  "new",
  "contacted",
  "booked",
  "completed",
  "no-show",
];

export async function setStatus(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim() as Status;
  if (!id || !VALID_STATUSES.includes(status)) return;
  await patchEntry(id, { status });
  revalidatePath("/admin");
  revalidatePath("/admin/inbox");
}

export async function setNotes(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();
  if (!id) return;
  await patchEntry(id, { notes: notes || undefined });
  revalidatePath("/admin");
  revalidatePath("/admin/inbox");
}

// Mark complete + immediately fire the post-job review-ask SMS via the
// existing notify path. Eric taps once, customer gets the review request
// in their pocket.
export async function completeAndAskForReview(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return;
  const entry = await getEntry(id);
  if (!entry) return;

  await patchEntry(id, { status: "completed", reviewAskSent: true });

  // Send a "we'd love a review" SMS using the same Twilio path as the
  // automatic post-job text. Reuse notifyLead to keep the code path single.
  const lead: Lead = {
    name: entry.name,
    phone: entry.phone,
    vehicle: entry.vehicle ?? "",
    service: entry.service ?? "not-sure",
    receivedAt: new Date().toISOString(),
    referredBy: entry.referredBy,
    ownReferralCode: entry.ownReferralCode,
    damage: "Manual review-ask trigger from /admin",
  };
  try {
    await notifyLead(lead);
  } catch (err) {
    console.error("[admin] review-ask send failed:", err);
  }

  revalidatePath("/admin");
  revalidatePath("/admin/inbox");
}
