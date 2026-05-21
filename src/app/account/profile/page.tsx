import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ProfileEditForm } from "@/components/profile-edit-form";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/sign-in?next=/account/profile");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, is_verified")
    .eq("id", user.id)
    .maybeSingle();

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

      <div className="ak-card mt-6 p-6">
        <ProfileEditForm
          initialName={profile?.full_name ?? ""}
          email={user.email ?? ""}
          emailVerified={!!profile?.is_verified}
        />
      </div>
    </div>
  );
}
