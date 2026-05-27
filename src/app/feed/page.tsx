import { createClient } from "@/lib/supabase/server";

export default async function FeedPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user!.id)
    .maybeSingle();

  return (
    <main className="min-h-screen bg-neutral-50">
      <div className="max-w-2xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-semibold tracking-tight">
          Welcome to Loop, {profile?.display_name ?? "founder"}.
        </h1>
        <p className="mt-3 text-neutral-600">
          The feed is empty for now. Your first matches will land here once the
          daily matcher runs.
        </p>
      </div>
    </main>
  );
}
