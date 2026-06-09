"use client";

import { useState } from "react";
import { clients } from "@/lib/data";
import { buildGamePlan } from "@/lib/content";
import { Avatar, Badge, ScoreRing, ScoreTrend } from "@/components/ui";
import { Logo } from "@/components/Logo";
import {
  Eye,
  CheckCircle2,
  Clock,
  FileText,
  Upload,
  MessageSquare,
  CreditCard,
  Target,
  Smartphone,
} from "lucide-react";

export default function PortalPage() {
  const portalClients = clients.filter((c) => c.scoreHistory.at(-1)!.experian > 0);
  const [id, setId] = useState(portalClients[0].id);
  const c = clients.find((x) => x.id === id)!;
  const lift = c.currentScore - c.startScore;
  const plan = buildGamePlan(c, c.goal);
  const deletions = c.rounds.reduce((a, r) => a + (r.deletions || 0), 0);

  return (
    <div className="space-y-5">
      {/* Preview banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-400/25 bg-amber-400/[0.06] p-3">
        <div className="flex items-center gap-2 text-sm text-amber-200">
          <Eye size={16} /> <b>Client Portal Preview</b> — this is what your client sees when they log in.
        </div>
        <select
          value={id}
          onChange={(e) => setId(e.target.value)}
          className="rounded-lg border border-[var(--color-line)] bg-white/[0.03] px-3 py-1.5 text-xs text-white"
        >
          {portalClients.map((x) => (
            <option key={x.id} value={x.id}>Viewing as: {x.name}</option>
          ))}
        </select>
      </div>

      {/* Portal frame */}
      <div className="overflow-hidden rounded-2xl border border-[var(--color-line)] bg-[var(--color-ink)]">
        {/* Portal header */}
        <div className="flex items-center justify-between border-b border-[var(--color-line)] bg-[var(--color-panel)] px-5 py-4">
          <Logo size={34} />
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-slate-300 sm:block">Hi, {c.name.split(" ")[0]}</span>
            <Avatar name={c.name} color={c.avatarColor} size={34} />
          </div>
        </div>

        <div className="space-y-5 p-5">
          {/* Hero */}
          <div className="grid gap-5 lg:grid-cols-3">
            <div className="card flex items-center gap-5 p-5 lg:col-span-2">
              <ScoreRing score={c.currentScore} size={128} />
              <div>
                <div className="text-sm text-slate-400">Your credit score</div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-white">{c.currentScore}</span>
                  {lift > 0 && <span className="text-sm font-semibold text-emerald-400">+{lift} pts 🎉</span>}
                </div>
                <div className="mt-2"><ScoreTrend data={c.scoreHistory} height={48} /></div>
                <div className="mt-2 text-xs text-slate-400">
                  Goal: <b className="text-white">{c.goal}</b> · Target {c.targetScore}
                </div>
              </div>
            </div>

            <div className="card flex flex-col justify-center gap-3 p-5">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">Items deleted</span>
                <span className="text-2xl font-black text-emerald-400">{deletions}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">In progress</span>
                <span className="text-2xl font-black text-amber-300">
                  {c.negatives.filter((n) => n.status === "In Dispute").length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">Payment</span>
                <Badge tone={c.payment === "Past Due" ? "red" : "green"}>{c.payment}</Badge>
              </div>
            </div>
          </div>

          {/* Quick actions */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { icon: Upload, label: "Upload Document" },
              { icon: MessageSquare, label: "Message Jonathan" },
              { icon: CreditCard, label: "Make a Payment" },
              { icon: Smartphone, label: "Get Text Updates" },
            ].map((a) => (
              <button key={a.label} className="card flex flex-col items-center gap-2 p-4 transition hover:glow">
                <div className="grid h-10 w-10 place-items-center rounded-xl brand-gradient text-white">
                  <a.icon size={18} />
                </div>
                <span className="text-center text-xs font-medium text-slate-200">{a.label}</span>
              </button>
            ))}
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            {/* Dispute progress */}
            <div className="card p-5">
              <h3 className="mb-3 font-semibold text-white">Your Dispute Progress</h3>
              <div className="space-y-2">
                {c.negatives.map((n) => (
                  <div key={n.id} className="flex items-center gap-3 rounded-lg border border-[var(--color-line)] bg-white/[0.02] p-3">
                    {n.status === "Deleted" ? (
                      <CheckCircle2 size={16} className="text-emerald-400" />
                    ) : (
                      <Clock size={16} className="text-amber-400" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm text-white">{n.creditor}</div>
                      <div className="text-xs text-slate-500">{n.type}</div>
                    </div>
                    <Badge tone={n.status === "Deleted" ? "green" : n.status === "In Dispute" ? "amber" : "slate"}>
                      {n.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            {/* Game plan */}
            <div className="card p-5">
              <h3 className="mb-3 flex items-center gap-2 font-semibold text-white">
                <Target size={16} className="text-sky-400" /> Your {c.goal} Game Plan
              </h3>
              <div className="rounded-lg brand-gradient p-3 text-sm font-medium text-white">{plan.meta.tagline}</div>
              <div className="mt-3 space-y-2">
                {plan.phases.map((p, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-sky-500/15 text-xs font-bold text-sky-300">
                      {i + 1}
                    </span>
                    <div>
                      <div className="text-xs font-semibold text-white">{p.title}</div>
                      <div className="text-[11px] text-slate-400">{p.window}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Documents */}
          <div className="card p-5">
            <h3 className="mb-3 font-semibold text-white">Your Documents</h3>
            <div className="grid gap-2 sm:grid-cols-2">
              {c.documents.map((d) => (
                <div key={d.id} className="flex items-center gap-3 rounded-lg border border-[var(--color-line)] bg-white/[0.02] p-3">
                  <FileText size={16} className="text-sky-300" />
                  <span className="flex-1 truncate text-sm text-white">{d.name}</span>
                  <span className="text-xs text-slate-500">{d.date}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="text-center text-xs italic text-slate-500">
            JV Credit Repair Services · “Faith-Driven. Results-Focused.” · We Repair Credit. We Restore Lives.
          </p>
        </div>
      </div>
    </div>
  );
}
