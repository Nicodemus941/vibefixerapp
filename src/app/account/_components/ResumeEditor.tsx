"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Award, ExternalLink, FileText, GraduationCap, Link2, Loader2, Plus, Trash2 } from "lucide-react";
import {
  addCertification,
  addEducation,
  deleteCertification,
  deleteEducation,
  updateCertificationLinks,
  updateEducationLinks,
  type CertificationRow,
  type EducationRow,
} from "@/app/resume/actions";

export function EducationEditor({ initial }: { initial: EducationRow[] }) {
  const [rows, setRows] = useState(initial);
  const [open, setOpen] = useState(false);
  const router = useRouter();

  return (
    <div className="space-y-3">
      {rows.length > 0 ? (
        <ul className="space-y-2">
          {rows.map((r) => (
            <EducationItem
              key={r.id}
              row={r}
              onDelete={() => setRows((prev) => prev.filter((x) => x.id !== r.id))}
              onLinks={(proof_url, document_url) =>
                setRows((prev) => prev.map((x) => (x.id === r.id ? { ...x, proof_url, document_url } : x)))
              }
            />
          ))}
        </ul>
      ) : (
        <p className="text-sm text-[var(--fg-muted)]">
          Add schools, degrees, or programs you&apos;ve attended.
        </p>
      )}
      {open ? (
        <EducationForm
          onAdded={(row) => {
            setRows((prev) => [row, ...prev]);
            setOpen(false);
            router.refresh();
          }}
          onCancel={() => setOpen(false)}
        />
      ) : (
        <AddButton onClick={() => setOpen(true)} label="Add education" />
      )}
    </div>
  );
}

function EducationItem({
  row,
  onDelete,
  onLinks,
}: {
  row: EducationRow;
  onDelete: () => void;
  onLinks: (proof: string | null, doc: string | null) => void;
}) {
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);

  function remove() {
    if (!confirm("Remove this education entry?")) return;
    startTransition(async () => {
      const r = await deleteEducation(row.id);
      if (!r.error) onDelete();
    });
  }

  return (
    <li className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3">
      <div className="flex items-start gap-3">
        <GraduationCap className="h-4 w-4 mt-0.5 shrink-0 text-[var(--fg-subtle)]" aria-hidden />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[var(--fg)] break-words">{row.school_name}</p>
          {(row.degree || row.field_of_study) && (
            <p className="text-xs text-[var(--fg-muted)] break-words">
              {[row.degree, row.field_of_study].filter(Boolean).join(", ")}
            </p>
          )}
          <p className="text-xs text-[var(--fg-subtle)] mt-0.5 num">
            {formatYearRange(row.start_year, row.end_year)}
          </p>
          <ProofLinks proof={row.proof_url} doc={row.document_url} proofLabel="Proof" />
        </div>
        <div className="flex shrink-0 items-center">
          <IconButton label={`Edit links for ${row.school_name}`} onClick={() => setEditing((v) => !v)} pressed={editing}>
            <Link2 className="h-4 w-4" aria-hidden />
          </IconButton>
          <IconButton label={`Remove ${row.school_name}`} onClick={remove} disabled={pending} danger>
            {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Trash2 className="h-4 w-4" aria-hidden />}
          </IconButton>
        </div>
      </div>
      {editing && (
        <LinksForm
          proofLabel="Proof or verification link"
          initialProof={row.proof_url ?? ""}
          initialDoc={row.document_url ?? ""}
          save={(proofUrl, documentUrl) => updateEducationLinks(row.id, { proofUrl, documentUrl })}
          onSaved={(proof, doc) => {
            onLinks(proof, doc);
            setEditing(false);
          }}
          onCancel={() => setEditing(false)}
        />
      )}
    </li>
  );
}

function EducationForm({
  onAdded,
  onCancel,
}: {
  onAdded: (row: EducationRow) => void;
  onCancel: () => void;
}) {
  const [schoolName, setSchoolName] = useState("");
  const [degree, setDegree] = useState("");
  const [field, setField] = useState("");
  const [startYear, setStartYear] = useState("");
  const [endYear, setEndYear] = useState("");
  const [description, setDescription] = useState("");
  const [proofUrl, setProofUrl] = useState("");
  const [documentUrl, setDocumentUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit() {
    setError(null);
    startTransition(async () => {
      const r = await addEducation({
        schoolName,
        degree: degree || null,
        fieldOfStudy: field || null,
        startYear: startYear ? Number(startYear) : null,
        endYear: endYear ? Number(endYear) : null,
        description: description || null,
        proofUrl,
        documentUrl,
      });
      if (r.error || !r.id) {
        setError(r.error ?? "Could not save.");
        return;
      }
      onAdded({
        id: r.id,
        school_name: schoolName.trim(),
        degree: degree.trim() || null,
        field_of_study: field.trim() || null,
        start_year: startYear ? Number(startYear) : null,
        end_year: endYear ? Number(endYear) : null,
        description: description.trim() || null,
        proof_url: r.proof_url ?? null,
        document_url: r.document_url ?? null,
      });
    });
  }

  return (
    <FormShell title="Add education" onCancel={onCancel}>
      <SmallField label="School">
        <Input value={schoolName} onChange={setSchoolName} placeholder="MIT, Berkeley, YC Startup School…" />
      </SmallField>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <SmallField label="Degree">
          <Input value={degree} onChange={setDegree} placeholder="BS, MBA, Bootcamp…" />
        </SmallField>
        <SmallField label="Field of study">
          <Input value={field} onChange={setField} placeholder="Computer Science" />
        </SmallField>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <SmallField label="Start year">
          <Input value={startYear} onChange={setStartYear} type="number" min={1900} max={2100} />
        </SmallField>
        <SmallField label="End year">
          <Input value={endYear} onChange={setEndYear} type="number" min={1900} max={2100} />
        </SmallField>
      </div>
      <SmallField label="Notes (optional)">
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value.slice(0, 2000))}
          rows={2}
          className="w-full rounded-xl border border-[var(--border-strong)] bg-[var(--surface-2)] px-3.5 py-2 text-sm text-[var(--fg)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
        />
      </SmallField>
      <SmallField label="Proof or verification link (optional)">
        <Input value={proofUrl} onChange={setProofUrl} type="url" placeholder="https://registrar.example.edu/verify/…" />
      </SmallField>
      <SmallField label="Document link (optional)">
        <Input value={documentUrl} onChange={setDocumentUrl} type="url" placeholder="Link to a diploma or transcript you host" />
      </SmallField>
      <FormFooter error={error} pending={pending} disabled={!schoolName.trim()} onSave={submit} />
    </FormShell>
  );
}

export function CertificationsEditor({ initial }: { initial: CertificationRow[] }) {
  const [rows, setRows] = useState(initial);
  const [open, setOpen] = useState(false);
  const router = useRouter();

  return (
    <div className="space-y-3">
      {rows.length > 0 ? (
        <ul className="space-y-2">
          {rows.map((r) => (
            <CertItem
              key={r.id}
              row={r}
              onDelete={() => setRows((prev) => prev.filter((x) => x.id !== r.id))}
              onLinks={(credential_url, document_url) =>
                setRows((prev) => prev.map((x) => (x.id === r.id ? { ...x, credential_url, document_url } : x)))
              }
            />
          ))}
        </ul>
      ) : (
        <p className="text-sm text-[var(--fg-muted)]">
          List certifications or accreditations that signal expertise.
        </p>
      )}
      {open ? (
        <CertForm
          onAdded={(row) => {
            setRows((prev) => [row, ...prev]);
            setOpen(false);
            router.refresh();
          }}
          onCancel={() => setOpen(false)}
        />
      ) : (
        <AddButton onClick={() => setOpen(true)} label="Add certification" />
      )}
    </div>
  );
}

function CertItem({
  row,
  onDelete,
  onLinks,
}: {
  row: CertificationRow;
  onDelete: () => void;
  onLinks: (credential: string | null, doc: string | null) => void;
}) {
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);

  function remove() {
    if (!confirm("Remove this certification?")) return;
    startTransition(async () => {
      const r = await deleteCertification(row.id);
      if (!r.error) onDelete();
    });
  }

  return (
    <li className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3">
      <div className="flex items-start gap-3">
        <Award className="h-4 w-4 mt-0.5 shrink-0 text-[var(--fg-subtle)]" aria-hidden />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[var(--fg)] break-words">{row.name}</p>
          {row.issuer && <p className="text-xs text-[var(--fg-muted)] break-words">{row.issuer}</p>}
          <p className="text-xs text-[var(--fg-subtle)] mt-0.5 num">
            {formatCertDates(row.issued_date, row.expires_date)}
          </p>
          <ProofLinks proof={row.credential_url} doc={row.document_url} proofLabel="Credential" />
        </div>
        <div className="flex shrink-0 items-center">
          <IconButton label={`Edit links for ${row.name}`} onClick={() => setEditing((v) => !v)} pressed={editing}>
            <Link2 className="h-4 w-4" aria-hidden />
          </IconButton>
          <IconButton label={`Remove ${row.name}`} onClick={remove} disabled={pending} danger>
            {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Trash2 className="h-4 w-4" aria-hidden />}
          </IconButton>
        </div>
      </div>
      {editing && (
        <LinksForm
          proofLabel="Credential or verification link"
          initialProof={row.credential_url ?? ""}
          initialDoc={row.document_url ?? ""}
          save={async (proofUrl, documentUrl) => {
            const r = await updateCertificationLinks(row.id, { proofUrl, documentUrl });
            return { error: r.error, proof_url: r.credential_url, document_url: r.document_url };
          }}
          onSaved={(proof, doc) => {
            onLinks(proof, doc);
            setEditing(false);
          }}
          onCancel={() => setEditing(false)}
        />
      )}
    </li>
  );
}

function CertForm({
  onAdded,
  onCancel,
}: {
  onAdded: (row: CertificationRow) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [issuer, setIssuer] = useState("");
  const [issuedDate, setIssuedDate] = useState("");
  const [expiresDate, setExpiresDate] = useState("");
  const [credentialUrl, setCredentialUrl] = useState("");
  const [documentUrl, setDocumentUrl] = useState("");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function submit() {
    setError(null);
    startTransition(async () => {
      const r = await addCertification({
        name,
        issuer: issuer || null,
        issuedDate: issuedDate || null,
        expiresDate: expiresDate || null,
        credentialId: null,
        credentialUrl: credentialUrl || null,
        description: null,
        documentUrl,
      });
      if (r.error || !r.id) {
        setError(r.error ?? "Could not save.");
        return;
      }
      onAdded({
        id: r.id,
        name: name.trim(),
        issuer: issuer.trim() || null,
        issued_date: issuedDate || null,
        expires_date: expiresDate || null,
        credential_id: null,
        credential_url: r.credential_url ?? null,
        description: null,
        document_url: r.document_url ?? null,
      });
    });
  }

  return (
    <FormShell title="Add certification" onCancel={onCancel}>
      <SmallField label="Name">
        <Input value={name} onChange={setName} placeholder="AWS Solutions Architect, CFA, Y Combinator W23…" />
      </SmallField>
      <SmallField label="Issuer">
        <Input value={issuer} onChange={setIssuer} placeholder="Amazon, CFA Institute, Y Combinator…" />
      </SmallField>
      <div className="grid grid-cols-2 gap-3">
        <SmallField label="Issued">
          <Input value={issuedDate} onChange={setIssuedDate} type="date" />
        </SmallField>
        <SmallField label="Expires (optional)">
          <Input value={expiresDate} onChange={setExpiresDate} type="date" />
        </SmallField>
      </div>
      <SmallField label="Credential or verification link (optional)">
        <Input value={credentialUrl} onChange={setCredentialUrl} type="url" placeholder="https://…" />
      </SmallField>
      <SmallField label="Document link (optional)">
        <Input value={documentUrl} onChange={setDocumentUrl} type="url" placeholder="Link to a certificate you host" />
      </SmallField>
      <FormFooter error={error} pending={pending} disabled={!name.trim()} onSave={submit} />
    </FormShell>
  );
}

// ---------- shared bits ----------

function LinksForm({
  proofLabel,
  initialProof,
  initialDoc,
  save,
  onSaved,
  onCancel,
}: {
  proofLabel: string;
  initialProof: string;
  initialDoc: string;
  save: (
    proofUrl: string,
    documentUrl: string,
  ) => Promise<{ error?: string; proof_url?: string | null; document_url?: string | null }>;
  onSaved: (proof: string | null, doc: string | null) => void;
  onCancel: () => void;
}) {
  const [proof, setProof] = useState(initialProof);
  const [doc, setDoc] = useState(initialDoc);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function submit() {
    setError(null);
    startTransition(async () => {
      const r = await save(proof, doc);
      if (r.error) {
        setError(r.error);
        return;
      }
      onSaved(r.proof_url ?? null, r.document_url ?? null);
      router.refresh();
    });
  }

  return (
    <div className="mt-3 space-y-3 border-t border-[var(--border)] pt-3">
      <SmallField label={`${proofLabel} (optional)`}>
        <Input value={proof} onChange={setProof} type="url" placeholder="https://…" />
      </SmallField>
      <SmallField label="Document link (optional)">
        <Input value={doc} onChange={setDoc} type="url" placeholder="https://…" />
      </SmallField>
      <div className="flex items-center gap-2">
        <FormFooter error={error} pending={pending} disabled={false} onSave={submit} />
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex h-11 items-center px-3 text-sm text-[var(--fg-muted)] hover:text-[var(--fg)]"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function ProofLinks({ proof, doc, proofLabel }: { proof: string | null; doc: string | null; proofLabel: string }) {
  if (!proof && !doc) return null;
  return (
    <p className="mt-1 flex flex-wrap gap-x-3 text-xs">
      {proof && (
        <a
          href={proof}
          target="_blank"
          rel="noopener noreferrer nofollow ugc"
          className="inline-flex items-center gap-1 font-semibold text-[var(--accent-text)] hover:underline"
        >
          <ExternalLink className="h-3 w-3" aria-hidden />
          {proofLabel}
        </a>
      )}
      {doc && (
        <a
          href={doc}
          target="_blank"
          rel="noopener noreferrer nofollow ugc"
          className="inline-flex items-center gap-1 font-semibold text-[var(--accent-text)] hover:underline"
        >
          <FileText className="h-3 w-3" aria-hidden />
          Document
        </a>
      )}
    </p>
  );
}

function FormShell({ title, onCancel, children }: { title: string; onCancel: () => void; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-[var(--accent)]/30 bg-[var(--accent-soft)] p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-[var(--accent-text)]">{title}</p>
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex h-11 items-center px-2 text-sm text-[var(--fg-muted)] hover:text-[var(--fg)]"
        >
          Cancel
        </button>
      </div>
      {children}
    </div>
  );
}

function FormFooter({
  error,
  pending,
  disabled,
  onSave,
}: {
  error: string | null;
  pending: boolean;
  disabled: boolean;
  onSave: () => void;
}) {
  return (
    <>
      {error && (
        <p role="alert" className="text-xs text-[var(--danger)]">
          {error}
        </p>
      )}
      <button
        type="button"
        onClick={onSave}
        disabled={pending || disabled}
        className="press-shrink inline-flex h-11 items-center gap-1.5 rounded-full bg-[var(--accent)] px-5 text-sm font-semibold text-[var(--fg-on-accent)] hover:bg-[var(--accent-hover)] disabled:opacity-40"
      >
        {pending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
        Save
      </button>
    </>
  );
}

function AddButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="press-shrink inline-flex h-11 items-center gap-1.5 rounded-full border border-[var(--border-strong)] bg-[var(--surface-1)] px-4 text-sm font-semibold text-[var(--fg)] hover:bg-[var(--surface-2)]"
    >
      <Plus className="h-4 w-4" aria-hidden />
      {label}
    </button>
  );
}

function IconButton({
  label,
  onClick,
  disabled,
  danger,
  pressed,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  pressed?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-pressed={pressed}
      className={`press-shrink inline-flex h-11 w-11 items-center justify-center rounded-full text-[var(--fg-subtle)] hover:bg-[var(--surface-1)] disabled:opacity-40 ${
        danger ? "hover:text-[var(--danger)]" : "hover:text-[var(--fg)]"
      }`}
    >
      {children}
    </button>
  );
}

function SmallField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[13px] font-semibold text-[var(--fg)] block mb-1.5">{label}</span>
      {children}
    </label>
  );
}

function Input({
  value,
  onChange,
  type = "text",
  placeholder,
  min,
  max,
}: {
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  min?: number;
  max?: number;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      min={min}
      max={max}
      className="w-full h-11 rounded-xl border border-[var(--border-strong)] bg-[var(--surface-1)] px-3.5 text-sm text-[var(--fg)] placeholder:text-[var(--fg-subtle)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
    />
  );
}

function formatYearRange(start: number | null, end: number | null): string {
  if (start && end) return `${start} to ${end}`;
  if (start && !end) return `${start} to now`;
  if (!start && end) return `${end}`;
  return "";
}

function formatCertDates(issued: string | null, expires: string | null): string {
  const fmt = (s: string) => new Date(s).toLocaleString(undefined, { month: "short", year: "numeric" });
  if (issued && expires) return `${fmt(issued)}, expires ${fmt(expires)}`;
  if (issued) return `Issued ${fmt(issued)}`;
  if (expires) return `Expires ${fmt(expires)}`;
  return "";
}
