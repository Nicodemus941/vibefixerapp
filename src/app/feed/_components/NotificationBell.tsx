"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { createClient } from "@/lib/supabase/browser";

export function NotificationBell({
  userId,
  initialUnread,
}: {
  userId: string;
  initialUnread: number;
}) {
  const [unread, setUnread] = useState(initialUnread);

  // Realtime: bump count on INSERT for this user, decrement on UPDATE→read.
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`notifs:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        () => setUnread((c) => c + 1),
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newRow = payload.new as { read_at: string | null };
          const oldRow = payload.old as { read_at: string | null };
          if (!oldRow.read_at && newRow.read_at) {
            setUnread((c) => Math.max(0, c - 1));
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  // Sync when initial prop changes (server re-render).
  useEffect(() => {
    setUnread(initialUnread);
  }, [initialUnread]);

  const label = unread > 99 ? "99+" : String(unread);

  return (
    <Link
      href="/notifications"
      className="press-shrink relative inline-flex items-center gap-1.5 rounded-full border border-[var(--border-strong)] bg-white/[0.02] px-3 py-1.5 text-xs text-[var(--fg-muted)] hover:bg-white/[0.05] hover:text-[var(--fg)] transition-colors"
      aria-label={unread > 0 ? `Notifications (${unread} unread)` : "Notifications"}
    >
      <Bell className="h-3.5 w-3.5" />
      {unread > 0 && (
        <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[var(--accent)] text-[var(--bg)] text-[10px] font-mono font-semibold tabular-nums flex items-center justify-center">
          {label}
        </span>
      )}
    </Link>
  );
}
