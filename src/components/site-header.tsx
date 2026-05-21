import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { RoosterLogo } from "@/components/logo";
import { UserMenu } from "@/components/user-menu";
import { isConvoUnread } from "@/lib/unread";

export async function SiteHeader() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let notifCount = 0;
  let avatarUrl: string | null = null;
  if (user) {
    const [{ count: pendingOffers }, { data: convos }, { data: profile }] =
      await Promise.all([
        supabase
          .from("offers")
          .select("id", { count: "exact", head: true })
          .eq("seller_id", user.id)
          .eq("status", "pending"),
        supabase
          .from("conversations")
          .select(
            "id, buyer_id, seller_id, buyer_read_at, seller_read_at, messages(sender_id, created_at)",
          )
          .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`),
        supabase
          .from("profiles")
          .select("avatar_url")
          .eq("id", user.id)
          .maybeSingle(),
      ]);
    avatarUrl = (profile as { avatar_url: string | null } | null)?.avatar_url ?? null;
    const unread = (convos ?? []).filter((c) =>
      isConvoUnread(
        c as {
          buyer_id: string;
          seller_id: string;
          buyer_read_at: string | null;
          seller_read_at: string | null;
        },
        ((c as unknown as { messages: { sender_id: string; created_at: string }[] }).messages) ?? [],
        user.id,
      ),
    ).length;
    notifCount = (pendingOffers ?? 0) + unread;
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-6 px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <RoosterLogo className="h-9 w-9" />
          <span className="text-lg font-bold tracking-tight">
            AK <span className="text-[var(--color-brand)]">Rooster</span>
          </span>
        </Link>
        <nav className="hidden items-center gap-5 text-sm font-medium md:flex">
          <Link href="/search" className="hover:text-[var(--color-brand)]">
            Browse cars
          </Link>
          <Link href="/sell" className="hover:text-[var(--color-brand)]">
            Sell my car
          </Link>
          <Link href="/saved" className="hover:text-[var(--color-brand)]">
            Saved
          </Link>
          <Link href="/messages" className="hover:text-[var(--color-brand)]">
            Messages
          </Link>
        </nav>
        <div className="ml-auto flex items-center gap-3">
          <Link
            href="/sell"
            className="ak-btn ak-btn-primary hidden md:inline-flex"
          >
            List a car free
          </Link>
          <UserMenu
            email={user?.email ?? null}
            avatarUrl={avatarUrl}
            notifCount={notifCount}
          />
        </div>
      </div>
    </header>
  );
}
