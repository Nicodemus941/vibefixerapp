import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { Flag } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { FeedHeader } from "@/app/feed/_components/FeedHeader";
import { fetchOpenReports } from "@/app/moderation/actions";
import { ResolveReportForm } from "./_components/ResolveReportForm";

export const dynamic = "force-dynamic";

export default async function ReportsAdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin/reports");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, role")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.role !== "owner" && profile?.role !== "admin") notFound();

  const reports = await fetchOpenReports();

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--fg)]">
      <FeedHeader
        displayName={profile?.display_name ?? "founder"}
        role={profile?.role ?? "user"}
      />
      <main className="mx-auto max-w-2xl px-4 sm:px-6 py-6 sm:py-8 space-y-5">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <Flag className="h-5 w-5" />
            Report queue
          </h1>
          <p className="font-mono text-xs text-[var(--fg-subtle)] mt-1">
            Owner / admin only. Mark reviewed or dismiss.
          </p>
        </div>

        {reports.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface-1)]/40 p-8 text-center">
            <p className="text-[var(--fg-muted)]">No open reports.</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {reports.map((r) => (
              <li
                key={r.id}
                className="rounded-2xl border border-amber-400/30 bg-amber-400/[0.05] p-5 space-y-3"
              >
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-wider text-amber-400">
                    {r.target_kind.toUpperCase()} · reported by{" "}
                    <Link
                      href={`/u/${r.reporter_id}`}
                      className="underline hover:no-underline"
                    >
                      {r.reporter_name}
                    </Link>
                  </p>
                  <p className="font-mono text-[10px] text-[var(--fg-subtle)] mt-0.5">
                    target id: {r.target_id} · {new Date(r.created_at).toLocaleString()}
                  </p>
                </div>
                <p className="text-sm text-[var(--fg)] whitespace-pre-wrap">{r.reason}</p>
                <ResolveReportForm reportId={r.id} />
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
