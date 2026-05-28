import Link from "next/link";
import { Inbox, Search, Sparkles, Users } from "lucide-react";
import { fetchUnreadCount } from "../../notifications/actions";
import { createClient } from "@/lib/supabase/server";
import { NotificationBell } from "./NotificationBell";
import { HeaderAvatarMenu } from "./HeaderAvatarMenu";
import { MobileTabBar } from "./MobileTabBar";

export async function FeedHeader({
  displayName,
  role,
}: {
  displayName: string;
  role: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: viewerProfile } = user
    ? await supabase
        .from("profiles")
        .select("avatar_url")
        .eq("id", user.id)
        .maybeSingle()
    : { data: null };
  const unread = user ? await fetchUnreadCount() : 0;

  return (
    <>
      <header
        className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--bg)]/80 backdrop-blur-md"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <div className="mx-auto max-w-2xl px-3 sm:px-6 h-14 flex items-center justify-between gap-2">
          <Link
            href="/feed"
            aria-label="Loop home"
            className="press-shrink flex items-center gap-2 shrink-0"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/loop-mark.svg" alt="" width={24} height={24} className="h-6 w-6" />
            <span className="font-semibold tracking-tight">Loop</span>
          </Link>

          <nav className="flex items-center gap-1 sm:gap-2" aria-label="Primary">
            {/* Tablet+ nav row — phones use the bottom MobileTabBar instead. */}
            <HeaderIconLink href="/search" label="Search" className="hidden md:inline-flex">
              <Search className="h-4 w-4" />
            </HeaderIconLink>
            <HeaderIconLink href="/matches" label="Matches" className="hidden md:inline-flex">
              <Sparkles className="h-4 w-4" />
              <span className="text-xs">Matches</span>
            </HeaderIconLink>
            <HeaderIconLink href="/inbox" label="Inbox" className="hidden md:inline-flex">
              <Inbox className="h-4 w-4" />
              <span className="text-xs">Inbox</span>
            </HeaderIconLink>
            <HeaderIconLink href="/groups" label="Groups" className="hidden md:inline-flex">
              <Users className="h-4 w-4" />
            </HeaderIconLink>

            {user && <NotificationBell userId={user.id} initialUnread={unread} />}

            {user && (
              <HeaderAvatarMenu
                userId={user.id}
                displayName={displayName}
                avatarUrl={viewerProfile?.avatar_url ?? null}
                role={role}
              />
            )}
          </nav>
        </div>
      </header>
      <MobileTabBar />
    </>
  );
}

function HeaderIconLink({
  href,
  label,
  children,
  className = "",
}: {
  href: string;
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      className={[
        "press-shrink inline-flex items-center justify-center gap-1.5 h-10 min-w-10 rounded-full border border-[var(--border-strong)] bg-white/[0.02] text-[var(--fg-muted)] hover:bg-white/[0.05] hover:text-[var(--fg)] transition-colors px-2.5 md:px-3",
        className,
      ].join(" ")}
    >
      {children}
    </Link>
  );
}
