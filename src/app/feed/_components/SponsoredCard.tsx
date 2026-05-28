import Link from "next/link";
import { Building2, ExternalLink } from "lucide-react";
import { pickSponsoredCard } from "@/app/ads/actions";

// Server component that fetches one sponsored card targeted to the
// viewer and fires the impression event as part of the same request.
// Rendered nowhere if no eligible ad is available — silent no-op.
export async function SponsoredCard() {
  const ad = await pickSponsoredCard();
  if (!ad) return null;

  return (
    <article className="rounded-2xl border border-violet-400/30 bg-violet-400/[0.04] p-4 sm:p-5">
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="font-mono text-[9px] uppercase tracking-wider text-violet-300/80 inline-flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-violet-400" />
          Sponsored
        </span>
        {ad.organization_slug && (
          <Link
            href={`/o/${ad.organization_slug}`}
            className="font-mono text-[10px] text-violet-300/80 hover:text-violet-200 truncate"
          >
            {ad.organization_name}
          </Link>
        )}
      </div>
      <header className="flex items-start gap-3">
        <div className="h-10 w-10 shrink-0 rounded-xl bg-[var(--surface-3)] flex items-center justify-center text-[var(--fg-muted)] overflow-hidden">
          {ad.organization_logo_url ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={ad.organization_logo_url} alt="" className="h-full w-full object-cover" />
          ) : (
            <Building2 className="h-4 w-4" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-[var(--fg)] break-words">{ad.headline}</p>
        </div>
      </header>
      {ad.creative_url && (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img src={ad.creative_url} alt="" className="mt-3 rounded-xl border border-[var(--border)] max-h-56 w-full object-cover" />
      )}
      <p className="mt-3 text-sm text-[var(--fg)] whitespace-pre-wrap break-words leading-relaxed">
        {ad.body}
      </p>
      <a
        href={`/api/ads/click/${ad.id}`}
        target="_blank"
        rel="noopener noreferrer sponsored"
        className="press-shrink mt-4 inline-flex items-center gap-1.5 rounded-full bg-violet-500 px-4 py-2 text-sm font-medium text-white hover:brightness-110"
      >
        {ad.cta_label}
        <ExternalLink className="h-3.5 w-3.5" />
      </a>
    </article>
  );
}
