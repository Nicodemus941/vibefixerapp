"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/database.types";
import { logEvent } from "@/lib/platform-events";
import {
  DEFAULT_CONTRACT_FIELDS,
  LOOP_CONTRACT_TEMPLATE,
  LOOP_NDA_TEMPLATE,
  type ContractFields,
} from "@/lib/document-templates";

export type DocumentRow = {
  id: string;
  conversation_id: string;
  creator_id: string;
  counterparty_id: string;
  parent_document_id: string | null;
  kind: "nda" | "contract" | "amendment";
  title: string;
  body_text: string;
  file_url: string | null;
  fields: ContractFields | null;
  status: "draft" | "signed" | "amended" | "void";
  created_at: string;
  signed_at: string | null;
};

export type DocumentSignature = {
  user_id: string;
  signed_name: string;
  signed_at: string;
};

export async function fetchDocumentsForConversation(
  conversationId: string,
): Promise<DocumentRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("documents")
    .select(
      "id, conversation_id, creator_id, counterparty_id, parent_document_id, kind, title, body_text, file_url, fields, status, created_at, signed_at",
    )
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false });
  return (data ?? []) as DocumentRow[];
}

export async function fetchDocument(
  documentId: string,
): Promise<{
  doc: DocumentRow | null;
  signatures: DocumentSignature[];
  error?: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { doc: null, signatures: [], error: "not signed in" };

  const { data: doc } = await supabase
    .from("documents")
    .select(
      "id, conversation_id, creator_id, counterparty_id, parent_document_id, kind, title, body_text, file_url, fields, status, created_at, signed_at",
    )
    .eq("id", documentId)
    .maybeSingle();
  if (!doc) return { doc: null, signatures: [], error: "not found" };
  if (doc.creator_id !== user.id && doc.counterparty_id !== user.id) {
    return { doc: null, signatures: [], error: "not a participant" };
  }

  const { data: sigs } = await supabase
    .from("document_signatures")
    .select("user_id, signed_name, signed_at")
    .eq("document_id", documentId);

  return { doc: doc as DocumentRow, signatures: (sigs ?? []) as DocumentSignature[] };
}

type CreateInput = {
  conversationId: string;
  counterpartyId: string;
  kind: "nda" | "contract";
  source: "loop_template" | "upload" | "custom_text";
  title?: string;
  bodyText?: string;
  fileUrl?: string;
  fields?: Partial<ContractFields>;
};

export async function createDocument(input: CreateInput): Promise<{
  error?: string;
  documentId?: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "not signed in" };

  let title = input.title?.trim() ?? "";
  let bodyText = input.bodyText?.trim() ?? "";
  let fields: ContractFields | null = null;

  if (input.kind === "nda") {
    if (input.source === "loop_template") {
      title = title || "Mutual NDA";
      bodyText = LOOP_NDA_TEMPLATE;
    } else if (input.source === "upload") {
      title = title || "Uploaded NDA";
      bodyText = bodyText || "See attached file.";
    } else {
      title = title || "Custom NDA";
    }
  } else {
    fields = { ...DEFAULT_CONTRACT_FIELDS, ...(input.fields ?? {}) };
    if (input.source === "loop_template") {
      title = title || "Services Agreement";
      bodyText = LOOP_CONTRACT_TEMPLATE;
    } else if (input.source === "upload") {
      title = title || "Uploaded Contract";
      bodyText = bodyText || "See attached file.";
    } else {
      title = title || "Custom Contract";
    }
  }

  if (!title) return { error: "Title is required" };
  if (!bodyText && !input.fileUrl) {
    return { error: "Either body text or an uploaded file is required" };
  }

  const { data, error } = await supabase
    .from("documents")
    .insert({
      conversation_id: input.conversationId,
      creator_id: user.id,
      counterparty_id: input.counterpartyId,
      kind: input.kind,
      title,
      body_text: bodyText,
      file_url: input.fileUrl ?? null,
      fields: fields as unknown as Json,
    })
    .select("id")
    .single();
  if (error || !data) return { error: error?.message ?? "insert failed" };

  await logEvent("document_created", user.id, {
    document_id: data.id,
    kind: input.kind,
    source: input.source,
  });
  revalidatePath(`/inbox/${input.conversationId}`);
  return { documentId: data.id };
}

export async function updateDocumentDraft(
  documentId: string,
  updates: {
    title?: string;
    bodyText?: string;
    fileUrl?: string | null;
    fields?: Partial<ContractFields>;
  },
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "not signed in" };

  const { data: doc } = await supabase
    .from("documents")
    .select("id, status, fields, conversation_id, creator_id, counterparty_id")
    .eq("id", documentId)
    .maybeSingle();
  if (!doc) return { error: "not found" };
  if (doc.status !== "draft") {
    return {
      error: "This document is signed and locked. Propose an amendment instead.",
    };
  }
  if (doc.creator_id !== user.id && doc.counterparty_id !== user.id) {
    return { error: "not a participant" };
  }

  const patch: Record<string, unknown> = {};
  if (updates.title !== undefined) patch.title = updates.title.trim();
  if (updates.bodyText !== undefined) patch.body_text = updates.bodyText;
  if (updates.fileUrl !== undefined) patch.file_url = updates.fileUrl;
  if (updates.fields !== undefined) {
    patch.fields = {
      ...((doc.fields as ContractFields | null) ?? DEFAULT_CONTRACT_FIELDS),
      ...updates.fields,
    };
  }

  // Editing invalidates prior signatures (audit-safe — we delete sigs so the
  // doc has to be re-signed by both parties).
  await supabase.from("document_signatures").delete().eq("document_id", documentId);

  const { error } = await supabase
    .from("documents")
    .update(patch as never)
    .eq("id", documentId);
  if (error) return { error: error.message };

  revalidatePath(`/inbox/${doc.conversation_id}`);
  revalidatePath(`/d/${documentId}`);
  return {};
}

export async function signDocument(input: {
  documentId: string;
  signedName: string;
}): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "not signed in" };
  if (!input.signedName.trim()) return { error: "Type your full name to sign" };

  const { data: doc } = await supabase
    .from("documents")
    .select("id, status, conversation_id, creator_id, counterparty_id")
    .eq("id", input.documentId)
    .maybeSingle();
  if (!doc) return { error: "not found" };
  if (doc.status !== "draft") return { error: `Cannot sign — status is ${doc.status}` };
  if (doc.creator_id !== user.id && doc.counterparty_id !== user.id) {
    return { error: "not a participant" };
  }

  const userAgent = (await headers()).get("user-agent")?.slice(0, 500) ?? null;

  const { error } = await supabase.from("document_signatures").insert({
    document_id: input.documentId,
    user_id: user.id,
    signed_name: input.signedName.trim(),
    user_agent: userAgent,
  });
  if (error) return { error: error.message };

  // Drop a system message into the underlying conversation thread.
  await supabase.from("messages").insert({
    conversation_id: doc.conversation_id,
    sender_id: user.id,
    body: `🖋 Signed document: ${input.documentId}`,
  });

  await logEvent("document_signed", user.id, { document_id: input.documentId });
  revalidatePath(`/inbox/${doc.conversation_id}`);
  revalidatePath(`/d/${input.documentId}`);
  return {};
}

export async function voidDocument(documentId: string): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "not signed in" };

  const { data: doc } = await supabase
    .from("documents")
    .select("id, status, conversation_id, creator_id")
    .eq("id", documentId)
    .maybeSingle();
  if (!doc) return { error: "not found" };
  if (doc.creator_id !== user.id) return { error: "Only the creator can void a draft" };
  if (doc.status !== "draft") return { error: "Only drafts can be voided" };

  const { error } = await supabase
    .from("documents")
    .update({ status: "void", voided_at: new Date().toISOString() })
    .eq("id", documentId);
  if (error) return { error: error.message };

  revalidatePath(`/inbox/${doc.conversation_id}`);
  revalidatePath(`/d/${documentId}`);
  return {};
}

// Propose an amendment to a signed document. Creates a new draft with
// parent_document_id pointing at the canonical version.
export async function proposeAmendment(input: {
  parentDocumentId: string;
  newBodyText: string;
  newFields?: Partial<ContractFields>;
  title?: string;
}): Promise<{ error?: string; amendmentId?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "not signed in" };

  const { data: parent } = await supabase
    .from("documents")
    .select(
      "id, conversation_id, creator_id, counterparty_id, kind, title, status, fields",
    )
    .eq("id", input.parentDocumentId)
    .maybeSingle();
  if (!parent) return { error: "parent not found" };
  if (parent.status !== "signed") {
    return { error: "Can only amend a signed document" };
  }
  if (parent.creator_id !== user.id && parent.counterparty_id !== user.id) {
    return { error: "not a participant" };
  }

  // The proposer becomes the creator. Counterparty stays the same set; we
  // pick the other one relative to the proposer.
  const counterparty =
    parent.creator_id === user.id ? parent.counterparty_id : parent.creator_id;

  const mergedFields =
    parent.kind === "contract"
      ? {
          ...((parent.fields as ContractFields | null) ?? DEFAULT_CONTRACT_FIELDS),
          ...(input.newFields ?? {}),
        }
      : null;

  const { data, error } = await supabase
    .from("documents")
    .insert({
      conversation_id: parent.conversation_id,
      creator_id: user.id,
      counterparty_id: counterparty,
      parent_document_id: parent.id,
      kind: "amendment",
      title: input.title?.trim() || `Amendment to ${parent.title}`,
      body_text: input.newBodyText,
      fields: mergedFields as unknown as Json,
    })
    .select("id")
    .single();
  if (error || !data) return { error: error?.message ?? "insert failed" };

  await logEvent("amendment_proposed", user.id, {
    parent_document_id: parent.id,
    amendment_id: data.id,
  });
  revalidatePath(`/inbox/${parent.conversation_id}`);
  return { amendmentId: data.id };
}

// Issue a signed upload URL the client can PUT a file to. Returns the
// canonical object path (and the public-ish download URL via signed URL).
export async function getDocumentUploadUrl(input: {
  conversationId: string;
  documentId: string;
  filename: string;
  contentType: string;
}): Promise<{ uploadUrl?: string; objectPath?: string; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "not signed in" };

  const safeName = input.filename.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 100);
  const objectPath = `${input.conversationId}/${input.documentId}/${Date.now()}_${safeName}`;

  const { data, error } = await supabase.storage
    .from("documents")
    .createSignedUploadUrl(objectPath);
  if (error || !data) return { error: error?.message ?? "could not get upload url" };

  return { uploadUrl: data.signedUrl, objectPath };
}

export async function attachUploadedFile(input: {
  documentId: string;
  objectPath: string;
}): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "not signed in" };

  // Create a signed download URL valid for 7 days.
  const { data: signed, error: signedErr } = await supabase.storage
    .from("documents")
    .createSignedUrl(input.objectPath, 7 * 24 * 60 * 60);
  if (signedErr || !signed) return { error: signedErr?.message ?? "could not sign url" };

  const { data: doc } = await supabase
    .from("documents")
    .select("status, conversation_id")
    .eq("id", input.documentId)
    .maybeSingle();
  if (!doc) return { error: "not found" };
  if (doc.status !== "draft") {
    return { error: "Cannot attach to a signed document" };
  }

  const { error } = await supabase
    .from("documents")
    .update({ file_url: signed.signedUrl })
    .eq("id", input.documentId);
  if (error) return { error: error.message };

  revalidatePath(`/d/${input.documentId}`);
  revalidatePath(`/inbox/${doc.conversation_id}`);
  return {};
}

export async function navigateToDocument(documentId: string): Promise<void> {
  redirect(`/d/${documentId}`);
}
