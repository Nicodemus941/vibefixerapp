import Link from "next/link";
import { clients, kpis, tasks, stages } from "@/lib/data";
import { Avatar, Badge, ScoreTrend, Stat, stageTone } from "@/components/ui";
import {
  Users,
  ScrollText,
  TrendingUp,
  DollarSign,
  CheckCircle2,
  ArrowUpRight,
  Bell,
  ArrowRight,
} from "lucide-react";

export default function Dashboard() {
  const k = kpis();
  const openTasks = tasks.filter((t) => !t.done).slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Good morning, Jonathan 👋</h1>
          <p className="mt-1 text-sm text-slate-400">
            Here's what's moving across your book of business today.
          </p>
        </div>
        <Link
          href="/analysis"
          className="inline-flex items-center gap-2 rounded-lg brand-gradient px-4 py-2.5 text-sm font-semibold text-white glow"
        >
          New AI Analysis <ArrowUpRight size={16} />
        </Link>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Stat label="Active Clients" value={k.active} sub={`${k.total} total in CRM`} icon={<Users size={18} />} />
        <Stat label="Items In Dispute" value={k.inDispute} sub="3 bureaus" icon={<ScrollText size={18} />} />
        <Stat label="Deletions Won" value={k.deletions} sub="All-time" icon={<CheckCircle2 size={18} />} />
        <Stat label="Avg Score Lift" value={`+${k.avgLift}`} sub="per active client" icon={<TrendingUp size={18} />} />
        <Stat label="Monthly Revenue" value={`$${k.mrr.toLocaleString()}`} sub="recurring" icon={<DollarSign size={18} />} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Client roster */}
        <div className="card p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-white">Active Clients</h2>
            <Link href="/clients" className="text-xs text-sky-400 hover:underline">
              View all →
            </Link>
          </div>
          <div className="space-y-2">
            {clients.map((c) => {
              const lift = c.currentScore - c.startScore;
              return (
                <Link
                  key={c.id}
                  href={`/clients/${c.id}`}
                  className="flex items-center gap-4 rounded-xl border border-transparent p-3 transition hover:border-[var(--color-line)] hover:bg-white/[0.02]"
                >
                  <Avatar name={c.name} color={c.avatarColor} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-medium text-white">{c.name}</span>
                      <Badge tone={stageTone(c.stage)}>{c.stage}</Badge>
                    </div>
                    <div className="truncate text-xs text-slate-400">
                      Goal: {c.goal} · {c.plan}
                    </div>
                  </div>
                  <div className="hidden sm:block">
                    <ScoreTrend data={c.scoreHistory} height={36} />
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-white">{c.currentScore}</div>
                    <div className={`text-xs ${lift > 0 ? "text-emerald-400" : "text-slate-500"}`}>
                      {lift > 0 ? `+${lift}` : "new"}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Today / pipeline */}
        <div className="space-y-6">
          <div className="card p-5">
            <div className="mb-4 flex items-center gap-2">
              <Bell size={16} className="text-amber-400" />
              <h2 className="font-semibold text-white">Today's Priorities</h2>
            </div>
            <div className="space-y-3">
              {openTasks.map((t) => (
                <Link
                  key={t.id}
                  href={`/clients/${t.clientId}`}
                  className="block rounded-lg border border-[var(--color-line)] bg-white/[0.02] p-3 transition hover:bg-white/[0.04]"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-white">{t.title}</span>
                    <Badge tone={t.priority === "High" ? "red" : t.priority === "Medium" ? "amber" : "slate"}>
                      {t.priority}
                    </Badge>
                  </div>
                  <div className="mt-1 text-xs text-slate-400">
                    {t.client} · due {t.due}
                  </div>
                </Link>
              ))}
            </div>
            <Link
              href="/tasks"
              className="mt-4 flex items-center justify-center gap-1 text-xs text-sky-400 hover:underline"
            >
              Open task board <ArrowRight size={13} />
            </Link>
          </div>

          <div className="card p-5">
            <h2 className="mb-4 font-semibold text-white">Pipeline</h2>
            <div className="space-y-2.5">
              {stages.map((s) => {
                const count = clients.filter((c) => c.stage === s).length;
                const pct = (count / clients.length) * 100;
                return (
                  <div key={s}>
                    <div className="mb-1 flex justify-between text-xs">
                      <span className="text-slate-300">{s}</span>
                      <span className="text-slate-500">{count}</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
                      <div className="h-full brand-gradient" style={{ width: `${Math.max(pct, count ? 8 : 0)}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
