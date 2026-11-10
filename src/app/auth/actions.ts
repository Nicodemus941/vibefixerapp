"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { verifyTurnstile } from "@/lib/turnstile";

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

// Turnstile before sending a sign in or sign up link. Skipped (and logged)
// when the Turnstile keys are not configured.
export async function checkHuman(token: string | null): Promise<{ ok: boolean; error?: string }> {
  const h = await headers();
  const ip = h.get("cf-connecting-ip") ?? h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  const r = await verifyTurnstile(token, ip);
  return r.ok ? { ok: true } : { ok: false, error: r.error };
}
