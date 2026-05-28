import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { FeedHeader } from "@/app/feed/_components/FeedHeader";
import { NewGroupForm } from "../_components/NewGroupForm";

export const dynamic = "force-dynamic";

export default async function NewGroupPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/groups/new");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, role")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--fg)]">
      <FeedHeader
        displayName={profile?.display_name ?? "founder"}
        role={profile?.role ?? "user"}
      />
      <main className="mx-auto max-w-lg px-4 sm:px-6 py-6 sm:py-8 space-y-5">
        <Link
          href="/groups"
          className="press-shrink inline-flex items-center gap-1.5 text-xs text-[var(--fg-muted)] hover:text-[var(--fg)]"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to groups
        </Link>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">New group</h1>
          <p className="font-mono text-xs text-[var(--fg-subtle)] mt-1">
            Public groups anyone can join. You become the owner and can moderate.
          </p>
        </div>
        <NewGroupForm />
      </main>
    </div>
  );
}
