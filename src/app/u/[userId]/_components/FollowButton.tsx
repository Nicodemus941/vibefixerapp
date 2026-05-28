"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, UserMinus, UserPlus } from "lucide-react";
import { followUser, unfollowUser } from "@/app/follows/actions";

export function FollowButton({
  targetUserId,
  initiallyFollowing,
  followsYou,
}: {
  targetUserId: string;
  initiallyFollowing: boolean;
  followsYou: boolean;
}) {
  const [isFollowing, setIsFollowing] = useState(initiallyFollowing);
  const [hover, setHover] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function toggle() {
    startTransition(async () => {
      if (isFollowing) {
        const r = await unfollowUser(targetUserId);
        if (!r.error) setIsFollowing(false);
      } else {
        const r = await followUser(targetUserId);
        if (!r.error) setIsFollowing(true);
      }
      router.refresh();
    });
  }

  // Following → "Following" (green) → "Unfollow" on hover (red outline)
  // Not following → "Follow" (accent) or "Follow back" if they follow you
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
          <UserMinus className="h-3.5 w-3.5" />
        ) : (
          <Check className="h-3.5 w-3.5" />
        )}
        {hover ? "Unfollow" : "Following"}
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
      {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserPlus className="h-3.5 w-3.5" />}
      {followsYou ? "Follow back" : "Follow"}
    </button>
  );
}
