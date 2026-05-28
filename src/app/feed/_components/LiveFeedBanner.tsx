"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUp } from "lucide-react";
import { createClient } from "@/lib/supabase/browser";

// Listens for new posts (from any user except the viewer) and surfaces a
// "X new posts" pill at the top of the feed. Clicking refreshes the page
// so the server re-runs feed_for_user with the viewer's need embeddings,
// re-ranking the entire feed (not just prepending).
export function LiveFeedBanner({
  viewerId,
  initialTimestamp,
}: {
  viewerId: string;
  initialTimestamp: string;
}) {
  const [newCount, setNewCount] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("feed:new-posts")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "posts" },
        (payload) => {
          const row = payload.new as { user_id: string; created_at: string };
          // Don't count my own posts (router.refresh already covers them).
          if (row.user_id === viewerId) return;
          // Don't count older posts that arrive late (shouldn't happen, but).
          if (row.created_at <= initialTimestamp) return;
          setNewCount((c) => c + 1);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [viewerId, initialTimestamp]);

  if (newCount === 0) return null;

  return (
    <div className="flex justify-center">
      <button
        type="button"
        onClick={() => {
          setNewCount(0);
          router.refresh();
        }}
        className="press-shrink glow-ring inline-flex items-center gap-1.5 rounded-full bg-[var(--accent)] px-3.5 py-1.5 text-xs font-medium text-[var(--bg)] hover:brightness-110 transition-[filter]"
      >
        <ArrowUp className="h-3.5 w-3.5" />
        {newCount} new post{newCount === 1 ? "" : "s"}
      </button>
    </div>
  );
}
