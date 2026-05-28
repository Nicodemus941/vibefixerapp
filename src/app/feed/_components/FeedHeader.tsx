import Link from "next/link";
import { Inbox, LogOut, Search, Settings, Sparkles, Users } from "lucide-react";
import { signOut } from "../../auth/actions";
import { fetchUnreadCount } from "../../notifications/actions";
import { createClient } from "@/lib/supabase/server";
import { Avatar } from "@/components/Avatar";
import { NotificationBell } from "./NotificationBell";

export async function FeedHeader({
  displayName,
  role,
}: {
  displayName: string;
  role: string;
}) {
  const isOwner = role === "owner";

  // Fetch the user id + avatar once on the server.
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
    <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--bg)]/80 backdrop-blur-md">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 h-14 flex items-center justify-between gap-3">
        <Link href="/feed" aria-label="Loop home" className="flex items-center gap-2 press-shrink">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/loop-mark.svg" alt="" width={24} height={24} className="h-6 w-6" />
          <span className="font-semibold tracking-tight">Loop</span>
        </Link>
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/search"
            className="press-shrink inline-flex items-center justify-center h-8 w-8 rounded-full border border-[var(--border-strong)] bg-white/[0.02] text-[var(--fg-muted)] hover:bg-white/[0.05] hover:text-[var(--fg)] transition-colors"
            aria-label="Search"
          >
            <Search className="h-3.5 w-3.5" />
          </Link>
          <Link
            href="/matches"
            className="press-shrink inline-flex items-center gap-1.5 rounded-full border border-[var(--border-strong)] bg-white/[0.02] px-3 py-1.5 text-xs text-[var(--fg-muted)] hover:bg-white/[0.05] hover:text-[var(--fg)] transition-colors"
            aria-label="Matches"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Matches</span>
          </Link>
          <Link
            href="/groups"
            className="press-shrink inline-flex items-center gap-1.5 rounded-full border border-[var(--border-strong)] bg-white/[0.02] px-3 py-1.5 text-xs text-[var(--fg-muted)] hover:bg-white/[0.05] hover:text-[var(--fg)] transition-colors"
            aria-label="Groups"
          >
            <Users className="h-3.5 w-3.5" />
            <span className="hidden md:inline">Groups</span>
          </Link>
          <Link
            href="/inbox"
            className="press-shrink inline-flex items-center gap-1.5 rounded-full border border-[var(--border-strong)] bg-white/[0.02] px-3 py-1.5 text-xs text-[var(--fg-muted)] hover:bg-white/[0.05] hover:text-[var(--fg)] transition-colors"
            aria-label="Inbox"
          >
            <Inbox className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Inbox</span>
          </Link>
          {user && <NotificationBell userId={user.id} initialUnread={unread} />}
          {isOwner && (
            <span className="hidden sm:inline-flex font-mono text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-[var(--accent)]/20 text-[var(--accent)] border border-[var(--accent)]/40">
              Owner
            </span>
          )}
          <Link
            href="/account"
            aria-label="Settings"
            className="press-shrink inline-flex items-center justify-center h-8 w-8 rounded-full border border-[var(--border-strong)] bg-white/[0.02] text-[var(--fg-muted)] hover:bg-white/[0.05] hover:text-[var(--fg)] transition-colors"
          >
            <Settings className="h-3.5 w-3.5" />
          </Link>
          <Link
            href={user ? `/u/${user.id}` : "/login"}
            aria-label="My profile"
            className="press-shrink"
          >
            <Avatar
              name={displayName}
              url={viewerProfile?.avatar_url ?? null}
              size="sm"
            />
          </Link>
          <form action={signOut}>
            <button
              type="submit"
              className="press-shrink inline-flex items-center justify-center h-8 w-8 rounded-full border border-[var(--border-strong)] bg-white/[0.02] text-[var(--fg-muted)] hover:bg-white/[0.05] hover:text-[var(--fg)] transition-colors"
              aria-label="Sign out"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
