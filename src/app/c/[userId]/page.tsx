import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Briefcase, MessageSquare, Star } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/Avatar";
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
  const title = `${card.display_name} — ${role}`;
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
    min && max ? `${fmt(min)}–${fmt(max)}` :
    min ? `${fmt(min)}+` :
    max ? `up to ${fmt(max)}` : "";
  return [range, model].filter(Boolean).join(" · ");
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
  const {
    data: { user },
  } = await supabase.auth.getUser();
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
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] p-5 sm:p-6">
          <div className="flex items-start gap-4 flex-wrap sm:flex-nowrap">
            <Avatar name={card.display_name} url={card.avatar_url} size="xl" />
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl font-semibold tracking-tight break-words">
                {card.display_name}
              </h1>
              {role && (
                <p className="mt-1 text-sm text-[var(--fg-muted)] break-words">
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
                <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--fg-subtle)] mt-1">
                  {card.industry}
                </p>
              )}
              {card.review_count > 0 && (
                <p className="mt-1.5 inline-flex items-center gap-1 text-xs text-[var(--fg-muted)] tabular-nums">
                  <Star className="h-3.5 w-3.5" />
                  {card.review_count} review{card.review_count === 1 ? "" : "s"} · reputation {card.reputation_score.toFixed(0)}
                </p>
              )}
            </div>
          </div>
          {card.bio && (
            <p className="mt-4 text-sm text-[var(--fg)] leading-relaxed whitespace-pre-wrap break-words">
              {card.bio}
            </p>
          )}
          <div className="mt-5 flex flex-wrap gap-2 border-t border-[var(--border)] pt-4">
            {user ? (
              <Link
                href={`/u/${userId}`}
                className="press-shrink inline-flex items-center gap-1.5 rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--bg)] hover:brightness-110"
              >
                <MessageSquare className="h-3.5 w-3.5" />
                Reach out on Loop
              </Link>
            ) : (
              <Link
                href={`/login?next=/u/${userId}`}
                className="press-shrink inline-flex items-center gap-1.5 rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-medium text-[var(--bg)] hover:brightness-110"
              >
                <MessageSquare className="h-3.5 w-3.5" />
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
        </section>

        {card.offers.length > 0 && (
          <section className="space-y-3">
            <p className="eyebrow flex items-center gap-2">
              <Briefcase className="h-3.5 w-3.5" />
              Active offers
            </p>
            <ul className="space-y-2">
              {card.offers.map((o) => (
                <li
                  key={o.id}
                  className="rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] p-4"
                >
                  <p className="font-medium text-[var(--fg)] break-words">{o.title}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[10px] uppercase tracking-wider text-[var(--fg-subtle)]">
                    <span>{o.category}</span>
                    {formatPrice(o.price_min, o.price_max, o.pricing_model) && (
                      <span>· {formatPrice(o.price_min, o.price_max, o.pricing_model)}</span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface-1)]/40 p-5 text-center">
          <p className="text-sm text-[var(--fg-muted)]">
            Loop is a reciprocal marketplace — every founder gives as well as gets.
          </p>
          {!user && (
            <Link
              href="/login?next=/discover"
              className="press-shrink mt-3 inline-flex items-center gap-1.5 rounded-full bg-[var(--accent)] px-3.5 py-1.5 text-xs font-medium text-[var(--bg)] hover:brightness-110"
            >
              Join Loop
              <ArrowRight className="h-3 w-3" />
            </Link>
          )}
        </section>
      </main>
    </div>
  );
}
