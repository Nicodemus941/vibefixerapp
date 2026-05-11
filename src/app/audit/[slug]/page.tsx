import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { CATEGORY_LABELS, RUBRIC_CATEGORIES, type RubricCategory } from "@/lib/rubric";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScoreBar } from "@/components/audit/score-bar";
import { CategoryCard } from "@/components/audit/category-card";

export const dynamic = "force-dynamic";

type Finding = {
  score: number;
  working: string;
  missing: string;
  recommendation: string;
};

type Recommendation = {
  category: RubricCategory;
  priority: "high" | "medium" | "low";
  action: string;
  rationale: string;
};

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const project = await prisma.project.findUnique({
    where: { slug: params.slug },
    include: { audit: { select: { overallScore: true } } },
  });
  if (!project) return { title: "Audit not found" };
  const score = project.audit?.overallScore ?? 0;
  return {
    title: `Your site scored ${score}/100 — Rebuild Engine`,
    description: `Conversion audit for ${project.url}. See the 10-category scorecard and the gaps to fix.`,
    openGraph: {
      title: `Your site scored ${score}/100`,
      description: `Conversion audit for ${project.url}.`,
      type: "article",
    },
  };
}

export default async function AuditPage({ params }: { params: { slug: string } }) {
  const project = await prisma.project.findUnique({
    where: { slug: params.slug },
    include: { audit: true },
  });
  if (!project || !project.audit) notFound();

  const scores = project.audit.scores as Record<RubricCategory, number>;
  const findings = project.audit.findings as Record<RubricCategory, Finding>;
  const recommendations = project.audit.recommendations as Recommendation[];

  return (
    <main className="container py-10 sm:py-16">
      <header className="flex flex-col items-start gap-2">
        <a href="/" className="text-sm text-muted-foreground hover:text-foreground">← Back</a>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Your audit</h1>
        <p className="text-sm text-muted-foreground break-all">{project.url}</p>
      </header>

      <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_2fr]">
        <Card>
          <CardHeader>
            <CardDescription>Overall score</CardDescription>
            <CardTitle>
              <span className="text-6xl font-semibold tracking-tight">{project.audit.overallScore}</span>
              <span className="ml-2 text-base text-muted-foreground">/ 100</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Button asChild size="lg">
              <a href={`/audit/${project.slug}/pdf`}>Download branded PDF</a>
            </Button>
            <Button variant="outline" size="lg" disabled>
              Get the rebuild · Free preview
            </Button>
            <p className="text-xs text-muted-foreground">
              Preview generation ships in the next release. You&apos;ll be notified.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Category breakdown</CardTitle>
            <CardDescription>Each scored 1–10 against our rebuild rubric.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {RUBRIC_CATEGORIES.map((c) => (
              <ScoreBar key={c} label={CATEGORY_LABELS[c]} score={scores[c]} />
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-semibold tracking-tight">Top recommendations</h2>
        <div className="mt-4 grid gap-3">
          {recommendations.map((r, i) => (
            <Card key={i}>
              <CardContent className="flex flex-col gap-1 pt-6">
                <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
                  <span
                    className={
                      r.priority === "high"
                        ? "rounded-full bg-destructive/15 px-2 py-0.5 text-destructive"
                        : r.priority === "medium"
                          ? "rounded-full bg-accent px-2 py-0.5"
                          : "rounded-full bg-secondary px-2 py-0.5"
                    }
                  >
                    {r.priority}
                  </span>
                  <span>{CATEGORY_LABELS[r.category]}</span>
                </div>
                <p className="mt-1 font-medium">{r.action}</p>
                <p className="text-sm text-muted-foreground">{r.rationale}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-semibold tracking-tight">Findings by category</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {RUBRIC_CATEGORIES.map((c) => (
            <CategoryCard key={c} category={c} finding={findings[c]} />
          ))}
        </div>
      </section>

      <section className="mt-12 rounded-xl border bg-card p-8 text-center">
        <h3 className="text-xl font-semibold tracking-tight">Ready to see the rebuild?</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          We&apos;ll rebuild your site against this audit, side-by-side, free to preview.
        </p>
        <Button disabled size="lg" className="mt-4">
          Get the rebuild · Coming soon
        </Button>
      </section>
    </main>
  );
}
