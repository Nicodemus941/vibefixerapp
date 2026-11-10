"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, BellOff, Check, Loader2 } from "lucide-react";
import { followOrg, unfollowOrg } from "@/app/follows/actions";

export function FollowOrgButton({
  orgId,
  orgSlug,
  initiallyFollowing,
  initialFollowerCount,
  isAuthenticated,
}: {
  orgId: string;
  orgSlug: string;
  initiallyFollowing: boolean;
  initialFollowerCount: number;
  isAuthenticated: boolean;
}) {
  const [isFollowing, setIsFollowing] = useState(initiallyFollowing);
  const [followerCount, setFollowerCount] = useState(initialFollowerCount);
  const [hover, setHover] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  if (!isAuthenticated) {
    return (
      <Link
        href={`/login?next=/o/${orgSlug}`}
        className="press-shrink inline-flex items-center gap-1.5 rounded-full border border-[var(--border-strong)] bg-white/[0.02] px-3.5 py-2 text-xs sm:text-sm font-medium text-[var(--fg)] hover:bg-white/[0.05]"
      >
        <Bell className="h-3.5 w-3.5" />
        Sign in to follow
        {followerCount > 0 && (
          <span className="font-mono text-[10px] text-[var(--fg-subtle)] tabular-nums ml-1">
            · {followerCount}
          </span>
        )}
      </Link>
    );
  }

  function toggle() {
    startTransition(async () => {
      if (isFollowing) {
        const r = await unfollowOrg(orgId);
        if (!r.error) {
          setIsFollowing(false);
          setFollowerCount((c) => Math.max(0, c - 1));
        }
      } else {
        const r = await followOrg(orgId);
        if (!r.error) {
          setIsFollowing(true);
          setFollowerCount((c) => c + 1);
        }
      }
      router.refresh();
    });
  }

  if (isFollowing) {
    return (
      <button
        type="button"
        onClick={toggle}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        disabled={pending}
        className={[
          "press-shrink inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs sm:text-sm font-medium transition-colors",
          hover
            ? "border border-[var(--danger)]/50 bg-[var(--danger)]/[0.08] text-[var(--danger)]"
            : "border border-[var(--accent)]/50 bg-[var(--accent)]/[0.08] text-[var(--accent)]",
        ].join(" ")}
      >
        {pending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : hover ? (
          <BellOff className="h-3.5 w-3.5" />
        ) : (
          <Check className="h-3.5 w-3.5" />
        )}
        {hover ? "Unfollow" : "Following"}
        <span className="font-mono text-[10px] tabular-nums opacity-70 ml-0.5">
          · {followerCount}
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      className="press-shrink inline-flex items-center gap-1.5 rounded-full border border-[var(--border-strong)] bg-white/[0.02] px-3.5 py-2 text-xs sm:text-sm font-medium text-[var(--fg)] hover:bg-white/[0.05]"
    >
      {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Bell className="h-3.5 w-3.5" />}
      Follow
      {followerCount > 0 && (
        <span className="font-mono text-[10px] text-[var(--fg-subtle)] tabular-nums ml-0.5">
          · {followerCount}
        </span>
      )}
    </button>
  );
}
