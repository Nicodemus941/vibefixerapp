"use client";

import { useState } from "react";
import { clients, type Goal } from "@/lib/data";
import { buildGamePlan } from "@/lib/content";
import { Avatar, Badge, SectionTitle } from "@/components/ui";
import { Home, Car, Building2, Sparkles, TrendingUp, CheckCircle2, Send, Loader2, Target } from "lucide-react";

const goals: { key: Goal; icon: any; label: string }[] = [
  { key: "Home", icon: Home, label: "Buy a Home" },
  { key: "Car", icon: Car, label: "Buy a Car" },
  { key: "Apartment", icon: Building2, label: "Rent Apartment" },
  { key: "Start Business", icon: Sparkles, label: "Start a Business" },
  { key: "Business Funding", icon: TrendingUp, label: "Business Funding" },
];

export default function GamePlanPage() {
  const [clientId, setClientId] = useState(clients[0].id);
  const [goal, setGoal] = useState<Goal>("Home");
  const [state, setState] = useState<"idle" | "generating" | "done">("idle");
  const [delivered, setDelivered] = useState(false);
  const client = clients.find((c) => c.id === clientId)!;
  const plan = buildGamePlan(client, goal);

  function generate() {
    setState("generating");
    setDelivered(false);
    setTimeout(() => setState("done"), 2200);
  }

  return (
    <div className="space-y-6">
      <SectionTitle sub="Pick a client and their goal — the AI builds a milestone-by-milestone 6–12 month roadmap to get them mortgage, auto, rental, or funding ready.">
        Goal-Based Game Plan
      </SectionTitle>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-1">
          <div className="card p-5">
            <h3 className="mb-3 text-sm font-semibold text-white">Client</h3>
            <div className="space-y-2">
              {clients.map((c) => (
                <button
                  key={c.id}
                  onClick={() => { setClientId(c.id); setGoal(c.goal); setState("idle"); }}
                  className={`flex w-full items-center gap-3 rounded-xl border p-2.5 text-left transition ${
                    clientId === c.id ? "border-sky-500/50 bg-sky-500/5" : "border-[var(--color-line)] hover:bg-white/[0.02]"
                  }`}
                >
                  <Avatar name={c.name} color={c.avatarColor} size={32} />
                  <span className="text-sm text-white">{c.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="card p-5">
            <h3 className="mb-3 text-sm font-semibold text-white">Goal</h3>
            <div className="grid grid-cols-2 gap-2">
              {goals.map((g) => (
                <button
                  key={g.key}
                  onClick={() => { setGoal(g.key); setState("idle"); }}
                  className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 transition ${
                    goal === g.key ? "border-amber-400/50 bg-amber-400/5" : "border-[var(--color-line)] hover:bg-white/[0.02]"
                  }`}
                >
                  <g.icon size={18} className={goal === g.key ? "text-amber-300" : "text-slate-400"} />
                  <span className="text-center text-[11px] text-slate-200">{g.label}</span>
                </button>
              ))}
            </div>
            <button
              onClick={generate}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg brand-gradient py-3 font-semibold text-white glow"
            >
              <Target size={16} /> Generate Game Plan
            </button>
          </div>
        </div>

        <div className="lg:col-span-2">
          {state === "idle" && (
            <div className="card flex h-full flex-col items-center justify-center gap-3 p-16 text-center text-slate-400">
              <Target size={36} className="text-slate-600" />
              <p className="text-sm">Select a client and goal, then generate their personalized roadmap.</p>
            </div>
          )}

          {state === "generating" && (
            <div className="card flex h-full flex-col items-center justify-center gap-4 p-16 text-center">
              <Loader2 size={36} className="animate-spin text-amber-400" />
              <div className="text-white">Mapping {client.name.split(" ")[0]}'s profile to {goal} requirements…</div>
            </div>
          )}

          {state === "done" && (
            <div className="space-y-4">
              <div className="card overflow-hidden">
                <div className="brand-gradient p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs uppercase tracking-widest text-white/70">
                        {goal} · {plan.meta.months}-month plan
                      </div>
                      <div className="mt-1 text-lg font-bold text-white">{plan.meta.tagline}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-white/70">Target</div>
                      <div className="text-2xl font-black text-white">{plan.meta.score}+</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative space-y-4 pl-6">
                <div className="absolute bottom-2 left-2 top-2 w-px bg-[var(--color-line)]" />
                {plan.phases.map((p, i) => (
                  <div key={i} className="relative card p-5 fade-up">
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

              <div className="card flex items-center justify-between p-4">
                {delivered ? (
                  <div className="flex items-center gap-2 text-sm text-emerald-400">
                    <CheckCircle2 size={16} /> Delivered to {client.name}'s portal + emailed.
                  </div>
                ) : (
                  <>
                    <span className="text-sm text-slate-300">Deliver this plan to the client?</span>
                    <button
                      onClick={() => setDelivered(true)}
                      className="inline-flex items-center gap-2 rounded-lg brand-gradient px-4 py-2 text-sm font-semibold text-white glow"
                    >
                      <Send size={15} /> Send to Portal
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
