"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  FileText,
  Loader2,
  Lock,
  ShieldCheck,
  Upload,
  X,
} from "lucide-react";
import {
  attachUploadedFile,
  getDocumentUploadUrl,
  proposeAmendment,
  signDocument,
  updateDocumentDraft,
  voidDocument,
  type DocumentRow,
  type DocumentSignature,
} from "@/app/documents/actions";
import {
  DEFAULT_CONTRACT_FIELDS,
  LOOP_CONTRACT_TEMPLATE,
  LOOP_NDA_TEMPLATE,
  PAYMENT_TERMS_OPTIONS,
  REFUND_POLICY_OPTIONS,
  renderTemplate,
  type ContractFields,
} from "@/lib/document-templates";

export function DocumentEditor({
  doc,
  signatures,
  viewerId,
  creatorName,
  counterpartyName,
}: {
  doc: DocumentRow;
  signatures: DocumentSignature[];
  viewerId: string;
  creatorName: string;
  counterpartyName: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const isCreator = doc.creator_id === viewerId;
  const isParticipant = isCreator || doc.counterparty_id === viewerId;
  const isDraft = doc.status === "draft";
  const isLocked = !isDraft;

  const mySig = signatures.find((s) => s.user_id === viewerId);
  const theirSig = signatures.find((s) => s.user_id !== viewerId);

  // Editable local state (only relevant in draft).
  const [title, setTitle] = useState(doc.title);
  const [bodyText, setBodyText] = useState(doc.body_text);
  const [fields, setFields] = useState<ContractFields>(
    (doc.fields as ContractFields | null) ?? DEFAULT_CONTRACT_FIELDS,
  );
  const [fileUrl, setFileUrl] = useState<string | null>(doc.file_url);
  const [signedName, setSignedName] = useState("");
  const [isAmending, setIsAmending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Re-sync if the server pushes a new version.
  useEffect(() => {
    setTitle(doc.title);
    setBodyText(doc.body_text);
    setFields((doc.fields as ContractFields | null) ?? DEFAULT_CONTRACT_FIELDS);
    setFileUrl(doc.file_url);
  }, [doc.id, doc.title, doc.body_text, doc.fields, doc.file_url]);

  // Render preview (substitute tokens when body matches a known template).
  const renderedPreview = useMemo(() => {
    const isLoopTemplate =
      bodyText === LOOP_NDA_TEMPLATE || bodyText === LOOP_CONTRACT_TEMPLATE;
    if (isLoopTemplate) {
      return renderTemplate(bodyText, creatorName, counterpartyName, fields);
    }
    return bodyText;
  }, [bodyText, fields, creatorName, counterpartyName]);

  function saveDraft() {
    setError(null);
    startTransition(async () => {
      const r = await updateDocumentDraft(doc.id, {
        title,
        bodyText,
        fields: doc.kind === "contract" ? fields : undefined,
      });
      if (r.error) setError(r.error);
      else router.refresh();
    });
  }

  function sign() {
    setError(null);
    if (!signedName.trim()) {
      setError("Type your full name to sign");
      return;
    }
    startTransition(async () => {
      const r = await signDocument({ documentId: doc.id, signedName });
      if (r.error) setError(r.error);
      else {
        setSignedName("");
        router.refresh();
      }
    });
  }

  function discard() {
    if (!confirm("Discard this draft? This can't be undone.")) return;
    startTransition(async () => {
      const r = await voidDocument(doc.id);
      if (r.error) setError(r.error);
      else router.push(`/inbox/${doc.conversation_id}`);
    });
  }

  async function uploadFile(file: File) {
    setError(null);
    const r = await getDocumentUploadUrl({
      conversationId: doc.conversation_id,
      documentId: doc.id,
      filename: file.name,
      contentType: file.type || "application/octet-stream",
    });
    if (r.error || !r.uploadUrl || !r.objectPath) {
      setError(r.error ?? "could not get upload url");
      return;
    }
    const putResp = await fetch(r.uploadUrl, {
      method: "PUT",
      headers: { "content-type": file.type || "application/octet-stream" },
      body: file,
    });
    if (!putResp.ok) {
      setError(`upload failed (${putResp.status})`);
      return;
    }
    const attach = await attachUploadedFile({
      documentId: doc.id,
      objectPath: r.objectPath,
    });
    if (attach.error) setError(attach.error);
    else {
      router.refresh();
    }
  }

  function startAmendment() {
    setIsAmending(true);
  }
  function submitAmendment() {
    setError(null);
    startTransition(async () => {
      const r = await proposeAmendment({
        parentDocumentId: doc.id,
        newBodyText: bodyText,
        newFields: doc.kind === "contract" ? fields : undefined,
        title,
      });
      if (r.error) setError(r.error);
      else if (r.amendmentId) {
        setIsAmending(false);
        router.push(`/d/${r.amendmentId}`);
      }
    });
  }

  if (!isParticipant) {
    return <p className="text-[var(--fg-muted)]">You aren&apos;t a party to this document.</p>;
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <header className="rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] p-5">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 shrink-0 rounded-full bg-[var(--surface-3)] flex items-center justify-center text-[var(--fg-muted)]">
            {doc.kind === "nda" ? (
              <ShieldCheck className="h-5 w-5" />
            ) : (
              <FileText className="h-5 w-5" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            {isDraft ? (
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-transparent text-xl font-semibold tracking-tight outline-none focus:bg-[var(--surface-2)] rounded px-1 -mx-1"
              />
            ) : (
              <h1 className="text-xl font-semibold tracking-tight">{doc.title}</h1>
            )}
            <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--fg-subtle)] mt-1">
              {doc.kind.toUpperCase()} · {creatorName} ↔ {counterpartyName}
            </p>
          </div>
          <StatusPill status={doc.status} />
        </div>

        {/* Signatures strip */}
        <div className="mt-4 grid grid-cols-2 gap-3 border-t border-[var(--border)] pt-4">
          <SignatureSlot
            label="Creator"
            name={creatorName}
            signature={signatures.find((s) => s.user_id === doc.creator_id) ?? null}
            isMe={doc.creator_id === viewerId}
          />
          <SignatureSlot
            label="Counterparty"
            name={counterpartyName}
            signature={signatures.find((s) => s.user_id === doc.counterparty_id) ?? null}
            isMe={doc.counterparty_id === viewerId}
          />
        </div>
      </header>

      {/* Locked banner */}
      {isLocked && doc.status === "signed" && (
        <div className="rounded-2xl border border-[var(--accent)]/30 bg-[var(--accent)]/[0.06] p-4 flex items-start gap-3">
          <Lock className="h-4 w-4 mt-0.5 text-[var(--accent)] shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-sm text-[var(--fg)]">
              Signed and locked on{" "}
              {doc.signed_at ? new Date(doc.signed_at).toLocaleString() : "—"}.
            </p>
            <p className="text-xs text-[var(--fg-muted)] mt-1">
              To change anything, propose an amendment. The other party must counter-sign.
            </p>
            {!isAmending && (
              <button
                type="button"
                onClick={startAmendment}
                className="press-shrink mt-3 inline-flex items-center rounded-full border border-[var(--border-strong)] bg-white/[0.02] px-3 py-1.5 text-xs text-[var(--fg)] hover:bg-white/[0.05]"
              >
                Propose amendment
              </button>
            )}
          </div>
        </div>
      )}

      {isLocked && doc.status === "amended" && (
        <div className="rounded-2xl border border-sky-400/30 bg-sky-400/[0.06] p-4 flex items-start gap-3">
          <FileText className="h-4 w-4 mt-0.5 text-sky-400 shrink-0" />
          <p className="text-sm text-[var(--fg)]">
            This document has been amended. View the latest amendment instead.
          </p>
        </div>
      )}

      {/* Contract fields editor (draft + contract/amendment only) */}
      {(isDraft || isAmending) && (doc.kind === "contract" || doc.kind === "amendment") && (
        <FieldsEditor
          fields={fields}
          onChange={setFields}
          disabled={pending}
        />
      )}

      {/* Body */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] p-5 space-y-3">
        <div className="flex items-center justify-between">
          <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--fg-subtle)]">
            Document text
          </p>
          {(isDraft || isAmending) && (
            <span className="font-mono text-[10px] text-[var(--fg-subtle)]">
              {bodyText.length.toLocaleString()} chars
            </span>
          )}
        </div>
        {isDraft || isAmending ? (
          <textarea
            value={bodyText}
            onChange={(e) => setBodyText(e.target.value)}
            rows={20}
            className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3 text-sm text-[var(--fg)] font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            disabled={pending}
          />
        ) : (
          <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-[var(--fg)] bg-[var(--surface-2)] rounded-xl border border-[var(--border)] p-4 max-h-[60vh] overflow-auto">
            {renderedPreview}
          </pre>
        )}

        {fileUrl && (
          <a
            href={fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="press-shrink inline-flex items-center gap-1.5 rounded-full border border-[var(--border-strong)] bg-white/[0.02] px-3 py-1.5 text-xs text-[var(--fg-muted)] hover:bg-white/[0.05]"
          >
            <FileText className="h-3.5 w-3.5" />
            Download attached file
          </a>
        )}
      </div>

      {/* Draft actions */}
      {isDraft && (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] p-5 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={saveDraft}
              disabled={pending}
              className="press-shrink inline-flex items-center gap-1.5 rounded-full bg-[var(--accent)] px-3.5 py-1.5 text-xs font-medium text-[var(--bg)] hover:brightness-110 disabled:opacity-50"
            >
              {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Save draft"}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) uploadFile(f);
                e.currentTarget.value = "";
              }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={pending}
              className="press-shrink inline-flex items-center gap-1.5 rounded-full border border-[var(--border-strong)] bg-white/[0.02] px-3 py-1.5 text-xs text-[var(--fg-muted)] hover:bg-white/[0.05]"
            >
              <Upload className="h-3.5 w-3.5" />
              {fileUrl ? "Replace file" : "Attach file"}
            </button>
            {isCreator && (
              <button
                type="button"
                onClick={discard}
                disabled={pending}
                className="press-shrink ml-auto inline-flex items-center gap-1.5 rounded-full border border-[var(--danger)]/40 bg-[var(--danger)]/[0.06] px-3 py-1.5 text-xs text-[var(--danger)] hover:bg-[var(--danger)]/[0.12]"
              >
                <X className="h-3.5 w-3.5" />
                Discard draft
              </button>
            )}
          </div>
          <p className="text-xs text-[var(--fg-muted)]">
            Either party can edit while draft. Saving invalidates prior
            signatures — both sides will need to re-sign.
          </p>

          <SignBlock
            mySig={mySig}
            theirSig={theirSig}
            signedName={signedName}
            onChange={setSignedName}
            onSign={sign}
            disabled={pending}
          />
        </div>
      )}

      {/* Amendment authoring mode */}
      {isAmending && (
        <div className="rounded-2xl border border-sky-400/30 bg-sky-400/[0.06] p-5 space-y-3">
          <p className="text-sm text-[var(--fg)] font-medium">
            Drafting an amendment to this signed document
          </p>
          <p className="text-xs text-[var(--fg-muted)]">
            Edit the body and fields above. When you submit, a new draft is
            created with the changes. The other party must counter-sign for
            the amendment to take effect.
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={submitAmendment}
              disabled={pending}
              className="press-shrink inline-flex items-center gap-1.5 rounded-full bg-sky-400 px-3.5 py-1.5 text-xs font-medium text-[var(--bg)] hover:brightness-110 disabled:opacity-50"
            >
              {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Submit amendment"}
            </button>
            <button
              type="button"
              onClick={() => setIsAmending(false)}
              disabled={pending}
              className="press-shrink inline-flex items-center rounded-full border border-[var(--border-strong)] bg-white/[0.02] px-3 py-1.5 text-xs text-[var(--fg-muted)] hover:bg-white/[0.05]"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-[var(--danger)]/40 bg-[var(--danger)]/[0.06] p-4 text-sm text-[var(--danger)]">
          {error}
        </div>
      )}
    </div>
  );
}

function StatusPill({ status }: { status: DocumentRow["status"] }) {
  const styles =
    status === "signed"
      ? "border-[var(--accent)]/40 text-[var(--accent)] bg-[var(--accent)]/10"
      : status === "amended"
      ? "border-sky-400/40 text-sky-400 bg-sky-400/10"
      : status === "void"
      ? "border-[var(--danger)]/40 text-[var(--danger)] bg-[var(--danger)]/10"
      : "border-[var(--border-strong)] text-[var(--fg-muted)] bg-white/[0.02]";
  return (
    <span
      className={`shrink-0 font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border ${styles}`}
    >
      {status}
    </span>
  );
}

function SignatureSlot({
  label,
  name,
  signature,
  isMe,
}: {
  label: string;
  name: string;
  signature: DocumentSignature | null;
  isMe: boolean;
}) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3">
      <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--fg-subtle)]">
        {label} {isMe && "(you)"}
      </p>
      <p className="text-sm text-[var(--fg)] mt-0.5 truncate">{name}</p>
      {signature ? (
        <p className="font-mono text-[10px] mt-1 text-[var(--accent)] flex items-center gap-1">
          <CheckCircle2 className="h-3 w-3" />
          Signed {new Date(signature.signed_at).toLocaleString()}
        </p>
      ) : (
        <p className="font-mono text-[10px] mt-1 text-[var(--fg-subtle)]">
          Awaiting signature
        </p>
      )}
    </div>
  );
}

function SignBlock({
  mySig,
  theirSig,
  signedName,
  onChange,
  onSign,
  disabled,
}: {
  mySig: DocumentSignature | undefined;
  theirSig: DocumentSignature | undefined;
  signedName: string;
  onChange: (s: string) => void;
  onSign: () => void;
  disabled: boolean;
}) {
  if (mySig) {
    return (
      <p className="text-xs text-[var(--fg-muted)] flex items-center gap-1.5">
        <CheckCircle2 className="h-3.5 w-3.5 text-[var(--accent)]" />
        You signed this on {new Date(mySig.signed_at).toLocaleString()}.{" "}
        {theirSig
          ? "Both parties signed."
          : "Waiting for the other party."}
      </p>
    );
  }
  return (
    <div className="space-y-2 border-t border-[var(--border)] pt-4">
      <label className="block">
        <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--fg-subtle)]">
          Type your full name to sign
        </span>
        <input
          value={signedName}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Jane Founder"
          className="mt-1.5 w-full h-10 rounded-xl border border-[var(--border-strong)] bg-[var(--surface-2)] px-3.5 text-sm text-[var(--fg)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
          disabled={disabled}
        />
      </label>
      <button
        type="button"
        onClick={onSign}
        disabled={disabled || !signedName.trim()}
        className="press-shrink inline-flex items-center gap-1.5 rounded-full bg-[var(--accent)] px-3.5 py-1.5 text-xs font-medium text-[var(--bg)] hover:brightness-110 disabled:opacity-50"
      >
        <CheckCircle2 className="h-3.5 w-3.5" />
        Sign
      </button>
      <p className="text-[10px] text-[var(--fg-subtle)] font-mono">
        By signing you agree to the terms above. Your IP / user-agent are
        recorded as audit trail.
      </p>
    </div>
  );
}

function FieldsEditor({
  fields,
  onChange,
  disabled,
}: {
  fields: ContractFields;
  onChange: (f: ContractFields) => void;
  disabled: boolean;
}) {
  function set<K extends keyof ContractFields>(k: K, v: ContractFields[K]) {
    onChange({ ...fields, [k]: v });
  }
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] p-5 space-y-4">
      <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--fg-subtle)]">
        Contract fields
      </p>
      <FieldRow label="Scope">
        <textarea
          value={fields.scope}
          onChange={(e) => set("scope", e.target.value)}
          rows={3}
          disabled={disabled}
          className="w-full rounded-xl border border-[var(--border-strong)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--fg)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
          placeholder="What's being delivered, in plain English."
        />
      </FieldRow>
      <FieldRow label="Deliverables">
        <textarea
          value={fields.deliverables}
          onChange={(e) => set("deliverables", e.target.value)}
          rows={3}
          disabled={disabled}
          className="w-full rounded-xl border border-[var(--border-strong)] bg-[var(--surface-2)] px-3 py-2 text-sm text-[var(--fg)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
          placeholder="Concrete artifacts. e.g. 3 landing pages + analytics setup."
        />
      </FieldRow>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <FieldRow label="Timeline">
          <input
            value={fields.timeline}
            onChange={(e) => set("timeline", e.target.value)}
            disabled={disabled}
            className="w-full h-10 rounded-xl border border-[var(--border-strong)] bg-[var(--surface-2)] px-3 text-sm text-[var(--fg)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            placeholder="e.g. 14 days from signing"
          />
        </FieldRow>
        <FieldRow label="Price">
          <input
            value={fields.price}
            onChange={(e) => set("price", e.target.value)}
            disabled={disabled}
            className="w-full h-10 rounded-xl border border-[var(--border-strong)] bg-[var(--surface-2)] px-3 text-sm text-[var(--fg)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            placeholder="$5,000"
          />
        </FieldRow>
        <FieldRow label="Payment terms">
          <select
            value={fields.payment_terms}
            onChange={(e) =>
              set("payment_terms", e.target.value as ContractFields["payment_terms"])
            }
            disabled={disabled}
            className="w-full h-10 rounded-xl border border-[var(--border-strong)] bg-[var(--surface-2)] px-3 text-sm text-[var(--fg)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
          >
            {PAYMENT_TERMS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value} className="bg-[var(--surface-2)]">
                {o.label}
              </option>
            ))}
          </select>
        </FieldRow>
        <FieldRow label="Refund policy">
          <select
            value={fields.refund_policy}
            onChange={(e) =>
              set("refund_policy", e.target.value as ContractFields["refund_policy"])
            }
            disabled={disabled}
            className="w-full h-10 rounded-xl border border-[var(--border-strong)] bg-[var(--surface-2)] px-3 text-sm text-[var(--fg)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
          >
            {REFUND_POLICY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value} className="bg-[var(--surface-2)]">
                {o.label}
              </option>
            ))}
          </select>
        </FieldRow>
        <FieldRow label="Jurisdiction">
          <input
            value={fields.jurisdiction}
            onChange={(e) => set("jurisdiction", e.target.value)}
            disabled={disabled}
            className="w-full h-10 rounded-xl border border-[var(--border-strong)] bg-[var(--surface-2)] px-3 text-sm text-[var(--fg)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
          />
        </FieldRow>
        <FieldRow label="Effective date">
          <input
            type="date"
            value={fields.effective_date}
            onChange={(e) => set("effective_date", e.target.value)}
            disabled={disabled}
            className="w-full h-10 rounded-xl border border-[var(--border-strong)] bg-[var(--surface-2)] px-3 text-sm text-[var(--fg)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
          />
        </FieldRow>
      </div>
    </div>
  );
}

function FieldRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--fg-subtle)] block mb-1.5">
        {label}
      </span>
      {children}
    </label>
  );
}
