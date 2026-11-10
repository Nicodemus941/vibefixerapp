"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logEvent } from "@/lib/platform-events";
import { optionalUrl } from "@/lib/profile-showcase";
import {
  readCertifications,
  readEducation,
  type CertificationRow,
  type EducationRow,
} from "@/lib/profile-showcase-data";

export type { CertificationRow, EducationRow };

export async function fetchEducation(userId: string): Promise<EducationRow[]> {
  const supabase = await createClient();
  return readEducation(supabase, userId);
}

export async function fetchCertifications(userId: string): Promise<CertificationRow[]> {
  const supabase = await createClient();
  return readCertifications(supabase, userId);
}

function linksError(msg: string): string {
  if (/proof_url|document_url/.test(msg) && /column/i.test(msg)) {
    return "Proof and document links are not enabled yet.";
  }
  return msg;
}

export async function addEducation(input: {
  schoolName: string;
  degree: string | null;
  fieldOfStudy: string | null;
  startYear: number | null;
  endYear: number | null;
  description: string | null;
  proofUrl?: string | null;
  documentUrl?: string | null;
}): Promise<{ id?: string; proof_url?: string | null; document_url?: string | null; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  if (!input.schoolName.trim()) return { error: "School name is required." };
  if (input.endYear && input.startYear && input.endYear < input.startYear)
    return { error: "End year can't precede start year." };
  const proof = optionalUrl(input.proofUrl);
  const doc = optionalUrl(input.documentUrl);
  if (!proof.ok || !doc.ok) return { error: "Links must start with http or https." };

  const { data: inserted, error } = await supabase.from("education").insert({
    // Only send the link columns when used, so adding an entry keeps
    // working before the showcase migration is applied.
    ...(proof.value ? { proof_url: proof.value } : {}),
    ...(doc.value ? { document_url: doc.value } : {}),
    user_id: user.id,
    school_name: input.schoolName.trim(),
    degree: input.degree?.trim() || null,
    field_of_study: input.fieldOfStudy?.trim() || null,
    start_year: input.startYear,
    end_year: input.endYear,
    description: input.description?.trim() || null,
  }).select("id").single();
  if (error) return { error: linksError(error.message) };

  await logEvent("education_added", user.id, {});
  revalidateResume(user.id);
  return { id: inserted?.id, proof_url: proof.value, document_url: doc.value };
}

export async function deleteEducation(id: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };
  const { error } = await supabase.from("education").delete().eq("id", id).eq("user_id", user.id);
  if (error) return { error: error.message };
  revalidateResume(user.id);
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
  documentUrl?: string | null;
}): Promise<{ id?: string; credential_url?: string | null; document_url?: string | null; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  if (!input.name.trim()) return { error: "Certification name is required." };
  if (input.expiresDate && input.issuedDate && input.expiresDate < input.issuedDate)
    return { error: "Expires date can't precede issued date." };
  const credential = optionalUrl(input.credentialUrl);
  const doc = optionalUrl(input.documentUrl);
  if (!credential.ok || !doc.ok) return { error: "Links must start with http or https." };

  const { data: inserted, error } = await supabase.from("certifications").insert({
    ...(doc.value ? { document_url: doc.value } : {}),
    user_id: user.id,
    name: input.name.trim(),
    issuer: input.issuer?.trim() || null,
    issued_date: input.issuedDate || null,
    expires_date: input.expiresDate || null,
    credential_id: input.credentialId?.trim() || null,
    credential_url: credential.value,
    description: input.description?.trim() || null,
  }).select("id").single();
  if (error) return { error: linksError(error.message) };

  await logEvent("certification_added", user.id, {});
  revalidateResume(user.id);
  return { id: inserted?.id, credential_url: credential.value, document_url: doc.value };
}

export async function deleteCertification(id: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };
  const { error } = await supabase.from("certifications").delete().eq("id", id).eq("user_id", user.id);
  if (error) return { error: error.message };
  revalidateResume(user.id);
  return {};
}

// Proof and document links on an existing entry. Education has both a
// proof link and a document link; a certification's proof link is its
// credential_url.
export async function updateEducationLinks(
  id: string,
  links: { proofUrl: string; documentUrl: string },
): Promise<{ error?: string; proof_url?: string | null; document_url?: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };
  const proof = optionalUrl(links.proofUrl);
  const doc = optionalUrl(links.documentUrl);
  if (!proof.ok || !doc.ok) return { error: "Links must start with http or https." };
  const { error } = await supabase
    .from("education")
    .update({ proof_url: proof.value, document_url: doc.value })
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return { error: linksError(error.message) };
  revalidateResume(user.id);
  return { proof_url: proof.value, document_url: doc.value };
}

export async function updateCertificationLinks(
  id: string,
  links: { proofUrl: string; documentUrl: string },
): Promise<{ error?: string; credential_url?: string | null; document_url?: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };
  const proof = optionalUrl(links.proofUrl);
  const doc = optionalUrl(links.documentUrl);
  if (!proof.ok || !doc.ok) return { error: "Links must start with http or https." };
  const { error } = await supabase
    .from("certifications")
    .update({ credential_url: proof.value, document_url: doc.value })
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return { error: linksError(error.message) };
  revalidateResume(user.id);
  return { credential_url: proof.value, document_url: doc.value };
}

function revalidateResume(uid: string) {
  revalidatePath(`/u/${uid}`);
  revalidatePath(`/c/${uid}`);
  revalidatePath("/account");
}
