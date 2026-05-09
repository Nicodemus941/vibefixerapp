"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { notifyLead } from "../lib/notifications";
import { codeForPhone, normalizeCode } from "../lib/referral";
import { appendEntry, newEntryId, type Source } from "../lib/store";

export type QuoteState = {
  ok: boolean;
  errors?: Partial<Record<"name" | "phone" | "vehicle" | "service" | "form", string>>;
};

function isValidPhone(p: string) {
  const digits = p.replace(/\D/g, "");
  return digits.length >= 10 && digits.length <= 15;
}

export async function submitQuote(_prev: QuoteState, formData: FormData): Promise<QuoteState> {
  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const vehicle = String(formData.get("vehicle") ?? "").trim();
  const service = String(formData.get("service") ?? "").trim();
  const damage = String(formData.get("damage") ?? "").trim();
  const insurance = String(formData.get("insurance") ?? "").trim();
  const zip = String(formData.get("zip") ?? "").trim();
  // Honeypot: real users won't fill this hidden field; bots will.
  const honeypot = String(formData.get("company") ?? "").trim();
  const referredBy = normalizeCode(String(formData.get("ref") ?? ""));

  const errors: QuoteState["errors"] = {};
  if (name.length < 2) errors.name = "Please enter your name.";
  if (!isValidPhone(phone)) errors.phone = "Please enter a valid phone number.";
  if (vehicle.length < 2) errors.vehicle = "Tell us your vehicle (year/make/model).";
  if (!service) errors.service = "Pick what you need help with.";

  if (Object.keys(errors).length) {
    return { ok: false, errors };
  }

  // Silently swallow obvious bot submissions to keep Eric's inbox clean.
  if (honeypot) {
    redirect("/thank-you");
  }

  const h = await headers();
  const ownCode = codeForPhone(phone);
  const lead = {
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
    referredBy: referredBy || undefined,
    ownReferralCode: ownCode || undefined,
  };

  // Fire notifications. We don't await failure — even if email/SMS hiccup,
  // the customer still reaches /thank-you. Logs capture everything for debug.
  try {
    await notifyLead(lead);
  } catch (err) {
    console.error("[F.A.S.T. notify] failed:", err);
  }

  // Persist for the ops dashboard.
  try {
    await appendEntry({
      id: newEntryId(),
      source: "quote" satisfies Source,
      status: "new",
      receivedAt: lead.receivedAt,
      name: lead.name,
      phone: lead.phone,
      vehicle: lead.vehicle,
      service: lead.service,
      damage: lead.damage,
      insurance: lead.insurance,
      zip: lead.zip,
      referredBy: lead.referredBy,
      ownReferralCode: lead.ownReferralCode,
    });
  } catch (err) {
    console.error("[F.A.S.T. store] failed:", err);
  }

  redirect(ownCode ? `/thank-you?code=${ownCode}` : "/thank-you");
}

// ----- Fast lead (exit-intent modal) ---------------------------------------
// Minimum-friction capture for visitors about to bounce. Phone only (name + zip
// optional). Hits the same notifyLead path so Eric gets a normal lead alert.

export type FastLeadState = {
  ok: boolean;
  done?: boolean;
  errors?: Partial<Record<"phone" | "form", string>>;
};

export async function submitFastLead(
  _prev: FastLeadState,
  formData: FormData,
): Promise<FastLeadState> {
  const phone = String(formData.get("phone") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const zip = String(formData.get("zip") ?? "").trim();
  const honeypot = String(formData.get("company") ?? "").trim();
  const referredBy = normalizeCode(String(formData.get("ref") ?? ""));

  if (!isValidPhone(phone)) {
    return { ok: false, errors: { phone: "Please enter a valid phone number." } };
  }
  if (honeypot) {
    return { ok: true, done: true };
  }

  const h = await headers();
  const lead = {
    name: name || "Exit-intent visitor",
    phone,
    vehicle: "Not provided yet",
    service: "not-sure",
    zip: zip || undefined,
    receivedAt: new Date().toISOString(),
    ip: h.get("x-forwarded-for") ?? h.get("x-real-ip") ?? undefined,
    userAgent: h.get("user-agent") ?? undefined,
    referredBy: referredBy || undefined,
    ownReferralCode: codeForPhone(phone) || undefined,
    damage: "Captured via exit-intent modal — call back ASAP.",
  };

  try {
    await notifyLead(lead);
  } catch (err) {
    console.error("[F.A.S.T. fast-lead] notify failed:", err);
  }

  try {
    await appendEntry({
      id: newEntryId(),
      source: "fast-lead" satisfies Source,
      status: "new",
      receivedAt: lead.receivedAt,
      name: lead.name,
      phone: lead.phone,
      vehicle: lead.vehicle,
      service: lead.service,
      damage: lead.damage,
      zip: lead.zip,
      referredBy: lead.referredBy,
      ownReferralCode: lead.ownReferralCode,
    });
  } catch (err) {
    console.error("[F.A.S.T. fast-lead store] failed:", err);
  }

  return { ok: true, done: true };
}
