"use client";

import { useState } from "react";
import { clients, disputeStrategies } from "@/lib/data";
import { buildDisputeLetter } from "@/lib/content";
import { Avatar, Badge, SectionTitle } from "@/components/ui";
import { ScrollText, Sparkles, Loader2, Send, CheckCircle2, Printer, Mail } from "lucide-react";

export default function DisputesPage() {
  const withNegs = clients.filter((c) => c.negatives.length > 0);
  const [clientId, setClientId] = useState(withNegs[0].id);
  const client = clients.find((c) => c.id === clientId)!;
  const disputable = client.negatives.filter((n) => n.status !== "Deleted");

  const [selected, setSelected] = useState<string[]>(disputable.slice(0, 2).map((n) => n.id));
  const [strategy, setStrategy] = useState(disputeStrategies[0].name);
  const [bureau, setBureau] = useState("Experian");
  const [state, setState] = useState<"idle" | "gen" | "done" | "sent">("idle");

  const items = client.negatives.filter((n) => selected.includes(n.id)).map((n) => ({ creditor: n.creditor, reason: n.reason }));
  const letter = buildDisputeLetter({ client, bureau, items, strategy });

  function toggle(id: string) {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
    setState("idle");
  }
  function generate() {
    setState("gen");
    setTimeout(() => setState("done"), 1800);
  }

  return (
    <div className="space-y-6">
      <SectionTitle sub="Build unique, non-templated dispute letters using JV's proven strategies. Pick the items, choose the attack, and generate maximum-impact letters ready to mail or e-deliver.">
        Atomic Dispute Engine
      </SectionTitle>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Builder */}
        <div className="space-y-6 lg:col-span-2">
          <div className="card p-5">
            <h3 className="mb-3 text-sm font-semibold text-white">1. Client &amp; bureau</h3>
            <select
              value={clientId}
              onChange={(e) => { setClientId(e.target.value); setSelected([]); setState("idle"); }}
              className="mb-2 w-full rounded-lg border border-[var(--color-line)] bg-white/[0.03] px-3 py-2 text-sm text-white"
            >
              {withNegs.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <div className="flex gap-2">
              {["Experian", "Equifax", "TransUnion"].map((b) => (
                <button
                  key={b}
                  onClick={() => { setBureau(b); setState("idle"); }}
                  className={`flex-1 rounded-lg border px-2 py-1.5 text-xs font-medium ${
                    bureau === b ? "border-sky-500/50 bg-sky-500/10 text-sky-300" : "border-[var(--color-line)] text-slate-400"
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>

          <div className="card p-5">
            <h3 className="mb-3 text-sm font-semibold text-white">2. Select items to dispute</h3>
            <div className="space-y-2">
              {disputable.map((n) => (
                <label
                  key={n.id}
                  className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition ${
                    selected.includes(n.id) ? "border-sky-500/50 bg-sky-500/5" : "border-[var(--color-line)]"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selected.includes(n.id)}
                    onChange={() => toggle(n.id)}
                    className="mt-1 accent-sky-500"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white">{n.creditor}</span>
                      <Badge tone="amber">{n.type}</Badge>
                    </div>
                    <div className="text-xs text-slate-400">{n.reason}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="card p-5">
            <h3 className="mb-3 text-sm font-semibold text-white">3. Dispute strategy</h3>
            <div className="max-h-60 space-y-1.5 overflow-y-auto pr-1">
              {disputeStrategies.map((s) => (
                <button
                  key={s.id}
                  onClick={() => { setStrategy(s.name); setState("idle"); }}
                  className={`w-full rounded-lg border p-2.5 text-left transition ${
                    strategy === s.name ? "border-amber-400/50 bg-amber-400/5" : "border-[var(--color-line)] hover:bg-white/[0.02]"
                  }`}
                >
                  <div className="text-sm font-medium text-white">{s.name}</div>
                  <div className="text-xs text-slate-400">{s.desc}</div>
                  <div className="mt-1 text-[10px] uppercase tracking-wide text-amber-300/80">Best for: {s.best}</div>
                </button>
              ))}
            </div>
            <button
              onClick={generate}
              disabled={selected.length === 0}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg brand-gradient py-3 font-semibold text-white glow disabled:opacity-40"
            >
              <Sparkles size={16} /> Generate Letter{selected.length > 1 ? "s" : ""}
            </button>
          </div>
        </div>

        {/* Preview */}
        <div className="lg:col-span-3">
          <div className="card flex h-full flex-col p-0">
            <div className="flex items-center justify-between border-b border-[var(--color-line)] p-4">
              <div className="flex items-center gap-2">
                <ScrollText size={16} className="text-sky-400" />
                <span className="text-sm font-semibold text-white">Letter Preview — {bureau}</span>
              </div>
              {state === "done" && <Badge tone="green">Generated</Badge>}
              {state === "sent" && <Badge tone="green">Mailed ✓</Badge>}
            </div>

            <div className="flex-1 overflow-auto p-5">
              {state === "idle" && (
                <div className="grid h-full place-items-center text-center text-sm text-slate-500">
                  <div>
                    <ScrollText size={32} className="mx-auto mb-3 text-slate-700" />
                    Select items and a strategy, then generate to preview the letter.
                  </div>
                </div>
              )}
              {state === "gen" && (
                <div className="grid h-full place-items-center">
                  <div className="flex flex-col items-center gap-3 text-center">
                    <Loader2 size={30} className="animate-spin text-sky-400" />
                    <div className="text-sm text-white">Writing a unique letter — no templates, FCRA-cited…</div>
                  </div>
                </div>
              )}
              {(state === "done" || state === "sent") && (
                <pre className="whitespace-pre-wrap rounded-lg bg-white text-[12.5px] leading-relaxed text-slate-800 p-6 font-mono shadow-inner">
{letter}
                </pre>
              )}
            </div>

            {(state === "done" || state === "sent") && (
              <div className="flex flex-wrap items-center gap-2 border-t border-[var(--color-line)] p-4">
                <button className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-line)] px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-white/5">
                  <Printer size={14} /> Print / Certified Mail
                </button>
                <button className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-line)] px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-white/5">
                  <Mail size={14} /> E-deliver
                </button>
                {state === "sent" ? (
                  <span className="ml-auto flex items-center gap-1.5 text-xs text-emerald-400">
                    <CheckCircle2 size={14} /> Logged as Round {client.rounds.length + 1} · 30-day timer started
                  </span>
                ) : (
                  <button
                    onClick={() => setState("sent")}
                    className="ml-auto inline-flex items-center gap-1.5 rounded-lg brand-gradient px-4 py-2 text-xs font-semibold text-white glow"
                  >
                    <Send size={14} /> Queue &amp; Log Round
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
