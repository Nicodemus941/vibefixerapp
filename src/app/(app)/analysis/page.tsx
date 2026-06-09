"use client";

import { useState } from "react";
import { clients } from "@/lib/data";
import { buildAnalysis } from "@/lib/content";
import { Avatar, Badge, SectionTitle } from "@/components/ui";
import {
  UploadCloud,
  FileText,
  Sparkles,
  Mail,
  CheckCircle2,
  Loader2,
  TrendingUp,
  ArrowRight,
} from "lucide-react";

type Step = "upload" | "analyzing" | "result" | "sent";

export default function AnalysisPage() {
  const [clientId, setClientId] = useState(clients[2].id); // Ashley (Analysis stage)
  const [step, setStep] = useState<Step>("upload");
  const client = clients.find((c) => c.id === clientId)!;
  const analysis = buildAnalysis(client);

  function run() {
    setStep("analyzing");
    setTimeout(() => setStep("result"), 2600);
  }

  const steps = [
    { key: "upload", label: "Upload Report" },
    { key: "analyzing", label: "AI Analysis" },
    { key: "result", label: "Review" },
    { key: "sent", label: "Email Client" },
  ];
  const stepIndex = steps.findIndex((s) => s.key === step);

  return (
    <div className="space-y-6">
      <SectionTitle sub="Upload a client's credit report PDF. The AI extracts every tradeline, scores the file, and writes a detailed, branded analysis you can email in one click.">
        AI Credit Analysis
      </SectionTitle>

      {/* Stepper */}
      <div className="flex items-center gap-2">
        {steps.map((s, i) => (
          <div key={s.key} className="flex flex-1 items-center gap-2">
            <div
              className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium ${
                i <= stepIndex ? "brand-gradient text-white" : "border border-[var(--color-line)] text-slate-500"
              }`}
            >
              <span className="grid h-5 w-5 place-items-center rounded-full bg-white/20 text-[10px]">
                {i < stepIndex ? "✓" : i + 1}
              </span>
              <span className="hidden sm:inline">{s.label}</span>
            </div>
            {i < steps.length - 1 && <div className={`h-px flex-1 ${i < stepIndex ? "bg-sky-500" : "bg-[var(--color-line)]"}`} />}
          </div>
        ))}
      </div>

      {step === "upload" && (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="card p-5 lg:col-span-2">
            <h3 className="mb-3 text-sm font-semibold text-white">1. Select client</h3>
            <div className="grid gap-2 sm:grid-cols-2">
              {clients.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setClientId(c.id)}
                  className={`flex items-center gap-3 rounded-xl border p-3 text-left transition ${
                    clientId === c.id ? "border-sky-500/50 bg-sky-500/5" : "border-[var(--color-line)] hover:bg-white/[0.02]"
                  }`}
                >
                  <Avatar name={c.name} color={c.avatarColor} size={36} />
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-white">{c.name}</div>
                    <div className="text-xs text-slate-400">Goal: {c.goal}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="card flex flex-col p-5">
            <h3 className="mb-3 text-sm font-semibold text-white">2. Upload report PDF</h3>
            <label className="flex flex-1 cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-[var(--color-line)] p-6 text-center transition hover:border-sky-500/50 hover:bg-sky-500/5">
              <UploadCloud size={32} className="text-sky-400" />
              <div className="text-sm font-medium text-white">Drop the 3-bureau PDF here</div>
              <div className="text-xs text-slate-500">or click to browse · IdentityIQ, MyScoreIQ, Credit Karma</div>
            </label>
            <div className="mt-3 flex items-center gap-2 rounded-lg border border-[var(--color-line)] bg-white/[0.02] p-2.5">
              <FileText size={16} className="text-sky-300" />
              <span className="flex-1 truncate text-xs text-slate-300">
                {client.name.split(" ")[0]}_Report.pdf
              </span>
              <Badge tone="green">Ready</Badge>
            </div>
            <button
              onClick={run}
              className="mt-4 flex items-center justify-center gap-2 rounded-lg brand-gradient py-3 font-semibold text-white glow"
            >
              <Sparkles size={16} /> Run AI Analysis
            </button>
          </div>
        </div>
      )}

      {step === "analyzing" && (
        <div className="card flex flex-col items-center justify-center gap-4 p-16 text-center">
          <Loader2 size={40} className="animate-spin text-sky-400" />
          <div className="text-lg font-semibold text-white">Analyzing {client.name}'s report…</div>
          <div className="w-full max-w-sm space-y-2 text-left text-sm text-slate-400">
            {["Parsing 3-bureau tradelines", "Detecting negative & inaccurate items", "Scoring the file across 5 factors", "Drafting personalized recommendations", "Building 90-day projection"].map(
              (t, i) => (
                <div key={i} className="flex items-center gap-2">
                  <CheckCircle2 size={15} className="text-emerald-400" /> {t}
                </div>
              )
            )}
          </div>
        </div>
      )}

      {(step === "result" || step === "sent") && (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="card p-6 lg:col-span-2">
            <div className="mb-4 flex items-center gap-2">
              <span className="rounded-md gold-gradient px-2 py-0.5 text-[10px] font-bold text-black">AI</span>
              <h3 className="font-semibold text-white">Detailed Credit Analysis</h3>
            </div>
            <p className="text-sm font-medium text-sky-300">{analysis.headline}</p>
            <p className="mt-3 text-sm text-slate-300">{analysis.summary}</p>

            <h4 className="mt-5 mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Factor breakdown</h4>
            <div className="grid gap-2 sm:grid-cols-2">
              {analysis.factors.map((f) => (
                <div key={f.label} className="rounded-lg border border-[var(--color-line)] bg-white/[0.02] p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-300">{f.label}</span>
                    <Badge tone={f.grade === "Good" ? "green" : f.grade === "Critical" ? "red" : "amber"}>{f.grade}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-slate-400">{f.note}</p>
                </div>
              ))}
            </div>

            <h4 className="mt-5 mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Recommended actions</h4>
            <ul className="space-y-1.5">
              {analysis.recommendations.map((r, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                  <ArrowRight size={15} className="mt-0.5 shrink-0 text-sky-400" /> {r}
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-6">
            <div className="card p-5">
              <h3 className="mb-3 flex items-center gap-2 font-semibold text-white">
                <TrendingUp size={16} className="text-emerald-400" /> 90-Day Projection
              </h3>
              {[
                { d: "30 days", v: analysis.projection.d30 },
                { d: "60 days", v: analysis.projection.d60 },
                { d: "90 days", v: analysis.projection.d90 },
              ].map((p) => (
                <div key={p.d} className="flex items-center justify-between border-t border-[var(--color-line)] py-2 first:border-0 text-sm">
                  <span className="text-slate-400">{p.d}</span>
                  <span className="font-bold text-emerald-400">~{p.v}</span>
                </div>
              ))}
            </div>

            <div className="card p-5">
              <h3 className="mb-2 flex items-center gap-2 font-semibold text-white">
                <Mail size={16} className="text-sky-400" /> Email to client
              </h3>
              {step === "sent" ? (
                <div className="flex flex-col items-center gap-2 py-4 text-center">
                  <CheckCircle2 size={32} className="text-emerald-400" />
                  <div className="text-sm font-medium text-white">Analysis emailed to {client.name}</div>
                  <div className="text-xs text-slate-400">{client.email}</div>
                  <Badge tone="green">Delivered · {new Date().toLocaleDateString()}</Badge>
                </div>
              ) : (
                <>
                  <p className="text-xs text-slate-400">
                    Sends a branded PDF + summary to <b className="text-slate-200">{client.email}</b> and logs it to their timeline.
                  </p>
                  <button
                    onClick={() => setStep("sent")}
                    className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg brand-gradient py-2.5 font-semibold text-white glow"
                  >
                    <Mail size={15} /> Send Analysis Email
                  </button>
                  <button
                    onClick={() => setStep("upload")}
                    className="mt-2 w-full rounded-lg border border-[var(--color-line)] py-2 text-xs text-slate-300 hover:bg-white/5"
                  >
                    Start over
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
