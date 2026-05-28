"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logEvent } from "@/lib/platform-events";

export type EducationRow = {
  id: string;
  school_name: string;
  degree: string | null;
  field_of_study: string | null;
  start_year: number | null;
  end_year: number | null;
  description: string | null;
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
};

export async function fetchEducation(userId: string): Promise<EducationRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("education")
    .select("id, school_name, degree, field_of_study, start_year, end_year, description")
    .eq("user_id", userId)
    .order("end_year", { ascending: false, nullsFirst: true });
  return (data ?? []) as EducationRow[];
}

export async function fetchCertifications(userId: string): Promise<CertificationRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("certifications")
    .select("id, name, issuer, issued_date, expires_date, credential_id, credential_url, description")
    .eq("user_id", userId)
    .order("issued_date", { ascending: false, nullsFirst: false });
  return (data ?? []) as CertificationRow[];
}

export async function addEducation(input: {
  schoolName: string;
  degree: string | null;
  fieldOfStudy: string | null;
  startYear: number | null;
  endYear: number | null;
  description: string | null;
}): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  if (!input.schoolName.trim()) return { error: "School name is required." };
  if (input.endYear && input.startYear && input.endYear < input.startYear)
    return { error: "End year can't precede start year." };

  const { error } = await supabase.from("education").insert({
    user_id: user.id,
    school_name: input.schoolName.trim(),
    degree: input.degree?.trim() || null,
    field_of_study: input.fieldOfStudy?.trim() || null,
    start_year: input.startYear,
    end_year: input.endYear,
    description: input.description?.trim() || null,
  });
  if (error) return { error: error.message };

  await logEvent("education_added", user.id, {});
  revalidatePath(`/u/${user.id}`);
  revalidatePath("/account");
  return {};
}

export async function deleteEducation(id: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };
  const { error } = await supabase.from("education").delete().eq("id", id).eq("user_id", user.id);
  if (error) return { error: error.message };
  revalidatePath(`/u/${user.id}`);
  revalidatePath("/account");
  return {};
}

export async function addCertification(input: {
  name: string;
  issuer: string | null;
  issuedDate: string | null;
  expiresDate: string | null;
  credentialId: string | null;
  credentialUrl: string | null;
  description: string | null;
}): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  if (!input.name.trim()) return { error: "Certification name is required." };
  if (input.expiresDate && input.issuedDate && input.expiresDate < input.issuedDate)
    return { error: "Expires date can't precede issued date." };

  const { error } = await supabase.from("certifications").insert({
    user_id: user.id,
    name: input.name.trim(),
    issuer: input.issuer?.trim() || null,
    issued_date: input.issuedDate || null,
    expires_date: input.expiresDate || null,
    credential_id: input.credentialId?.trim() || null,
    credential_url: input.credentialUrl?.trim() || null,
    description: input.description?.trim() || null,
  });
  if (error) return { error: error.message };

  await logEvent("certification_added", user.id, {});
  revalidatePath(`/u/${user.id}`);
  revalidatePath("/account");
  return {};
}

export async function deleteCertification(id: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };
  const { error } = await supabase.from("certifications").delete().eq("id", id).eq("user_id", user.id);
  if (error) return { error: error.message };
  revalidatePath(`/u/${user.id}`);
  revalidatePath("/account");
  return {};
}
