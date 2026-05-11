"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Loader2, ShieldCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";

type Stage = "idle" | "scraping" | "classifying" | "auditing" | "ready" | "error";

const STAGE_COPY: Record<Exclude<Stage, "idle" | "error">, { label: string; progress: number }> = {
  scraping: { label: "Analyzing your site…", progress: 33 },
  classifying: { label: "Detecting your industry…", progress: 66 },
  auditing: { label: "Scoring your UX…", progress: 92 },
  ready: { label: "Audit ready. Redirecting…", progress: 100 },
};

export function UrlFlow() {
  const [url, setUrl] = React.useState("");
  const [consent, setConsent] = React.useState(false);
  const [stage, setStage] = React.useState<Stage>("idle");
  const [error, setError] = React.useState<string | null>(null);

  const canSubmit = url.trim().length > 3 && consent && stage === "idle";

  async function run() {
    if (!canSubmit) return;
    setError(null);

    setStage("scraping");
    const scrapeRes = await fetch("/api/scrape", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ url, consent: true }),
    });
    if (!scrapeRes.ok) return fail(scrapeRes);
    const { projectId, slug } = (await scrapeRes.json()) as { projectId: string; slug: string };

    setStage("classifying");
    const classifyRes = await fetch("/api/classify", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ projectId }),
    });
    if (!classifyRes.ok) return fail(classifyRes);

    setStage("auditing");
    const auditRes = await fetch("/api/audit", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ projectId }),
    });
    if (!auditRes.ok) return fail(auditRes);

    setStage("ready");
    window.location.href = `/audit/${slug}`;
  }

  async function fail(res: Response) {
    let detail = "Something went wrong.";
    try {
      const j = (await res.json()) as { error?: string };
      if (j.error) detail = j.error;
    } catch {}
    setError(detail);
    setStage("error");
  }

  return (
    <div className="w-full max-w-2xl">
      <AnimatePresence mode="wait">
        {stage === "idle" || stage === "error" ? (
          <motion.div
            key="input"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex flex-col gap-4"
          >
            <div className="flex flex-col gap-3 sm:flex-row">
              <Input
                type="url"
                inputMode="url"
                placeholder="https://yourwebsite.com"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") run();
                }}
                className="text-base"
              />
              <Button size="lg" onClick={run} disabled={!canSubmit} className="sm:w-auto">
                Get my rebuild
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>

            <label className="flex items-start gap-3 text-sm text-muted-foreground">
              <Checkbox
                checked={consent}
                onCheckedChange={(v) => setConsent(v === true)}
                aria-label="Confirm authorization"
                className="mt-0.5"
              />
              <span>
                I confirm I own or have authorization to modify this website. By submitting, I grant
                a license to fetch and analyze its public content for the purpose of generating a
                rebuild.
              </span>
            </label>

            {error && (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="progress"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-3 rounded-xl border bg-card p-6"
          >
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <p className="font-medium">{STAGE_COPY[stage].label}</p>
            </div>
            <Progress value={STAGE_COPY[stage].progress} />
            <p className="text-sm text-muted-foreground">
              We&apos;re working through the rebuild engine. This usually takes under two minutes.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <p className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <ShieldCheck className="h-3.5 w-3.5" />
        Free preview. No credit card. We never publish anything without your approval.
      </p>
    </div>
  );
}
