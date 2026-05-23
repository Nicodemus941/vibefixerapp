import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ProfileEditForm } from "@/components/profile-edit-form";
import { AvatarUploader } from "@/components/avatar-uploader";
import { NotifPrefsForm, NotifPrefs } from "@/components/notif-prefs-form";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/sign-in?next=/account/profile");

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "full_name, is_verified, avatar_url, notif_email_digest, notif_new_offer, notif_new_message, notif_price_drops, notif_saved_search_alerts",
    )
    .eq("id", user.id)
    .maybeSingle();

  const notifPrefs: NotifPrefs = {
    notif_email_digest:
      (profile?.notif_email_digest as NotifPrefs["notif_email_digest"]) ?? "weekly",
    notif_new_offer: profile?.notif_new_offer ?? true,
    notif_new_message: profile?.notif_new_message ?? true,
    notif_price_drops: profile?.notif_price_drops ?? true,
    notif_saved_search_alerts: profile?.notif_saved_search_alerts ?? true,
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Link
        href="/account"
        className="text-xs font-medium text-[var(--color-ink-muted)] hover:text-[var(--color-brand)]"
      >
        ← Back to dashboard
      </Link>
      <h1 className="mt-2 text-2xl font-bold tracking-tight">Edit profile</h1>
      <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
        Update your display name, password, and verification.
      </p>

      <div className="ak-card mt-6 space-y-8 p-6">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-[var(--color-ink-muted)]">
            Profile photo
          </label>
          <div className="mt-3">
            <AvatarUploader
              initialUrl={profile?.avatar_url ?? null}
              fallbackInitial={
                (profile?.full_name?.[0] ?? user.email?.[0] ?? "U").toUpperCase()
              }
            />
          </div>
        </div>

        <ProfileEditForm
          initialName={profile?.full_name ?? ""}
          email={user.email ?? ""}
          emailVerified={!!profile?.is_verified}
        />
      </div>

      <div className="ak-card mt-6 p-6">
        <h2 className="text-lg font-semibold">Notifications</h2>
        <p className="mt-1 text-xs text-[var(--color-ink-muted)]">
          Control which emails you receive from Car World USA.
        </p>
        <div className="mt-4">
          <NotifPrefsForm initial={notifPrefs} />
        </div>
      </div>
    </div>
  );
}
