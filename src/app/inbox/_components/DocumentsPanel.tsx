"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FileText,
  Loader2,
  Plus,
  ShieldCheck,
  X,
} from "lucide-react";
import {
  createDocument,
  type DocumentRow,
} from "@/app/documents/actions";

function statusPill(s: DocumentRow["status"]) {
  switch (s) {
    case "draft":
      return "border-[var(--border-strong)] text-[var(--fg-muted)] bg-white/[0.02]";
    case "signed":
      return "border-[var(--accent)]/40 text-[var(--accent)] bg-[var(--accent)]/10";
    case "amended":
      return "border-sky-400/40 text-sky-400 bg-sky-400/10";
    case "void":
      return "border-[var(--danger)]/40 text-[var(--danger)] bg-[var(--danger)]/10";
  }
}

function kindIcon(k: DocumentRow["kind"]) {
  if (k === "nda") return ShieldCheck;
  return FileText;
}

function kindLabel(k: DocumentRow["kind"]) {
  if (k === "nda") return "NDA";
  if (k === "contract") return "CONTRACT";
  return "AMENDMENT";
}

export function DocumentsPanel({
  conversationId,
  counterpartyId,
  initial,
}: {
  conversationId: string;
  counterpartyId: string;
  initial: DocumentRow[];
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function create(
    kind: "nda" | "contract",
    source: "loop_template" | "custom_text" | "upload",
  ) {
    setError(null);
    startTransition(async () => {
      const r = await createDocument({
        conversationId,
        counterpartyId,
        kind,
        source,
      });
      if (r.error) setError(r.error);
      else if (r.documentId) {
        setOpen(false);
        router.push(`/d/${r.documentId}`);
      }
    });
  }

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] p-4">
      <div className="flex items-center justify-between gap-3 mb-3">
        <p className="text-sm font-medium text-[var(--fg)] flex items-center gap-1.5">
          <FileText className="h-4 w-4 text-[var(--fg-muted)]" />
          Documents
        </p>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="press-shrink inline-flex items-center gap-1.5 rounded-full border border-[var(--border-strong)] bg-white/[0.02] px-3 py-1.5 text-xs text-[var(--fg-muted)] hover:bg-white/[0.05] hover:text-[var(--fg)]"
        >
          {open ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
          {open ? "Close" : "New"}
        </button>
      </div>

      {open && (
        <div className="mb-4 space-y-2 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--fg-subtle)]">
            Pick a starting point
          </p>
          <div className="grid grid-cols-2 gap-2">
            <DocChoice
              icon={<ShieldCheck className="h-3.5 w-3.5" />}
              label="Loop NDA"
              hint="Mutual, 2-year"
              disabled={pending}
              onClick={() => create("nda", "loop_template")}
            />
            <DocChoice
              icon={<ShieldCheck className="h-3.5 w-3.5" />}
              label="Custom NDA"
              hint="Edit text"
              disabled={pending}
              onClick={() => create("nda", "custom_text")}
            />
            <DocChoice
              icon={<FileText className="h-3.5 w-3.5" />}
              label="Loop contract"
              hint="Editable fields"
              disabled={pending}
              onClick={() => create("contract", "loop_template")}
            />
            <DocChoice
              icon={<FileText className="h-3.5 w-3.5" />}
              label="Upload PDF/doc"
              hint="Attach file"
              disabled={pending}
              onClick={() => create("contract", "upload")}
            />
          </div>
          {pending && (
            <p className="text-xs text-[var(--fg-muted)] flex items-center gap-1.5">
              <Loader2 className="h-3 w-3 animate-spin" />
              Creating…
            </p>
          )}
        </div>
      )}

      {initial.length === 0 ? (
        <p className="text-xs text-[var(--fg-subtle)]">
          No documents yet. NDAs and contracts you share with this person live here.
        </p>
      ) : (
        <ul className="space-y-2">
          {initial.map((d) => {
            const Icon = kindIcon(d.kind);
            return (
              <li key={d.id}>
                <Link
                  href={`/d/${d.id}`}
                  className="press-shrink flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--bg)] p-3 hover:border-[var(--border-strong)] transition-colors"
                >
                  <Icon className="h-4 w-4 shrink-0 text-[var(--fg-muted)]" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-[var(--fg)] truncate">{d.title}</p>
                    <p className="font-mono text-[10px] text-[var(--fg-subtle)]">
                      {kindLabel(d.kind)} ·{" "}
                      {new Date(d.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border ${statusPill(d.status)}`}
                  >
                    {d.status}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      {error && <p className="mt-2 text-xs text-[var(--danger)]">{error}</p>}
    </div>
  );
}

function DocChoice({
  icon,
  label,
  hint,
  onClick,
  disabled,
}: {
  icon: React.ReactNode;
  label: string;
  hint: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="press-shrink flex flex-col items-start gap-1 rounded-xl border border-[var(--border)] bg-[var(--bg)] p-3 text-left hover:border-[var(--border-strong)] disabled:opacity-50 transition-colors"
    >
      <span className="text-[var(--fg-muted)] flex items-center gap-1.5 text-sm text-[var(--fg)]">
        {icon}
        {label}
      </span>
      <span className="font-mono text-[10px] text-[var(--fg-subtle)]">{hint}</span>
    </button>
  );
}
