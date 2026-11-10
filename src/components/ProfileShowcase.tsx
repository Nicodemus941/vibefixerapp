import { Award, ExternalLink, FileText, GraduationCap, Target, Trophy } from "lucide-react";
import { FEATURED_KIND_LABEL, bioTokens, hostLabel } from "@/lib/profile-showcase";
import type {
  AchievementRow,
  CertificationRow,
  EducationRow,
  FeaturedRow,
  GoalRow,
} from "@/lib/profile-showcase-data";

// Read only renderers for the profile showcase, shared by /u/[id] and the
// public card /c/[id]. Server components; no client JS.

// Every member supplied link opens in a new tab and carries no ranking or
// referrer weight.
export const UGC_REL = "noopener noreferrer nofollow ugc";

function monthYear(s: string): string {
  return new Date(`${s}T00:00:00Z`).toLocaleString("en-US", { month: "short", year: "numeric", timeZone: "UTC" });
}

// Plain text with http(s) and www links made clickable. Text is rendered
// through React (escaped), never as HTML.
export function LinkifiedText({ text, className }: { text: string; className?: string }) {
  const tokens = bioTokens(text);
  return (
    <p className={className}>
      {tokens.map((t, i) =>
        t.type === "text" ? (
          <span key={i}>{t.value}</span>
        ) : (
          <a
            key={i}
            href={t.href}
            target="_blank"
            rel={UGC_REL}
            className="font-medium text-[var(--accent-text)] underline underline-offset-2 hover:no-underline break-all"
          >
            {t.label}
          </a>
        ),
      )}
    </p>
  );
}

export function FeaturedCards({ items, compact = false }: { items: FeaturedRow[]; compact?: boolean }) {
  return (
    <ul className={`grid gap-3 ${compact ? "" : "sm:grid-cols-2"}`}>
      {items.map((f) => {
        const source = f.publisher ?? hostLabel(f.url);
        return (
          <li key={f.id}>
            <a
              href={f.url}
              target="_blank"
              rel={UGC_REL}
              className="group flex h-full flex-col overflow-hidden rounded-[var(--r-md)] border border-[var(--border)] bg-[var(--surface-1)] hover:border-[var(--border-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            >
              {f.image_url && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={f.image_url}
                  alt=""
                  loading="lazy"
                  referrerPolicy="no-referrer"
                  className="aspect-[1.91/1] w-full border-b border-[var(--border)] bg-[var(--surface-2)] object-cover"
                />
              )}
              <div className="flex flex-1 flex-col p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="chip chip-neutral">{FEATURED_KIND_LABEL[f.kind]}</span>
                  {f.published_on && (
                    <span className="text-xs text-[var(--fg-subtle)]">{monthYear(f.published_on)}</span>
                  )}
                </div>
                <p className="mt-2 font-semibold text-[15px] leading-snug break-words group-hover:underline underline-offset-2">
                  {f.title}
                </p>
                {f.description && (
                  <p className="mt-1 text-[13px] leading-relaxed text-[var(--fg-muted)] line-clamp-3 break-words">
                    {f.description}
                  </p>
                )}
                <p className="mt-auto pt-3 inline-flex items-center gap-1 text-xs text-[var(--fg-subtle)] break-all">
                  <ExternalLink className="h-3 w-3 shrink-0" aria-hidden />
                  {source}
                  <span className="sr-only">(opens in a new tab)</span>
                </p>
              </div>
            </a>
          </li>
        );
      })}
    </ul>
  );
}

export function GoalsList({ items }: { items: GoalRow[] }) {
  return (
    <ul className="space-y-3">
      {items.map((g, i) => (
        <li
          key={g.id}
          className={`flex items-start gap-3 ${i > 0 ? "border-t border-[var(--border)] pt-3" : ""}`}
        >
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent-text)]">
            <Target className="h-4 w-4" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="text-[15px] font-semibold leading-snug break-words">{g.statement}</p>
            {g.target_date && (
              <p className="mt-0.5 text-[13px] text-[var(--fg-subtle)]">By {monthYear(g.target_date)}</p>
            )}
            {g.help_text && (
              <p className="mt-1 text-[13px] text-[var(--fg-muted)] break-words">
                <span className="font-semibold text-[var(--fg)]">How you can help: </span>
                {g.help_text}
              </p>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}

export function AchievementsList({ items }: { items: AchievementRow[] }) {
  return (
    <ul>
      {items.map((a, i) => (
        <li
          key={a.id}
          className={`flex items-start gap-3.5 py-4 ${i > 0 ? "border-t border-[var(--border)]" : "pt-0"}`}
        >
          <div className="h-11 w-11 shrink-0 rounded-[10px] bg-[var(--surface-2)] text-[var(--fg-muted)] flex items-center justify-center">
            <Trophy className="h-5 w-5" aria-hidden />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-[15px] break-words">{a.title}</p>
            {(a.issuer || a.achieved_on) && (
              <p className="text-[13px] text-[var(--fg-subtle)] break-words">
                {[a.issuer, a.achieved_on ? monthYear(a.achieved_on) : null].filter(Boolean).join(" · ")}
              </p>
            )}
            {a.description && (
              <p className="mt-2 text-[13px] text-[var(--fg-muted)] whitespace-pre-wrap break-words">{a.description}</p>
            )}
            {a.proof_url && (
              <a
                href={a.proof_url}
                target="_blank"
                rel={UGC_REL}
                className="mt-1 inline-flex min-h-11 items-center gap-1 text-[13px] font-semibold text-[var(--accent-text)] hover:underline"
              >
                <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                See proof
                <span className="sr-only">for {a.title} (opens in a new tab)</span>
              </a>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}

function ProofRow({
  proof,
  proofLabel,
  doc,
  subject,
}: {
  proof: string | null;
  proofLabel: string;
  doc: string | null;
  subject: string;
}) {
  if (!proof && !doc) return null;
  return (
    <p className="mt-1 flex flex-wrap gap-x-4">
      {proof && (
        <a
          href={proof}
          target="_blank"
          rel={UGC_REL}
          className="inline-flex min-h-11 items-center gap-1 text-[13px] font-semibold text-[var(--accent-text)] hover:underline"
        >
          <ExternalLink className="h-3.5 w-3.5" aria-hidden />
          {proofLabel}
          <span className="sr-only">for {subject} (opens in a new tab)</span>
        </a>
      )}
      {doc && (
        <a
          href={doc}
          target="_blank"
          rel={UGC_REL}
          className="inline-flex min-h-11 items-center gap-1 text-[13px] font-semibold text-[var(--accent-text)] hover:underline"
        >
          <FileText className="h-3.5 w-3.5" aria-hidden />
          Document
          <span className="sr-only">for {subject} (opens in a new tab)</span>
        </a>
      )}
    </p>
  );
}

export function CredentialsList({
  education,
  certifications,
}: {
  education: EducationRow[];
  certifications: CertificationRow[];
}) {
  return (
    <ul>
      {education.map((e, i) => (
        <li
          key={e.id}
          className={`flex items-start gap-3.5 py-4 ${i > 0 ? "border-t border-[var(--border)]" : "pt-0"}`}
        >
          <div className="h-11 w-11 shrink-0 rounded-[10px] bg-[var(--surface-2)] text-[var(--fg-muted)] flex items-center justify-center">
            <GraduationCap className="h-5 w-5" aria-hidden />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-[15px] break-words">{e.school_name}</p>
            {(e.degree || e.field_of_study) && (
              <p className="text-[13px] break-words">{[e.degree, e.field_of_study].filter(Boolean).join(", ")}</p>
            )}
            <p className="mt-0.5 text-[13px] text-[var(--fg-subtle)]">
              {e.start_year && e.end_year
                ? `${e.start_year} to ${e.end_year}`
                : e.start_year
                ? `${e.start_year} to now`
                : e.end_year ?? ""}
            </p>
            {e.description && (
              <p className="mt-2 text-[13px] text-[var(--fg-muted)] whitespace-pre-wrap">{e.description}</p>
            )}
            <ProofRow proof={e.proof_url} proofLabel="Verify" doc={e.document_url} subject={e.school_name} />
          </div>
        </li>
      ))}
      {certifications.map((c, i) => (
        <li
          key={c.id}
          className={`flex items-start gap-3.5 py-4 ${
            i > 0 || education.length > 0 ? "border-t border-[var(--border)]" : "pt-0"
          }`}
        >
          <div className="h-11 w-11 shrink-0 rounded-[10px] bg-[var(--accent-soft)] text-[var(--accent-text)] flex items-center justify-center">
            <Award className="h-5 w-5" aria-hidden />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-[15px] break-words">{c.name}</p>
            {c.issuer && <p className="text-[13px] break-words">{c.issuer}</p>}
            <p className="mt-0.5 text-[13px] text-[var(--fg-subtle)]">
              {c.issued_date && c.expires_date
                ? `Issued ${monthYear(c.issued_date)} · expires ${monthYear(c.expires_date)}`
                : c.issued_date
                ? `Issued ${monthYear(c.issued_date)}`
                : ""}
            </p>
            <ProofRow proof={c.credential_url} proofLabel="View credential" doc={c.document_url} subject={c.name} />
          </div>
        </li>
      ))}
    </ul>
  );
}
