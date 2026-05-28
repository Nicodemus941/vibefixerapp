import { redirect } from "next/navigation";
import Link from "next/link";
import { Download, Settings } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { FeedHeader } from "../feed/_components/FeedHeader";
import { AvatarUploader } from "./_components/AvatarUploader";
import { ProfileForm } from "./_components/ProfileForm";
import { NotificationPrefsForm } from "./_components/NotificationPrefsForm";
import { DangerZone } from "./_components/DangerZone";
import { StripeConnectSection } from "./_components/StripeConnectSection";
import { fetchStripeConnectStatus } from "../stripe/actions";
import type { NotificationPrefs } from "./actions";

export const dynamic = "force-dynamic";

const DEFAULT_PREFS: NotificationPrefs = {
  new_match: true,
  new_message: true,
  new_reaction: true,
  match_accepted: true,
  new_comment: true,
  new_document: true,
  document_signed: true,
  new_review: true,
  email_digest: "off",
};

export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/account");

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "display_name, bio, company_name, company_url, industry, revenue_band, avatar_url, role, notification_prefs",
    )
    .eq("id", user.id)
    .maybeSingle();

  const prefs: NotificationPrefs = {
    ...DEFAULT_PREFS,
    ...((profile?.notification_prefs as Partial<NotificationPrefs> | null) ?? {}),
  };

  const stripeStatus = await fetchStripeConnectStatus();

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--fg)]">
      <FeedHeader
        displayName={profile?.display_name ?? "founder"}
        role={profile?.role ?? "user"}
      />
      <main className="mx-auto max-w-2xl px-4 sm:px-6 py-6 sm:py-8 space-y-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Settings
          </h1>
          <p className="font-mono text-xs text-[var(--fg-subtle)] mt-1">
            Your profile, photo, notifications, and account controls.
          </p>
        </div>

        <Section title="Photo">
          <AvatarUploader
            displayName={profile?.display_name ?? "founder"}
            initialUrl={profile?.avatar_url ?? null}
          />
        </Section>

        <Section title="Profile">
          <ProfileForm
            initial={{
              display_name: profile?.display_name ?? "",
              bio: profile?.bio ?? "",
              company_name: profile?.company_name ?? "",
              company_url: profile?.company_url ?? "",
              industry: profile?.industry ?? "",
              revenue_band: profile?.revenue_band ?? "",
            }}
          />
          <p className="mt-3 font-mono text-[10px] text-[var(--fg-subtle)]">
            Public on your profile at{" "}
            <Link href={`/u/${user.id}`} className="text-[var(--accent)] hover:underline">
              /u/{user.id.slice(0, 8)}…
            </Link>
          </p>
        </Section>

        <Section title="Payments — Stripe Connect">
          <StripeConnectSection status={stripeStatus} />
        </Section>

        <Section title="Notifications">
          <NotificationPrefsForm initial={prefs} />
        </Section>

        <Section title="Your data">
          <p className="text-xs text-[var(--fg-muted)] mb-3">
            Download a JSON file with every record Loop holds about you —
            profile, posts, messages, matches, documents, reviews. Take it
            with you anytime.
          </p>
          <a
            href="/api/export"
            download
            className="press-shrink inline-flex items-center gap-1.5 rounded-full border border-[var(--border-strong)] bg-white/[0.02] px-4 py-2 text-sm text-[var(--fg)] hover:bg-white/[0.05]"
          >
            <Download className="h-4 w-4" />
            Export my data
          </a>
        </Section>

        <Section title="Account">
          <p className="text-xs text-[var(--fg-muted)] mb-3">
            Email:{" "}
            <span className="font-mono text-[var(--fg)]">{user.email ?? "—"}</span>
          </p>
          <DangerZone email={user.email} />
        </Section>
      </main>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <p className="eyebrow">{title}</p>
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] p-5">
        {children}
      </div>
    </section>
  );
}
