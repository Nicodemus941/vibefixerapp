"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Briefcase, Flag, Gavel, LogOut, Settings, Trophy, User as UserIcon, Users } from "lucide-react";
import { Avatar } from "@/components/Avatar";
import { signOut } from "../../auth/actions";

export function HeaderAvatarMenu({
  userId,
  displayName,
  avatarUrl,
  role,
}: {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  role: string;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const isOwner = role === "owner";
  const isAdmin = role === "admin" || role === "owner";

  useEffect(() => {
    if (!open) return;
    function handle(e: MouseEvent | TouchEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handle);
    document.addEventListener("touchstart", handle);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handle);
      document.removeEventListener("touchstart", handle);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Account menu"
        aria-expanded={open}
        aria-haspopup="menu"
        className="press-shrink relative inline-flex items-center justify-center h-10 w-10 rounded-full"
      >
        <Avatar name={displayName} url={avatarUrl} size="sm" />
        {isOwner && (
          <span
            aria-hidden
            className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-[var(--accent)] border-2 border-[var(--bg)]"
          />
        )}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-60 rounded-2xl border border-[var(--border)] bg-[var(--surface-1)] p-2 shadow-xl z-50"
        >
          <div className="px-2.5 py-2 border-b border-[var(--border)] mb-1">
            <p className="text-sm font-medium text-[var(--fg)] truncate">
              {displayName}
            </p>
            {isOwner && (
              <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--accent)] mt-0.5">
                Owner
              </p>
            )}
            {role === "admin" && (
              <p className="font-mono text-[10px] uppercase tracking-wider text-amber-400 mt-0.5">
                Admin
              </p>
            )}
          </div>

          <MenuLink href={`/u/${userId}`} icon={<UserIcon className="h-4 w-4" />} onSelect={() => setOpen(false)}>
            View profile
          </MenuLink>
          <MenuLink href="/jobs" icon={<Briefcase className="h-4 w-4" />} onSelect={() => setOpen(false)}>
            Jobs
          </MenuLink>
          <MenuLink href="/account" icon={<Settings className="h-4 w-4" />} onSelect={() => setOpen(false)}>
            Settings
          </MenuLink>
          <MenuLink href="/leaderboard" icon={<Trophy className="h-4 w-4" />} onSelect={() => setOpen(false)} className="md:hidden">
            Leaderboard
          </MenuLink>
          <MenuLink href="/groups" icon={<Users className="h-4 w-4" />} onSelect={() => setOpen(false)} className="md:hidden">
            Groups
          </MenuLink>

          {isAdmin && (
            <>
              <div className="my-1 border-t border-[var(--border)]" />
              <MenuLink
                href="/admin/disputes"
                icon={<Gavel className="h-4 w-4" />}
                onSelect={() => setOpen(false)}
                tone="amber"
              >
                Admin · Disputes
              </MenuLink>
              <MenuLink
                href="/admin/reports"
                icon={<Flag className="h-4 w-4" />}
                onSelect={() => setOpen(false)}
                tone="amber"
              >
                Admin · Reports
              </MenuLink>
            </>
          )}

          <div className="my-1 border-t border-[var(--border)]" />
          <form action={signOut}>
            <button
              type="submit"
              role="menuitem"
              className="w-full text-left flex items-center gap-2.5 rounded-lg px-2.5 py-2.5 text-sm text-[var(--danger)] hover:bg-white/[0.04]"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

function MenuLink({
  href,
  icon,
  children,
  onSelect,
  tone,
  className = "",
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  onSelect: () => void;
  tone?: "amber";
  className?: string;
}) {
  return (
    <Link
      href={href}
      role="menuitem"
      onClick={onSelect}
      className={[
        "flex items-center gap-2.5 rounded-lg px-2.5 py-2.5 text-sm hover:bg-white/[0.04]",
        tone === "amber" ? "text-amber-400" : "text-[var(--fg)]",
        className,
      ].join(" ")}
    >
      {icon}
      {children}
    </Link>
  );
}
