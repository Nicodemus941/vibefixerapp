"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { notifyBooking } from "../lib/notifications";
import { describeSlot, findSlot, generateDays } from "../lib/slots";

export type BookingState = {
  ok: boolean;
  errors?: Partial<
    Record<"slot" | "name" | "phone" | "vehicle" | "service" | "form", string>
  >;
};

function isValidPhone(p: string) {
  const digits = p.replace(/\D/g, "");
  return digits.length >= 10 && digits.length <= 15;
}

const VALID_SERVICES = new Set([
  "chip-repair",
  "windshield-replace",
  "side-back",
  "not-sure",
]);

function dayLabel(d: ReturnType<typeof describeSlot>): string {
  if (d.isToday) return `Today · ${d.weekdayLong}, ${d.monthDayLabel}`;
  if (d.isTomorrow) return `Tomorrow · ${d.weekdayLong}, ${d.monthDayLabel}`;
  return `${d.weekdayLong}, ${d.monthDayLabel}`;
}

export async function submitBooking(
  _prev: BookingState,
  formData: FormData,
): Promise<BookingState> {
  const slotId = String(formData.get("slot") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const vehicle = String(formData.get("vehicle") ?? "").trim();
  const service = String(formData.get("service") ?? "").trim();
  const damage = String(formData.get("damage") ?? "").trim();
  const insurance = String(formData.get("insurance") ?? "").trim();
  const zip = String(formData.get("zip") ?? "").trim();
  const honeypot = String(formData.get("company") ?? "").trim();

  const errors: BookingState["errors"] = {};

  // Re-resolve the slot from the live availability so users can't
  // submit a stale or invalid id.
  const days = generateDays();
  const slot = slotId ? findSlot(slotId, days) : null;
  if (!slot) errors.slot = "Pick a slot from the list above.";

  if (name.length < 2) errors.name = "Please enter your name.";
  if (!isValidPhone(phone)) errors.phone = "Please enter a valid phone number.";
  if (vehicle.length < 2) errors.vehicle = "Tell us your vehicle (year/make/model).";
  if (!service || !VALID_SERVICES.has(service))
    errors.service = "Pick what you need help with.";

  if (Object.keys(errors).length) {
    return { ok: false, errors };
  }

  // Silently swallow obvious bots.
  if (honeypot) {
    redirect(`/booked?slot=${encodeURIComponent(slotId)}`);
  }

  if (!slot) {
    return { ok: false, errors: { slot: "That slot just filled. Pick another." } };
  }

  const d = describeSlot(slot);
  const slotDayLabel = dayLabel(d);

  const h = await headers();
  const booking = {
    name,
    phone,
    vehicle,
    service,
    damage: damage || undefined,
    insurance: insurance || undefined,
    zip: zip || undefined,
    receivedAt: new Date().toISOString(),
    ip: h.get("x-forwarded-for") ?? h.get("x-real-ip") ?? undefined,
    userAgent: h.get("user-agent") ?? undefined,
    slotStart: `${slot.date}T${String(Math.floor(slot.startMinutes / 60)).padStart(2, "0")}:${String(slot.startMinutes % 60).padStart(2, "0")}`,
    slotRangeLabel: slot.rangeLabel,
    slotDayLabel,
  };

  try {
    await notifyBooking(booking);
  } catch (err) {
    console.error("[F.A.S.T. booking] notify failed:", err);
  }

  redirect(`/booked?slot=${encodeURIComponent(slot.id)}`);
}
