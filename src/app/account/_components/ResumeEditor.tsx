"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Award, GraduationCap, Loader2, Plus, Trash2 } from "lucide-react";
import {
  addCertification,
  addEducation,
  deleteCertification,
  deleteEducation,
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
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="press-shrink inline-flex items-center gap-1.5 rounded-full border border-[var(--border-strong)] bg-white/[0.02] px-3.5 py-2 text-sm text-[var(--fg)] hover:bg-white/[0.05]"
        >
          <Plus className="h-4 w-4" />
          Add education
        </button>
      )}
    </div>
  );
}

function EducationItem({ row, onDelete }: { row: EducationRow; onDelete: () => void }) {
  const [pending, startTransition] = useTransition();

  function remove() {
    if (!confirm("Remove this education entry?")) return;
    startTransition(async () => {
      const r = await deleteEducation(row.id);
      if (!r.error) onDelete();
    });
  }

  return (
    <li className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3 flex items-start gap-3">
      <GraduationCap className="h-4 w-4 mt-0.5 shrink-0 text-[var(--fg-subtle)]" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[var(--fg)] break-words">{row.school_name}</p>
        {(row.degree || row.field_of_study) && (
          <p className="text-xs text-[var(--fg-muted)] break-words">
            {[row.degree, row.field_of_study].filter(Boolean).join(", ")}
          </p>
        )}
        <p className="font-mono text-[10px] text-[var(--fg-subtle)] mt-0.5 tabular-nums">
          {formatYearRange(row.start_year, row.end_year)}
        </p>
      </div>
      <button
        type="button"
        onClick={remove}
        disabled={pending}
        aria-label="Remove education"
        className="press-shrink inline-flex items-center justify-center h-8 w-8 rounded-full text-[var(--fg-subtle)] hover:bg-white/[0.04] hover:text-[var(--danger)]"
      >
        {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
      </button>
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
      });
      if (r.error) {
        setError(r.error);
        return;
      }
      onAdded({
        id: crypto.randomUUID(),
        school_name: schoolName.trim(),
        degree: degree.trim() || null,
        field_of_study: field.trim() || null,
        start_year: startYear ? Number(startYear) : null,
        end_year: endYear ? Number(endYear) : null,
        description: description.trim() || null,
      });
    });
  }

  return (
    <div className="rounded-2xl border border-[var(--accent)]/30 bg-[var(--accent)]/[0.04] p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--accent)]">
          Add education
        </p>
        <button type="button" onClick={onCancel} className="text-xs text-[var(--fg-subtle)] hover:text-[var(--fg)]">
          Cancel
        </button>
      </div>
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
      {error && <p className="text-xs text-[var(--danger)]">{error}</p>}
      <button
        type="button"
        onClick={submit}
        disabled={pending || !schoolName.trim()}
        className="press-shrink inline-flex items-center gap-1.5 rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--bg)] hover:brightness-110 disabled:opacity-40"
      >
        {pending && <Loader2 className="h-4 w-4 animate-spin" />}
        Save
      </button>
    </div>
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
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="press-shrink inline-flex items-center gap-1.5 rounded-full border border-[var(--border-strong)] bg-white/[0.02] px-3.5 py-2 text-sm text-[var(--fg)] hover:bg-white/[0.05]"
        >
          <Plus className="h-4 w-4" />
          Add certification
        </button>
      )}
    </div>
  );
}

function CertItem({ row, onDelete }: { row: CertificationRow; onDelete: () => void }) {
  const [pending, startTransition] = useTransition();

  function remove() {
    if (!confirm("Remove this certification?")) return;
    startTransition(async () => {
      const r = await deleteCertification(row.id);
      if (!r.error) onDelete();
    });
  }

  return (
    <li className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3 flex items-start gap-3">
      <Award className="h-4 w-4 mt-0.5 shrink-0 text-[var(--fg-subtle)]" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[var(--fg)] break-words">{row.name}</p>
        {row.issuer && (
          <p className="text-xs text-[var(--fg-muted)] break-words">{row.issuer}</p>
        )}
        <p className="font-mono text-[10px] text-[var(--fg-subtle)] mt-0.5 tabular-nums">
          {formatCertDates(row.issued_date, row.expires_date)}
        </p>
        {row.credential_url && (
          <a
            href={row.credential_url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-[10px] text-[var(--accent)] hover:underline break-all"
          >
            Credential
          </a>
        )}
      </div>
      <button
        type="button"
        onClick={remove}
        disabled={pending}
        aria-label="Remove certification"
        className="press-shrink inline-flex items-center justify-center h-8 w-8 rounded-full text-[var(--fg-subtle)] hover:bg-white/[0.04] hover:text-[var(--danger)]"
      >
        {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
      </button>
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
  const [credentialId, setCredentialId] = useState("");
  const [credentialUrl, setCredentialUrl] = useState("");
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
        credentialId: credentialId || null,
        credentialUrl: credentialUrl || null,
        description: null,
      });
      if (r.error) {
        setError(r.error);
        return;
      }
      onAdded({
        id: crypto.randomUUID(),
        name: name.trim(),
        issuer: issuer.trim() || null,
        issued_date: issuedDate || null,
        expires_date: expiresDate || null,
        credential_id: credentialId.trim() || null,
        credential_url: credentialUrl.trim() || null,
        description: null,
      });
    });
  }

  return (
    <div className="rounded-2xl border border-[var(--accent)]/30 bg-[var(--accent)]/[0.04] p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--accent)]">
          Add certification
        </p>
        <button type="button" onClick={onCancel} className="text-xs text-[var(--fg-subtle)] hover:text-[var(--fg)]">
          Cancel
        </button>
      </div>
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
      <SmallField label="Credential URL (optional)">
        <Input value={credentialUrl} onChange={setCredentialUrl} type="url" placeholder="https://…" />
      </SmallField>
      {error && <p className="text-xs text-[var(--danger)]">{error}</p>}
      <button
        type="button"
        onClick={submit}
        disabled={pending || !name.trim()}
        className="press-shrink inline-flex items-center gap-1.5 rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--bg)] hover:brightness-110 disabled:opacity-40"
      >
        {pending && <Loader2 className="h-4 w-4 animate-spin" />}
        Save
      </button>
    </div>
  );
}

function SmallField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--fg-subtle)] block mb-1.5">
        {label}
      </span>
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
      className="w-full h-10 rounded-xl border border-[var(--border-strong)] bg-[var(--surface-2)] px-3.5 text-sm text-[var(--fg)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
    />
  );
}

function formatYearRange(start: number | null, end: number | null): string {
  if (start && end) return `${start} — ${end}`;
  if (start && !end) return `${start} — Present`;
  if (!start && end) return `${end}`;
  return "—";
}

function formatCertDates(issued: string | null, expires: string | null): string {
  const fmt = (s: string) => new Date(s).toLocaleString(undefined, { month: "short", year: "numeric" });
  if (issued && expires) return `${fmt(issued)} — expires ${fmt(expires)}`;
  if (issued) return `Issued ${fmt(issued)}`;
  if (expires) return `Expires ${fmt(expires)}`;
  return "—";
}
