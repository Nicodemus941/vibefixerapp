"use client";

import { useState } from "react";
import Link from "next/link";
import { tasks as seed } from "@/lib/data";
import { Badge, SectionTitle } from "@/components/ui";
import { CheckSquare, Square, Calendar, Plus, Bell } from "lucide-react";

const typeTone: Record<string, any> = {
  Dispute: "amber",
  "Follow-up": "blue",
  Reminder: "violet",
  Onboarding: "green",
  Payment: "red",
  Review: "slate",
};

export default function TasksPage() {
  const [tasks, setTasks] = useState(seed);
  const toggle = (id: string) => setTasks((t) => t.map((x) => (x.id === id ? { ...x, done: !x.done } : x)));

  const open = tasks.filter((t) => !t.done);
  const done = tasks.filter((t) => t.done);
  const reminders = tasks.filter((t) => t.type === "Reminder");

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <SectionTitle sub="Deadlines, follow-ups, and automated 30-day reminders — so no client and no dispute round ever slips.">
          Tasks &amp; Reminders
        </SectionTitle>
        <button className="inline-flex items-center gap-2 rounded-lg brand-gradient px-4 py-2.5 text-sm font-semibold text-white glow">
          <Plus size={16} /> New Task
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="card p-4">
          <div className="text-2xl font-black text-white">{open.length}</div>
          <div className="text-xs text-slate-400">Open tasks</div>
        </div>
        <div className="card p-4">
          <div className="text-2xl font-black text-amber-300">{open.filter((t) => t.priority === "High").length}</div>
          <div className="text-xs text-slate-400">High priority</div>
        </div>
        <div className="card p-4">
          <div className="text-2xl font-black text-violet-300">{reminders.length}</div>
          <div className="text-xs text-slate-400">Auto reminders</div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="card p-5 lg:col-span-2">
          <h3 className="mb-3 font-semibold text-white">To-do</h3>
          <div className="space-y-2">
            {open.map((t) => (
              <div key={t.id} className="flex items-center gap-3 rounded-lg border border-[var(--color-line)] bg-white/[0.02] p-3">
                <button onClick={() => toggle(t.id)} className="text-slate-500 hover:text-sky-400">
                  <Square size={18} />
                </button>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-white">{t.title}</div>
                  <Link href={`/clients/${t.clientId}`} className="text-xs text-slate-400 hover:text-sky-400">
                    {t.client}
                  </Link>
                </div>
                <Badge tone={typeTone[t.type]}>{t.type}</Badge>
                <span className="flex items-center gap-1 text-xs text-slate-400">
                  <Calendar size={12} /> {t.due}
                </span>
                <Badge tone={t.priority === "High" ? "red" : t.priority === "Medium" ? "amber" : "slate"}>{t.priority}</Badge>
              </div>
            ))}
            {done.map((t) => (
              <div key={t.id} className="flex items-center gap-3 rounded-lg border border-[var(--color-line)] p-3 opacity-50">
                <button onClick={() => toggle(t.id)} className="text-emerald-400">
                  <CheckSquare size={18} />
                </button>
                <div className="min-w-0 flex-1 text-sm line-through text-slate-400">{t.title}</div>
                <span className="text-xs text-slate-500">{t.client}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <div className="mb-3 flex items-center gap-2">
            <Bell size={16} className="text-violet-400" />
            <h3 className="font-semibold text-white">Automated Reminders</h3>
          </div>
          <p className="mb-3 text-xs text-slate-400">
            These fire automatically — 30 days after each dispute round and at key client milestones.
          </p>
          <div className="space-y-2">
            {reminders.map((t) => (
              <div key={t.id} className="rounded-lg border border-violet-500/20 bg-violet-500/[0.06] p-3">
                <div className="text-sm font-medium text-white">{t.title}</div>
                <div className="mt-0.5 text-xs text-slate-400">{t.client} · {t.due}</div>
              </div>
            ))}
            <div className="rounded-lg border border-dashed border-[var(--color-line)] p-3 text-center text-xs text-slate-500">
              + Reminders auto-generate from the Automations engine
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
