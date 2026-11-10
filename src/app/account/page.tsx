import { redirect } from "next/navigation";
import Link from "next/link";
import { Briefcase, Download, Settings } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { FeedHeader } from "../feed/_components/FeedHeader";
import { AvatarUploader } from "./_components/AvatarUploader";
import { CoverBand } from "@/components/CoverBand";
import { ImageUploadControl } from "@/components/ImageUploadControl";
import { fetchCoverUrl } from "@/lib/covers";
import { getCoverUploadUrl, removeCover, setCoverFromPath } from "./cover-actions";
import { ProfileForm } from "./_components/ProfileForm";
import { NotificationPrefsForm } from "./_components/NotificationPrefsForm";
import { DangerZone } from "./_components/DangerZone";
import { StripeConnectSection } from "./_components/StripeConnectSection";
import { PositionsEditor } from "./_components/PositionsEditor";
import { CertificationsEditor, EducationEditor } from "./_components/ResumeEditor";
import { AchievementsEditor, FeaturedEditor, GoalsEditor } from "./_components/ShowcaseEditors";
import { readShowcase } from "@/lib/profile-showcase-data";
import { fetchStripeConnectStatus } from "../stripe/actions";
import { fetchUserPositions } from "../organizations/actions";
import { fetchCertifications, fetchEducation } from "../resume/actions";
import { ChangePasswordSection } from "./_components/ChangePasswordSection";
import { loadNotificationSettings } from "./notification-actions";
import { resolvePreferences } from "@/lib/notification-kinds";

export const dynamic = "force-dynamic";

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ add?: string; org_id?: string; org_name?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/account");

  const sp = await searchParams;
  const positionPrefill =
    sp.add === "position"
      ? {
          orgId: sp.org_id ?? undefined,
          orgName: sp.org_name ?? undefined,
        }
      : undefined;

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "display_name, bio, company_name, company_url, industry, revenue_band, avatar_url, role",
    )
    .eq("id", user.id)
    .maybeSingle();

  const [stripeStatus, positions, education, certifications, coverUrl, showcase, notificationSettings] = await Promise.all([
    fetchStripeConnectStatus(),
    fetchUserPositions(user.id),
    fetchEducation(user.id),
    fetchCertifications(user.id),
    fetchCoverUrl(supabase, "profiles", user.id),
    readShowcase(supabase, user.id),
    loadNotificationSettings(),
  ]);

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--fg)]">
      <FeedHeader
        displayName={profile?.display_name ?? "founder"}
        role={profile?.role ?? "user"}
      />
      <main className="mx-auto max-w-2xl px-4 sm:px-6 py-6 sm:py-8 space-y-8">
        <div>
          <h1 className="text-[28px] font-bold tracking-[-0.025em] flex items-center gap-2">
            <Settings className="h-6 w-6" aria-hidden />
            Settings
          </h1>
          <p className="text-sm text-[var(--fg-muted)] mt-1">
            Your profile, featured work, goals, photo, cover, notifications and account controls.
          </p>
        </div>

        <Section title="Photo">
          <AvatarUploader
            displayName={profile?.display_name ?? "founder"}
            initialUrl={profile?.avatar_url ?? null}
          />
        </Section>

        <Section title="Cover image" id="cover">
          <div className="overflow-hidden rounded-[var(--r-md)] border border-[var(--border)]">
            <CoverBand url={coverUrl} alt="Your cover image" className="h-28 sm:h-36" />
          </div>
          <p className="mt-3 text-xs text-[var(--fg-muted)]">
            Shown across the top of your profile and public card. JPEG, PNG or
            WebP, up to 5 MB. A wide image around 1500 by 400 works best. With
            no cover, Loop shows a green gradient.
          </p>
          <div className="mt-3">
            <ImageUploadControl
              label="cover"
              hasImage={Boolean(coverUrl)}
              requestUpload={getCoverUploadUrl}
              commit={setCoverFromPath}
              remove={removeCover}
              removeConfirm="Remove your cover image?"
            />
          </div>
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
          <p className="mt-3 text-xs text-[var(--fg-subtle)]">
            Public on your profile at{" "}
            <Link href={`/u/${user.id}`} className="num font-semibold text-[var(--accent-text)] hover:underline">
              /u/{user.id.slice(0, 8)}…
            </Link>
          </p>
        </Section>

        <Section
          title="Featured"
          id="featured"
          intro="Links to your articles, publications, press, podcasts, videos and your own work. Shown near the top of your profile and on your public card."
        >
          <FeaturedEditor initial={showcase.featured} />
        </Section>

        <Section
          title="Working toward"
          id="goals"
          intro="A few honest goals and how people could help. No progress bars, just what you are building toward."
        >
          <GoalsEditor initial={showcase.goals} />
        </Section>

        <Section title="Achievements" id="achievements">
          <AchievementsEditor initial={showcase.achievements} />
        </Section>

        <Section title="Experience" id="experience">
          <div className="mb-3 flex items-start gap-2 text-xs text-[var(--fg-muted)]">
            <Briefcase className="h-4 w-4 mt-0.5 shrink-0" />
            <p>
              Add the companies you&apos;ve worked at. Tag a Loop company page if it
              exists, or just type the name and link it later when the page
              is added. <Link href="/organizations/new" className="font-semibold text-[var(--accent-text)] hover:underline">Create a company page</Link>.
            </p>
          </div>
          <PositionsEditor
            initial={positions}
            prefillOrgId={positionPrefill?.orgId}
            prefillOrgName={positionPrefill?.orgName}
          />
        </Section>

        <Section title="Education" id="education">
          <EducationEditor initial={education} />
        </Section>

        <Section title="Certifications and accreditations" id="certifications">
          <CertificationsEditor initial={certifications} />
        </Section>

        <Section title="Payments with Stripe Connect">
          <StripeConnectSection status={stripeStatus} />
        </Section>

        <Section
          title="Notifications"
          id="notifications"
          intro="Choose what shows up in Loop and what we email you. Every email has a one click unsubscribe link."
        >
          <NotificationPrefsForm
            initial={
              notificationSettings ?? {
                prefs: resolvePreferences([]),
                digest: false,
                paused: false,
                unsubscribed: false,
              }
            }
          />
        </Section>

        <Section title="Password" id="password">
          <ChangePasswordSection />
        </Section>

        <Section title="Your data">
          <p className="text-xs text-[var(--fg-muted)] mb-3">
            Download a JSON file with every record Loop holds about you:
            profile, featured links, goals, achievements, posts, messages,
            matches, documents, reviews. Take it
            with you anytime.
          </p>
          <a
            href="/api/export"
            download
            className="press-shrink inline-flex items-center gap-1.5 rounded-full border border-[var(--border-strong)] bg-[var(--surface-1)] h-11 px-4 text-sm font-semibold text-[var(--fg)] hover:bg-[var(--surface-2)]"
          >
            <Download className="h-4 w-4" />
            Export my data
          </a>
        </Section>

        <Section title="Account">
          <p className="text-xs text-[var(--fg-muted)] mb-3">
            Email:{" "}
            <span className="font-mono text-[var(--fg)]">{user.email ?? "none"}</span>
          </p>
          <DangerZone email={user.email} />
        </Section>
      </main>
    </div>
  );
}

function Section({
  title,
  id,
  intro,
  children,
}: {
  title: string;
  id?: string;
  intro?: string;
  children: React.ReactNode;
}) {
  const headingId = `settings-${title.toLowerCase().replace(/[^a-z]+/g, "-")}`;
  return (
    <section id={id} aria-labelledby={headingId} className="space-y-3 scroll-mt-20">
      <h2 id={headingId} className="text-[17px] font-semibold tracking-[-0.01em] px-1">
        {title}
      </h2>
      {intro && <p className="px-1 text-xs text-[var(--fg-muted)]">{intro}</p>}
      <div className="surface-card p-5">
        {children}
      </div>
    </section>
  );
}
