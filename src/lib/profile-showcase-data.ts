import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { isFeaturedKind, sortByPosition, type FeaturedKind } from "./profile-showcase";

// Read helpers for the profile showcase sections. Each takes a client so
// /u (member session, RLS applies) and /c (service role, block check done
// by the caller) share one code path. Every read tolerates the showcase
// migration not being applied yet and returns an empty list.

export type FeaturedRow = {
  id: string;
  kind: FeaturedKind;
  title: string;
  url: string;
  publisher: string | null;
  published_on: string | null;
  description: string | null;
  image_url: string | null;
  position: number;
  created_at: string | null;
};

export type AchievementRow = {
  id: string;
  title: string;
  achieved_on: string | null;
  issuer: string | null;
  description: string | null;
  proof_url: string | null;
  position: number;
  created_at: string | null;
};

export type GoalRow = {
  id: string;
  statement: string;
  target_date: string | null;
  help_text: string | null;
  position: number;
  created_at: string | null;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = SupabaseClient<any>;

export async function readFeatured(supabase: AnyClient, userId: string): Promise<FeaturedRow[]> {
  try {
    const { data, error } = await supabase
      .from("profile_featured")
      .select("id, kind, title, url, publisher, published_on, description, image_url, position, created_at")
      .eq("user_id", userId)
      .order("position", { ascending: true })
      .limit(12);
    if (error || !data) return [];
    return sortByPosition(
      (data as FeaturedRow[]).map((r) => ({ ...r, kind: isFeaturedKind(r.kind) ? r.kind : "other" })),
    );
  } catch {
    return [];
  }
}

export async function readAchievements(supabase: AnyClient, userId: string): Promise<AchievementRow[]> {
  try {
    const { data, error } = await supabase
      .from("profile_achievements")
      .select("id, title, achieved_on, issuer, description, proof_url, position, created_at")
      .eq("user_id", userId)
      .order("position", { ascending: true })
      .limit(20);
    if (error || !data) return [];
    return sortByPosition(data as AchievementRow[]);
  } catch {
    return [];
  }
}

export async function readGoals(supabase: AnyClient, userId: string): Promise<GoalRow[]> {
  try {
    const { data, error } = await supabase
      .from("profile_goals")
      .select("id, statement, target_date, help_text, position, created_at")
      .eq("user_id", userId)
      .order("position", { ascending: true })
      .limit(5);
    if (error || !data) return [];
    return sortByPosition(data as GoalRow[]);
  } catch {
    return [];
  }
}

export type ShowcaseBundle = {
  featured: FeaturedRow[];
  achievements: AchievementRow[];
  goals: GoalRow[];
};

export async function readShowcase(supabase: AnyClient, userId: string): Promise<ShowcaseBundle> {
  const [featured, achievements, goals] = await Promise.all([
    readFeatured(supabase, userId),
    readAchievements(supabase, userId),
    readGoals(supabase, userId),
  ]);
  return { featured, achievements, goals };
}

// ---------- education + certifications ----------

export type EducationRow = {
  id: string;
  school_name: string;
  degree: string | null;
  field_of_study: string | null;
  start_year: number | null;
  end_year: number | null;
  description: string | null;
  proof_url: string | null;
  document_url: string | null;
};

export type CertificationRow = {
  id: string;
  name: string;
  issuer: string | null;
  issued_date: string | null;
  expires_date: string | null;
  credential_id: string | null;
  credential_url: string | null;
  description: string | null;
  document_url: string | null;
};

// The proof / document columns come from 20261110210000_profile_showcase.
// Until that migration is applied the wider select errors, so fall back
// to the original columns and report the links as empty.
const EDU_BASE = "id, school_name, degree, field_of_study, start_year, end_year, description";
const CERT_BASE = "id, name, issuer, issued_date, expires_date, credential_id, credential_url, description";

export async function readEducation(supabase: AnyClient, userId: string): Promise<EducationRow[]> {
  const run = (cols: string) =>
    supabase
      .from("education")
      .select(cols)
      .eq("user_id", userId)
      .order("end_year", { ascending: false, nullsFirst: true });
  const wide = await run(`${EDU_BASE}, proof_url, document_url`);
  if (!wide.error) return (wide.data ?? []) as unknown as EducationRow[];
  const { data } = await run(EDU_BASE);
  return ((data ?? []) as unknown as EducationRow[]).map((r) => ({ ...r, proof_url: null, document_url: null }));
}

export async function readCertifications(supabase: AnyClient, userId: string): Promise<CertificationRow[]> {
  const run = (cols: string) =>
    supabase
      .from("certifications")
      .select(cols)
      .eq("user_id", userId)
      .order("issued_date", { ascending: false, nullsFirst: false });
  const wide = await run(`${CERT_BASE}, document_url`);
  if (!wide.error) return (wide.data ?? []) as unknown as CertificationRow[];
  const { data } = await run(CERT_BASE);
  return ((data ?? []) as unknown as CertificationRow[]).map((r) => ({ ...r, document_url: null }));
}

// True when the two members have blocked each other in either direction.
// Used by /c, which reads with the service role and so skips RLS.
export async function eitherBlocked(admin: AnyClient, a: string, b: string): Promise<boolean> {
  if (a === b) return false;
  try {
    const { data } = await admin
      .from("blocks")
      .select("blocker_id")
      .or(`and(blocker_id.eq.${a},blocked_id.eq.${b}),and(blocker_id.eq.${b},blocked_id.eq.${a})`)
      .limit(1);
    return Boolean(data && data.length > 0);
  } catch {
    // Fail closed: hide the sections rather than show them across a block.
    return true;
  }
}
