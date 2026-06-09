"use client";

import { useState } from "react";
import { clients } from "@/lib/data";
import { Avatar, Badge, SectionTitle } from "@/components/ui";
import { Send, Mail, MessageSquare, Zap } from "lucide-react";

const templates = [
  { name: "Welcome", body: "Welcome to JV Credit Repair, {name}! I'm excited to help you reach your goal. Upload your report in the portal and I'll get started today. — Jonathan" },
  { name: "Deletion Win", body: "🎉 Great news {name}! We just got a negative item DELETED. Your score is climbing — keep going!" },
  { name: "Payment Reminder", body: "Hi {name}, friendly reminder your monthly payment is due. Here's your secure pay link so we keep your disputes moving. 🙏" },
  { name: "30-Day Check-in", body: "Hi {name}! It's been 30 days since our last round. I'm reviewing the bureau responses now and will update you shortly." },
];

export default function CommsPage() {
  const [activeId, setActiveId] = useState(clients.find((c) => c.comms.length > 0)!.id);
  const [channel, setChannel] = useState<"SMS" | "Email">("SMS");
  const [draft, setDraft] = useState("");
  const active = clients.find((c) => c.id === activeId)!;

  return (
    <div className="space-y-6">
      <SectionTitle sub="Text and email your clients directly inside the platform. Every message is logged to the client timeline automatically.">
        Messages
      </SectionTitle>

      <div className="grid h-[640px] gap-4 lg:grid-cols-[260px_1fr_280px]">
        {/* Conversations */}
        <div className="card flex flex-col overflow-hidden p-0">
          <div className="border-b border-[var(--color-line)] p-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Conversations
          </div>
          <div className="flex-1 overflow-y-auto">
            {clients.map((c) => {
              const last = c.comms.at(-1);
              return (
                <button
                  key={c.id}
                  onClick={() => setActiveId(c.id)}
                  className={`flex w-full items-center gap-3 border-b border-[var(--color-line)] p-3 text-left transition ${
                    activeId === c.id ? "bg-sky-500/5" : "hover:bg-white/[0.02]"
                  }`}
                >
                  <Avatar name={c.name} color={c.avatarColor} size={36} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-white">{c.name}</div>
                    <div className="truncate text-xs text-slate-500">{last ? last.body : "No messages yet"}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Thread */}
        <div className="card flex flex-col overflow-hidden p-0">
          <div className="flex items-center gap-3 border-b border-[var(--color-line)] p-3">
            <Avatar name={active.name} color={active.avatarColor} size={34} />
            <div>
              <div className="text-sm font-semibold text-white">{active.name}</div>
              <div className="text-xs text-slate-400">{active.phone} · {active.email}</div>
            </div>
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {active.comms.length === 0 && <div className="grid h-full place-items-center text-sm text-slate-500">No messages yet — say hello 👋</div>}
            {active.comms.map((m) => (
              <div key={m.id} className={`flex ${m.direction === "out" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-sm ${
                    m.direction === "out" ? "brand-gradient text-white" : "border border-[var(--color-line)] bg-white/[0.04] text-slate-200"
                  }`}
                >
                  {m.subject && <div className="mb-1 text-xs font-semibold opacity-80">✉ {m.subject}</div>}
                  {m.body}
                  <div className={`mt-1 flex items-center gap-1 text-[10px] ${m.direction === "out" ? "text-white/70" : "text-slate-500"}`}>
                    {m.channel === "SMS" ? <MessageSquare size={10} /> : <Mail size={10} />} {m.channel} · {m.date}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="border-t border-[var(--color-line)] p-3">
            <div className="mb-2 flex gap-2">
              {(["SMS", "Email"] as const).map((ch) => (
                <button
                  key={ch}
                  onClick={() => setChannel(ch)}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-medium ${
                    channel === ch ? "brand-gradient text-white" : "border border-[var(--color-line)] text-slate-400"
                  }`}
                >
                  {ch === "SMS" ? <MessageSquare size={12} /> : <Mail size={12} />} {ch}
                </button>
              ))}
            </div>
            <div className="flex items-end gap-2">
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                rows={2}
                placeholder={`Send ${channel} to ${active.name.split(" ")[0]}…`}
                className="flex-1 resize-none rounded-lg border border-[var(--color-line)] bg-white/[0.03] px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-sky-500/50 focus:outline-none"
              />
              <button className="grid h-10 w-10 place-items-center rounded-lg brand-gradient text-white">
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Templates */}
        <div className="card hidden flex-col overflow-hidden p-0 lg:flex">
          <div className="flex items-center gap-2 border-b border-[var(--color-line)] p-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
            <Zap size={13} className="text-amber-400" /> Quick Templates
          </div>
          <div className="flex-1 space-y-2 overflow-y-auto p-3">
            {templates.map((t) => (
              <button
                key={t.name}
                onClick={() => setDraft(t.body.replace("{name}", active.name.split(" ")[0]))}
                className="w-full rounded-lg border border-[var(--color-line)] bg-white/[0.02] p-3 text-left transition hover:bg-white/[0.04]"
              >
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-sm font-medium text-white">{t.name}</span>
                  <Badge tone="blue">Tap to use</Badge>
                </div>
                <p className="line-clamp-2 text-xs text-slate-400">{t.body.replace("{name}", active.name.split(" ")[0])}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
