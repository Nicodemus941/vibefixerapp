"use server";

import { redirect } from "next/navigation";

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

  const errors: QuoteState["errors"] = {};
  if (name.length < 2) errors.name = "Please enter your name.";
  if (!isValidPhone(phone)) errors.phone = "Please enter a valid phone number.";
  if (vehicle.length < 2) errors.vehicle = "Tell us your vehicle (year/make/model).";
  if (!service) errors.service = "Pick what you need help with.";

  if (Object.keys(errors).length) {
    return { ok: false, errors };
  }

  // TODO(business owner): wire up to email/SMS/Twilio/etc. For now log to server.
  // This file runs server-side only.
  console.log("[F.A.S.T. lead]", {
    at: new Date().toISOString(),
    name,
    phone,
    vehicle,
    service,
    damage,
    insurance,
    zip,
  });

  redirect("/thank-you");
}
