import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { SellForm } from "./form";

export const dynamic = "force-dynamic";

export default async function SellPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/sign-in?next=/sell");

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-3xl font-bold tracking-tight">
        Sell your car the easy way.
      </h1>
      <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
        Paste a VIN and we auto-fill year, make, model, trim, body and
        drivetrain. Most listings go live in under 5 minutes — for free.
      </p>
      <SellForm />
    </div>
  );
}
