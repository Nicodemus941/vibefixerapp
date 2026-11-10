import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Briefcase, MessageSquare, Star } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/Avatar";
import { CoverBand } from "@/components/CoverBand";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchCoverUrl } from "@/lib/covers";
import { FeedHeader } from "@/app/feed/_components/FeedHeader";
import { PublicHeader } from "@/components/PublicHeader";
import { ShareButton } from "@/components/ShareButton";
import { fetchPublicProvider } from "@/app/discover/actions";

export const dynamic = "force-dynamic";

const UUID_RX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ userId: string }>;
}): Promise<Metadata> {
  const { userId } = await params;
  if (!UUID_RX.test(userId)) return { title: "Card not found · Loop" };
  const card = await fetchPublicProvider(userId);
  if (!card) return { title: "Card not found · Loop" };
  const role = card.current_position_title
    ? card.current_position_org_name
      ? `${card.current_position_title} at ${card.current_position_org_name}`
      : card.current_position_title
    : card.company_name ?? "Founder on Loop";
  const title = `${card.display_name} · ${role}`;
  const description = card.bio
    ? card.bio.length > 160
      ? `${card.bio.slice(0, 157).trim()}…`
      : card.bio
    : `${card.display_name} is on Loop with ${card.offers.length} active offer${card.offers.length === 1 ? "" : "s"}.`;
  return {
    title,
    description,
    alternates: { canonical: `/c/${userId}` },
    openGraph: {
      title,
      description,
      type: "profile",
      url: `https://loopfounders.com/c/${userId}`,
      images: card.avatar_url ? [{ url: card.avatar_url }] : undefined,
    },
    twitter: { card: "summary", title, description },
  };
}

function formatPrice(min: number | null, max: number | null, model: string | null): string {
  const fmt = (n: number) => (n >= 1000 ? `$${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k` : `$${n}`);
  const range =
    min && max ? `${fmt(min)} to ${fmt(max)}` :
    min ? `From ${fmt(min)}` :
    max ? `up to ${fmt(max)}` : "";
  return [range, model === "revshare" ? "Revenue share" : model ? model[0].toUpperCase() + model.slice(1) : null].filter(Boolean).join(" · ");
}

export default async function PublicCardPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  if (!UUID_RX.test(userId)) notFound();
  const card = await fetchPublicProvider(userId);
  if (!card) notFound();

  const supabase = await createClient();
  const [
    {
      data: { user },
    },
    coverUrl,
  ] = await Promise.all([
    supabase.auth.getUser(),
    fetchCoverUrl(createAdminClient(), "profiles", userId),
  ]);
  const { data: viewerProfile } = user
    ? await supabase
        .from("profiles")
        .select("display_name, role")
        .eq("id", user.id)
        .maybeSingle()
    : { data: null };

  const role = card.current_position_title
    ? card.current_position_org_name
      ? `${card.current_position_title} at ${card.current_position_org_name}`
      : card.current_position_title
    : card.company_name;

  const personLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: card.display_name,
    url: `https://loopfounders.com/c/${userId}`,
    image: card.avatar_url ?? undefined,
    description: card.bio ?? undefined,
    jobTitle: card.current_position_title ?? undefined,
    worksFor: card.current_position_org_name
      ? {
          "@type": "Organization",
          name: card.current_position_org_name,
          url: card.current_position_org_slug
            ? `https://loopfounders.com/o/${card.current_position_org_slug}`
            : undefined,
        }
      : undefined,
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--fg)]">
      {user ? (
        <FeedHeader
          displayName={viewerProfile?.display_name ?? "founder"}
          role={viewerProfile?.role ?? "user"}
        />
      ) : (
        <PublicHeader nextPath={`/c/${userId}`} />
      )}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personLd) }}
      />
      <main className="mx-auto max-w-xl px-4 sm:px-6 py-6 sm:py-10 space-y-6">
        <section className="surface-card overflow-hidden">
          <CoverBand url={coverUrl} alt={`${card.display_name} cover image`} className="h-28 sm:h-36" />
          <div className="px-5 sm:px-6 pb-5 sm:pb-6">
          <div className="-mt-12 flex flex-col gap-3">
            <Avatar
              name={card.display_name}
              url={card.avatar_url}
              size="2xl"
              className="ring-4 ring-[var(--surface-1)]"
            />
            <div className="min-w-0">
              <h1 className="text-[26px] font-bold leading-tight tracking-[-0.025em] break-words">
                {card.display_name}
              </h1>
              {role && (
                <p className="mt-1 text-[15px] text-[var(--fg)] break-words">
                  {card.current_position_org_slug && card.current_position_title ? (
                    <>
                      {card.current_position_title}
                      {" at "}
                      <Link
                        href={`/o/${card.current_position_org_slug}`}
                        className="hover:underline underline-offset-2"
                      >
                        {card.current_position_org_name}
                      </Link>
                    </>
                  ) : (
                    role
                  )}
                </p>
              )}
              {card.industry && (
                <p className="mt-1 text-[13px] text-[var(--fg-subtle)]">{card.industry}</p>
              )}
              {card.review_count > 0 && (
                <p className="mt-2 inline-flex items-center gap-1.5 text-[13px] text-[var(--fg-muted)]">
                  <Star className="h-4 w-4 fill-[var(--star)] text-[var(--star)]" aria-hidden />
                  <span className="num">{card.review_count}</span> review{card.review_count === 1 ? "" : "s"} · reputation{" "}
                  <span className="num">{card.reputation_score.toFixed(0)}</span>
                </p>
              )}
            </div>
          </div>
          {card.bio && (
            <p className="mt-4 text-[15px] text-[var(--fg)] leading-relaxed whitespace-pre-wrap break-words">
              {card.bio}
            </p>
          )}
          <div className="mt-5 flex flex-wrap gap-2 border-t border-[var(--border)] pt-4">
            {user ? (
              <Link
                href={`/u/${userId}`}
                className="press-shrink inline-flex items-center gap-1.5 rounded-full bg-[var(--accent)] h-11 px-5 text-sm font-semibold text-[var(--fg-on-accent)] hover:bg-[var(--accent-hover)]"
              >
                <MessageSquare className="h-4 w-4" aria-hidden />
                Reach out on Loop
              </Link>
            ) : (
              <Link
                href={`/login?next=/u/${userId}`}
                className="press-shrink inline-flex items-center gap-1.5 rounded-full bg-[var(--accent)] h-11 px-5 text-sm font-semibold text-[var(--fg-on-accent)] hover:bg-[var(--accent-hover)]"
              >
                <MessageSquare className="h-4 w-4" aria-hidden />
                Sign in to reach out
              </Link>
            )}
            <ShareButton
              url={`/c/${userId}`}
              title={`${card.display_name} on Loop`}
              text={card.bio ?? `${card.display_name} is on Loop.`}
              variant="ghost"
            />
          </div>
          </div>
        </section>

        {card.offers.length > 0 && (
          <section className="space-y-3">
            <h2 className="eyebrow flex items-center gap-2 px-1">
              <Briefcase className="h-3.5 w-3.5" aria-hidden />
              What I offer
            </h2>
            <ul className="space-y-2">
              {card.offers.map((o) => (
                <li key={o.id} className="surface-card p-4">
                  {o.category && <span className="chip chip-offer">{o.category}</span>}
                  <p className="mt-2 font-semibold text-[15px] text-[var(--fg)] break-words">{o.title}</p>
                  {formatPrice(o.price_min, o.price_max, o.pricing_model) && (
                    <p className="mt-2">
                      <span className="chip chip-neutral num">
                        {formatPrice(o.price_min, o.price_max, o.pricing_model)}
                      </span>
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="rounded-[var(--r-lg)] border border-dashed border-[var(--border-strong)] p-5 text-center">
          <p className="text-sm text-[var(--fg-muted)]">
            Loop is a free network for people who build. Everyone gives as well as gets.
          </p>
          {!user && (
            <Link
              href="/login?next=/discover"
              className="press-shrink mt-3 inline-flex items-center gap-1.5 rounded-full bg-[var(--accent)] h-11 px-5 text-sm font-semibold text-[var(--fg-on-accent)] hover:bg-[var(--accent-hover)]"
            >
              Join Loop free
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          )}
        </section>
      </main>
    </div>
  );
}
