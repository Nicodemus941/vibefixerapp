"use server";

import { revalidatePath } from "next/cache";
import {
  getEntry,
  patchEntry,
  toggleBlock,
  TECH_OPTIONS,
  type ClaimStatus,
  type Status,
  type Tech,
} from "../lib/store";
import { notifyLead, type Lead } from "../lib/notifications";

const VALID_STATUSES: Status[] = [
  "new",
  "contacted",
  "booked",
  "completed",
  "no-show",
];

const VALID_CLAIM_STATUSES: ClaimStatus[] = ["filed", "approved", "paid"];

function revalidateAll() {
  revalidatePath("/admin");
  revalidatePath("/admin/inbox");
  revalidatePath("/admin/calendar");
}

export async function setStatus(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim() as Status;
  if (!id || !VALID_STATUSES.includes(status)) return;
  await patchEntry(id, { status });
  revalidateAll();
}

export async function setNotes(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();
  if (!id) return;
  await patchEntry(id, { notes: notes || undefined });
  revalidateAll();
}

export async function setAssignedTo(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "").trim();
  const tech = String(formData.get("tech") ?? "").trim() as Tech;
  if (!id || !TECH_OPTIONS.includes(tech)) return;
  await patchEntry(id, { assignedTo: tech });
  revalidateAll();
}

function parseMoney(input: string): number | undefined {
  const cleaned = input.replace(/[^\d.]/g, "");
  if (!cleaned) return undefined;
  const n = Number(cleaned);
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : undefined;
}

export async function setPrice(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return;
  const priceQuoted = parseMoney(String(formData.get("priceQuoted") ?? ""));
  const pricePaid = parseMoney(String(formData.get("pricePaid") ?? ""));
  await patchEntry(id, { priceQuoted, pricePaid });
  revalidateAll();
}

export async function setClaim(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return;
  const claimNumber = String(formData.get("claimNumber") ?? "").trim();
  const rawStatus = String(formData.get("claimStatus") ?? "").trim() as ClaimStatus;
  const claimStatus = VALID_CLAIM_STATUSES.includes(rawStatus) ? rawStatus : undefined;
  await patchEntry(id, {
    claimNumber: claimNumber || undefined,
    claimStatus,
  });
  revalidateAll();
}

export async function addPhoto(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "").trim();
  const url = String(formData.get("photoUrl") ?? "").trim();
  if (!id || !url) return;
  // Light validation: must look like a URL
  try {
    new URL(url);
  } catch {
    return;
  }
  const entry = await getEntry(id);
  if (!entry) return;
  const photos = [...(entry.photos ?? []), url].slice(-12); // cap at 12
  await patchEntry(id, { photos });
  revalidateAll();
}

export async function removePhoto(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "").trim();
  const url = String(formData.get("url") ?? "").trim();
  if (!id || !url) return;
  const entry = await getEntry(id);
  if (!entry?.photos) return;
  await patchEntry(id, { photos: entry.photos.filter((p) => p !== url) });
  revalidateAll();
}

export async function toggleBlockedDay(formData: FormData): Promise<void> {
  const date = String(formData.get("date") ?? "").trim();
  const slotId = String(formData.get("slotId") ?? "").trim() || undefined;
  if (!date) return;
  await toggleBlock(date, slotId);
  revalidateAll();
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
