"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logEvent } from "@/lib/platform-events";

export async function blockUser(targetId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "not signed in" };
  if (user.id === targetId) return { error: "can't block yourself" };

  const { error } = await supabase
    .from("blocks")
    .insert({ blocker_id: user.id, blocked_id: targetId });
  if (error && !error.message.includes("duplicate")) return { error: error.message };

  await logEvent("user_blocked", user.id, { target_id: targetId });
  revalidatePath(`/u/${targetId}`);
  revalidatePath("/feed");
  return {};
}

export async function unblockUser(targetId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "not signed in" };

  await supabase
    .from("blocks")
    .delete()
    .eq("blocker_id", user.id)
    .eq("blocked_id", targetId);
  revalidatePath(`/u/${targetId}`);
  revalidatePath("/feed");
  return {};
}

export async function fileReport(input: {
  targetKind: "post" | "comment" | "user" | "message";
  targetId: string;
  reason: string;
}): Promise<{ error?: string; reportId?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "not signed in" };
  if (!input.reason.trim()) return { error: "Tell us what's wrong." };
  if (input.reason.length > 2000) return { error: "Keep it under 2000 chars." };

  const { data, error } = await supabase
    .from("reports")
    .insert({
      reporter_id: user.id,
      target_kind: input.targetKind,
      target_id: input.targetId,
      reason: input.reason.trim(),
    })
    .select("id")
    .single();
  if (error || !data) return { error: error?.message ?? "insert failed" };

  await logEvent("report_filed", user.id, {
    target_kind: input.targetKind,
    target_id: input.targetId,
  });
  return { reportId: data.id };
}

export type ReportRow = {
  id: string;
  reporter_id: string;
  reporter_name: string;
  target_kind: string;
  target_id: string;
  reason: string;
  status: string;
  created_at: string;
};

export async function fetchOpenReports(): Promise<ReportRow[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: me } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (me?.role !== "owner" && me?.role !== "admin") return [];

  const { data: reports } = await supabase
    .from("reports")
    .select("id, reporter_id, target_kind, target_id, reason, status, created_at")
    .eq("status", "open")
    .order("created_at", { ascending: false })
    .limit(100);
  if (!reports || reports.length === 0) return [];

  const reporterIds = Array.from(new Set(reports.map((r) => r.reporter_id)));
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, display_name")
    .in("id", reporterIds);
  const pmap = new Map((profiles ?? []).map((p) => [p.id, p.display_name]));

  return reports.map((r) => ({
    id: r.id,
    reporter_id: r.reporter_id,
    reporter_name: pmap.get(r.reporter_id) ?? "Unknown",
    target_kind: r.target_kind,
    target_id: r.target_id,
    reason: r.reason,
    status: r.status,
    created_at: r.created_at as string,
  }));
}

export async function resolveReport(input: {
  reportId: string;
  decision: "reviewed" | "dismissed";
}): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "not signed in" };

  const { data: me } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (me?.role !== "owner" && me?.role !== "admin") return { error: "admin only" };

  const { error } = await supabase
    .from("reports")
    .update({
      status: input.decision,
      reviewer_id: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", input.reportId);
  if (error) return { error: error.message };

  revalidatePath("/admin/reports");
  return {};
}
