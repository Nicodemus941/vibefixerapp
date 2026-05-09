"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { notifyLead } from "../lib/notifications";
import { codeForPhone, normalizeCode } from "../lib/referral";

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

  redirect(ownCode ? `/thank-you?code=${ownCode}` : "/thank-you");
}
