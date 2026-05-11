import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { callClaudeJson } from "@/lib/anthropic";
import { env } from "@/lib/env";
import { AUDIT_SCHEMA, buildAuditSystem, buildAuditUser } from "@/lib/prompts/audit";
import { isArchetype } from "@/lib/archetypes";
import { weightedOverall, type AuditResult, type RubricCategory } from "@/lib/rubric";
import { createJob, startJob, finishJob, setProjectStatus } from "@/lib/jobs";

export const runtime = "nodejs";
export const maxDuration = 60;

// Hard ceiling per brief: <$0.50 per audit. Anything higher is a bug or runaway loop.
const COST_CEILING_CENTS = 50;

const BodySchema = z.object({ projectId: z.string().min(1) });

type AuditModelOutput = {
  scores: Record<RubricCategory, number>;
  findings: AuditResult["findings"];
  recommendations: AuditResult["recommendations"];
};

export async function POST(req: NextRequest) {
  const parsed = BodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const project = await prisma.project.findUnique({
    where: { id: parsed.data.projectId },
    include: { scrape: true, audit: true },
  });
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });
  if (!project.scrape) return NextResponse.json({ error: "Scrape not ready" }, { status: 409 });
  if (!project.archetype || !isArchetype(project.archetype)) {
    return NextResponse.json({ error: "Classification not ready" }, { status: 409 });
  }
  if (project.audit) {
    return NextResponse.json({ auditId: project.audit.id, slug: project.slug, cached: true });
  }

  const job = await createJob(project.id, "AUDIT");
  await startJob(job.id);

  try {
    const scrape = project.scrape as unknown as Parameters<typeof buildAuditUser>[0];
    const result = await callClaudeJson<AuditModelOutput>({
      model: env.anthropicAuditModel(),
      system: buildAuditSystem(project.archetype),
      user: buildAuditUser(scrape),
      schema: AUDIT_SCHEMA,
      maxTokens: 4096,
      cacheSystem: true,
    });

    if (result.costCents > COST_CEILING_CENTS) {
      throw new Error(`Audit exceeded cost ceiling: ${result.costCents}¢ > ${COST_CEILING_CENTS}¢`);
    }

    const overallScore = weightedOverall(result.data.scores);

    const audit = await prisma.audit.create({
      data: {
        projectId: project.id,
        scores: result.data.scores,
        overallScore,
        findings: result.data.findings,
        recommendations: result.data.recommendations,
        costCents: result.costCents,
        modelVersion: result.model,
      },
    });
    await finishJob(job.id, "SUCCEEDED");
    await setProjectStatus(project.id, "READY");

    return NextResponse.json({ auditId: audit.id, slug: project.slug, overallScore });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Audit failed";
    await finishJob(job.id, "FAILED", message);
    await setProjectStatus(project.id, "FAILED");
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
