"use client";

import Link from "next/link";
import { useState } from "react";
import type { Client } from "@/lib/data";
import { buildGamePlan, buildAnalysis } from "@/lib/content";
import { Avatar, Badge, ScoreRing, ScoreTrend, stageTone } from "@/components/ui";
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  KeyRound,
  Eye,
  EyeOff,
  FileText,
  ScrollText,
  Target,
  StickyNote,
  MessageSquare,
  CreditCard,
  CheckCircle2,
  Clock,
  XCircle,
  Send,
  Calendar,
  Lock,
} from "lucide-react";

const tabs = ["Overview", "Credit Report", "Disputes", "Game Plan", "Documents", "Messages", "Notes"] as const;
type Tab = (typeof tabs)[number];

export function ClientDetail({ client: c }: { client: Client }) {
  const [tab, setTab] = useState<Tab>("Overview");
  const [showPw, setShowPw] = useState(false);
  const lift = c.currentScore - c.startScore;

  return (
    <div className="space-y-6">
      <Link href="/clients" className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-white">
        <ArrowLeft size={15} /> Back to clients
      </Link>

      {/* Header */}
      <div className="card p-5">
        <div className="flex flex-wrap items-start gap-5">
          <Avatar name={c.name} color={c.avatarColor} size={64} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold text-white">{c.name}</h1>
              <Badge tone={stageTone(c.stage)}>{c.stage}</Badge>
              <Badge tone={c.payment === "Current" || c.payment === "Paid in Full" ? "green" : c.payment === "Past Due" ? "red" : "slate"}>
                {c.payment}
              </Badge>
            </div>
            <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-slate-400">
              <span className="flex items-center gap-1.5"><Mail size={13} /> {c.email}</span>
              <span className="flex items-center gap-1.5"><Phone size={13} /> {c.phone}</span>
              <span className="flex items-center gap-1.5"><MapPin size={13} /> {c.city}</span>
              <span className="flex items-center gap-1.5"><Calendar size={13} /> Joined {c.joined}</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button className="inline-flex items-center gap-1.5 rounded-lg brand-gradient px-3 py-1.5 text-xs font-semibold text-white">
                <MessageSquare size={13} /> Text
              </button>
              <button className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-line)] px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-white/5">
                <Mail size={13} /> Email
              </button>
              <button className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-line)] px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-white/5">
                <ScrollText size={13} /> New Dispute
              </button>
            </div>
          </div>
          <div className="flex items-center gap-5">
            <ScoreRing score={c.currentScore} size={120} />
            <div className="hidden sm:block">
              <div className="text-xs text-slate-400">Since intake</div>
              <div className={`text-xl font-black ${lift > 0 ? "text-emerald-400" : "text-slate-300"}`}>
                {lift > 0 ? `+${lift}` : "—"}
              </div>
              <div className="mt-2 text-xs text-slate-400">Target</div>
              <div className="text-xl font-black gold-text">{c.targetScore}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto border-b border-[var(--color-line)]">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-medium transition ${
              tab === t
                ? "border-sky-500 text-white"
                : "border-transparent text-slate-400 hover:text-white"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Overview" && <Overview c={c} showPw={showPw} setShowPw={setShowPw} />}
      {tab === "Credit Report" && <CreditReport c={c} />}
      {tab === "Disputes" && <Disputes c={c} />}
      {tab === "Game Plan" && <GamePlan c={c} />}
      {tab === "Documents" && <Documents c={c} />}
      {tab === "Messages" && <Messages c={c} />}
      {tab === "Notes" && <Notes c={c} />}
    </div>
  );
}

function Overview({ c, showPw, setShowPw }: { c: Client; showPw: boolean; setShowPw: (v: boolean) => void }) {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="card p-5 lg:col-span-2">
        <h3 className="mb-4 font-semibold text-white">Score Progress</h3>
        <div className="flex items-center justify-between">
          <ScoreTrend data={c.scoreHistory} height={90} />
          <div className="grid grid-cols-3 gap-4 text-center">
            {["experian", "equifax", "transunion"].map((b) => {
              const v = (c.scoreHistory.at(-1) as any)[b];
              return (
                <div key={b}>
                  <div className="text-[10px] uppercase tracking-wide text-slate-500">{b.slice(0, 3)}</div>
                  <div className="text-lg font-bold text-white">{v || "—"}</div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="mt-5 rounded-xl border border-sky-500/20 bg-sky-500/5 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-sky-300">
            <Target size={15} /> Next Action
          </div>
          <p className="mt-1 text-sm text-white">{c.nextAction}</p>
          <p className="text-xs text-slate-400">Due {c.nextActionDate}</p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="card p-5">
          <h3 className="mb-3 flex items-center gap-2 font-semibold text-white">
            <KeyRound size={15} className="text-amber-400" /> Credit Monitoring
          </h3>
          <Row label="Provider" value={c.monitoring.provider} />
          <Row label="Username" value={c.monitoring.username} />
          <div className="flex items-center justify-between py-1.5 text-sm">
            <span className="text-slate-400">Password</span>
            <span className="flex items-center gap-2 font-mono text-white">
              {showPw ? "Faith2018!" : "••••••••"}
              <button onClick={() => setShowPw(!showPw)} className="text-slate-400 hover:text-white">
                {showPw ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </span>
          </div>
          <div className="mt-2 flex items-center gap-1 text-[11px] text-slate-500">
            <Lock size={11} /> Encrypted &amp; access-logged
          </div>
        </div>

        <div className="card p-5">
          <h3 className="mb-3 flex items-center gap-2 font-semibold text-white">
            <CreditCard size={15} className="text-emerald-400" /> Billing
          </h3>
          <Row label="Plan" value={c.plan} />
          <Row label="Monthly" value={c.monthly ? `$${c.monthly}/mo` : "Free consult"} />
          <Row label="Status" value={c.payment} />
          <button className="mt-3 w-full rounded-lg border border-[var(--color-line)] py-2 text-xs font-semibold text-slate-200 hover:bg-white/5">
            Send payment link
          </button>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1.5 text-sm">
      <span className="text-slate-400">{label}</span>
      <span className="font-medium text-white">{value}</span>
    </div>
  );
}

function CreditReport({ c }: { c: Client }) {
  const a = buildAnalysis(c);
  return (
    <div className="space-y-4">
      <div className="card p-5">
        <h3 className="mb-3 font-semibold text-white">Negative Items ({c.negatives.length})</h3>
        {c.negatives.length === 0 ? (
          <p className="text-sm text-slate-400">No report on file yet. Upload a PDF to run the AI analysis.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="pb-2 pr-4">Creditor</th>
                  <th className="pb-2 pr-4">Type</th>
                  <th className="pb-2 pr-4">Bureaus</th>
                  <th className="pb-2 pr-4">Balance</th>
                  <th className="pb-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {c.negatives.map((n) => (
                  <tr key={n.id} className="border-t border-[var(--color-line)]">
                    <td className="py-2.5 pr-4">
                      <div className="font-medium text-white">{n.creditor}</div>
                      <div className="text-xs text-slate-500">{n.reason}</div>
                    </td>
                    <td className="py-2.5 pr-4 text-slate-300">{n.type}</td>
                    <td className="py-2.5 pr-4 text-xs text-slate-400">{n.bureau.join(", ")}</td>
                    <td className="py-2.5 pr-4 text-slate-300">{n.balance ? `$${n.balance}` : "—"}</td>
                    <td className="py-2.5">
                      <Badge
                        tone={
                          n.status === "Deleted" ? "green" : n.status === "In Dispute" ? "amber" : n.status === "Verified" ? "red" : "slate"
                        }
                      >
                        {n.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {c.negatives.length > 0 && (
        <div className="card p-5">
          <div className="mb-2 flex items-center gap-2">
            <span className="rounded-md gold-gradient px-2 py-0.5 text-[10px] font-bold text-black">AI</span>
            <h3 className="font-semibold text-white">Credit Analysis Summary</h3>
          </div>
          <p className="text-sm text-slate-300">{a.summary}</p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {a.factors.map((f) => (
              <div key={f.label} className="rounded-lg border border-[var(--color-line)] bg-white/[0.02] p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-300">{f.label}</span>
                  <Badge tone={f.grade === "Good" ? "green" : f.grade === "Critical" ? "red" : "amber"}>{f.grade}</Badge>
                </div>
                <p className="mt-1 text-xs text-slate-400">{f.note}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Disputes({ c }: { c: Client }) {
  if (c.rounds.length === 0)
    return (
      <div className="card p-8 text-center text-sm text-slate-400">
        No dispute rounds yet. Head to the <Link href="/disputes" className="text-sky-400 hover:underline">Dispute Engine</Link> to launch Round 1.
      </div>
    );
  return (
    <div className="space-y-3">
      {c.rounds.map((r) => (
        <div key={r.round} className="card p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-lg brand-gradient font-bold text-white">
                R{r.round}
              </div>
              <div>
                <div className="font-semibold text-white">Round {r.round} · {r.bureau}</div>
                <div className="text-xs text-slate-400">Sent {r.sentDate} · {r.items} items</div>
              </div>
            </div>
            <Badge
              tone={r.status === "Completed" ? "green" : r.status === "In Progress" ? "amber" : "slate"}
            >
              {r.status === "Completed" ? <CheckCircle2 size={12} /> : r.status === "In Progress" ? <Clock size={12} /> : <XCircle size={12} />}
              {r.status}
            </Badge>
          </div>
          <div className="mt-3 rounded-lg border border-[var(--color-line)] bg-white/[0.02] p-3 text-xs text-slate-300">
            <span className="font-semibold text-slate-200">Strategy:</span> {r.strategy}
          </div>
          {r.result && (
            <div className="mt-2 flex items-center gap-2 text-sm text-emerald-400">
              <CheckCircle2 size={15} /> Result: {r.result}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function GamePlan({ c }: { c: Client }) {
  const plan = buildGamePlan(c, c.goal);
  return (
    <div className="space-y-4">
      <div className="card overflow-hidden">
        <div className="brand-gradient p-5">
          <div className="text-xs uppercase tracking-widest text-white/70">{plan.goal} Goal · {plan.meta.months}-month plan</div>
          <div className="mt-1 text-lg font-bold text-white">{plan.meta.tagline}</div>
          <div className="mt-2 text-sm text-white/80">Target mid-score: {plan.meta.score}+</div>
        </div>
      </div>
      <div className="relative space-y-4 pl-6">
        <div className="absolute bottom-2 left-2 top-2 w-px bg-[var(--color-line)]" />
        {plan.phases.map((p, i) => (
          <div key={i} className="relative card p-5">
            <div className="absolute -left-[1.35rem] top-6 h-3 w-3 rounded-full gold-gradient ring-4 ring-[var(--color-ink)]" />
            <div className="flex items-center gap-2">
              <Badge tone="blue">{p.window}</Badge>
              <span className="font-semibold text-white">{p.title}</span>
            </div>
            <ul className="mt-3 space-y-1.5">
              {p.items.map((it, j) => (
                <li key={j} className="flex items-start gap-2 text-sm text-slate-300">
                  <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-sky-400" /> {it}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}

function Documents({ c }: { c: Client }) {
  return (
    <div className="card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold text-white">Documents ({c.documents.length})</h3>
        <button className="rounded-lg border border-[var(--color-line)] px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-white/5">
          Upload
        </button>
      </div>
      {c.documents.length === 0 ? (
        <p className="text-sm text-slate-400">No documents yet.</p>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {c.documents.map((d) => (
            <div key={d.id} className="flex items-center gap-3 rounded-lg border border-[var(--color-line)] bg-white/[0.02] p-3">
              <div className="grid h-9 w-9 place-items-center rounded-lg bg-sky-500/10 text-sky-300">
                <FileText size={16} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-white">{d.name}</div>
                <div className="text-xs text-slate-500">{d.type} · {d.size} · {d.date}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Messages({ c }: { c: Client }) {
  return (
    <div className="card flex h-[480px] flex-col p-0">
      <div className="border-b border-[var(--color-line)] p-4 text-sm font-semibold text-white">
        Conversation with {c.name}
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {c.comms.map((m) => (
          <div key={m.id} className={`flex ${m.direction === "out" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-sm ${
                m.direction === "out"
                  ? "brand-gradient text-white"
                  : "border border-[var(--color-line)] bg-white/[0.04] text-slate-200"
              }`}
            >
              {m.subject && <div className="mb-1 text-xs font-semibold opacity-80">✉ {m.subject}</div>}
              {m.body}
              <div className={`mt-1 text-[10px] ${m.direction === "out" ? "text-white/70" : "text-slate-500"}`}>
                {m.channel} · {m.date}
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2 border-t border-[var(--color-line)] p-3">
        <select className="rounded-lg border border-[var(--color-line)] bg-white/[0.03] px-2 py-2 text-xs text-slate-300">
          <option>SMS</option>
          <option>Email</option>
        </select>
        <input
          placeholder="Type a message…"
          className="flex-1 rounded-lg border border-[var(--color-line)] bg-white/[0.03] px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-sky-500/50 focus:outline-none"
        />
        <button className="grid h-9 w-9 place-items-center rounded-lg brand-gradient text-white">
          <Send size={15} />
        </button>
      </div>
    </div>
  );
}

function Notes({ c }: { c: Client }) {
  return (
    <div className="space-y-3">
      <div className="card p-4">
        <textarea
          placeholder="Add a note about this client…"
          rows={2}
          className="w-full resize-none rounded-lg border border-[var(--color-line)] bg-white/[0.03] p-3 text-sm text-white placeholder:text-slate-500 focus:border-sky-500/50 focus:outline-none"
        />
        <div className="mt-2 flex justify-end">
          <button className="rounded-lg brand-gradient px-4 py-1.5 text-xs font-semibold text-white">Save note</button>
        </div>
      </div>
      {c.notes.map((n) => (
        <div key={n.id} className="card flex gap-3 p-4">
          <StickyNote size={16} className="mt-0.5 shrink-0 text-amber-400" />
          <div>
            <p className="text-sm text-slate-200">{n.body}</p>
            <p className="mt-1 text-xs text-slate-500">{n.author} · {n.date}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
