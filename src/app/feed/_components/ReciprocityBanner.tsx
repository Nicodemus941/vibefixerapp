import Link from "next/link";
import { AlertTriangle, Lock } from "lucide-react";

export function ReciprocityBanner({
  status,
  lastNeedAt,
}: {
  status: string | null | undefined;
  lastNeedAt: string | null;
}) {
  if (status === "warned") {
    const lastDays = lastNeedAt
      ? Math.floor((Date.now() - new Date(lastNeedAt).getTime()) / 86400_000)
      : null;
    const daysLeft = lastDays !== null ? Math.max(0, 30 - lastDays) : null;
    return (
      <div className="rounded-2xl border border-amber-400/30 bg-amber-400/[0.06] p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5 text-amber-400" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-[var(--fg)]">
              Post a new need to keep your access active.
            </p>
            <p className="text-sm text-[var(--fg-muted)] mt-1">
              Loop requires reciprocity. You haven&apos;t shared what you need in a
              while
              {daysLeft !== null && (
                <>
                  {" "}— <span className="font-mono tabular-nums">{daysLeft} day{daysLeft === 1 ? "" : "s"}</span> until your account is paused.
                </>
              )}
            </p>
            <Link
              href="/onboarding"
              className="press-shrink mt-3 inline-flex items-center rounded-full bg-amber-400 px-3.5 py-1.5 text-xs font-medium text-[var(--bg)] hover:brightness-110 transition-[filter]"
            >
              Post a need
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (status === "suspended") {
    return (
      <div className="rounded-2xl border border-[var(--danger)]/40 bg-[var(--danger)]/[0.06] p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <Lock className="h-5 w-5 shrink-0 mt-0.5 text-[var(--danger)]" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[var(--fg)]">
              Your account is paused — reciprocity required.
            </p>
            <p className="text-sm text-[var(--fg-muted)] mt-1">
              You can&apos;t post or message until you share a new need. This is
              how Loop stays a community of doers, not spectators.
            </p>
            <Link
              href="/onboarding"
              className="press-shrink mt-3 inline-flex items-center rounded-full bg-[var(--danger)] px-3.5 py-1.5 text-xs font-medium text-white hover:brightness-110 transition-[filter]"
            >
              Post a need to unpause
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
