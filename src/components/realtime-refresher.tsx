"use client";
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

// Lightweight realtime layer: subscribes to Postgres changes on the
// tables that drive the dashboard, and calls router.refresh() (debounced)
// when anything that affects the current user lands. Server components
// re-render with the fresh data on next paint — no client state needed.
export function RealtimeRefresher({ userId }: { userId: string }) {
  const router = useRouter();
  const pending = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    function refresh() {
      if (pending.current) clearTimeout(pending.current);
      // Debounce — Postgres can fire multiple events per row update.
      pending.current = setTimeout(() => {
        router.refresh();
      }, 350);
    }

    const channel = supabase
      .channel(`dashboard-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "offers",
          filter: `seller_id=eq.${userId}`,
        },
        refresh,
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "offers",
          filter: `buyer_id=eq.${userId}`,
        },
        refresh,
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        refresh,
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "listings",
          filter: `seller_id=eq.${userId}`,
        },
        refresh,
      )
      .subscribe();

    return () => {
      if (pending.current) clearTimeout(pending.current);
      supabase.removeChannel(channel);
    };
  }, [userId, router]);

  return null;
}
