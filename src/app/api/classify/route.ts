import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { callClaudeJson } from "@/lib/anthropic";
import { env } from "@/lib/env";
import { CLASSIFY_SYSTEM, CLASSIFY_SCHEMA, type ClassifyOutput } from "@/lib/prompts/classify";
import { isArchetype } from "@/lib/archetypes";
import { createJob, startJob, finishJob, setProjectStatus } from "@/lib/jobs";

export const runtime = "nodejs";
export const maxDuration = 60;

const BodySchema = z.object({ projectId: z.string().min(1) });

export async function POST(req: NextRequest) {
  const parsed = BodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const project = await prisma.project.findUnique({
    where: { id: parsed.data.projectId },
    include: { scrape: true },
  });
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });
  if (!project.scrape) return NextResponse.json({ error: "Scrape not ready" }, { status: 409 });

  // Idempotent: if already classified, return existing archetype.
  if (project.archetype) {
    return NextResponse.json({ archetype: project.archetype, cached: true });
  }

  const job = await createJob(project.id, "CLASSIFY");
  await startJob(job.id);

  const copy = project.scrape.copy as { title: string; description: string; headings: string[]; bodyText: string };
  const user = [
    `URL: ${project.url}`,
    `TITLE: ${copy.title}`,
    `DESCRIPTION: ${copy.description}`,
    `HEADINGS:\n${copy.headings.slice(0, 20).map((h) => `- ${h}`).join("\n")}`,
    `BODY EXCERPT:\n${copy.bodyText.slice(0, 3000)}`,
  ].join("\n\n");

  try {
    const result = await callClaudeJson<ClassifyOutput>({
      model: env.anthropicClassifyModel(),
      system: CLASSIFY_SYSTEM,
      user,
      schema: CLASSIFY_SCHEMA,
      maxTokens: 512,
      cacheSystem: true,
    });

    if (!isArchetype(result.data.archetype)) {
      throw new Error(`Model returned unknown archetype: ${result.data.archetype}`);
    }

    await prisma.project.update({
      where: { id: project.id },
      data: { archetype: result.data.archetype, status: "AUDITING" },
    });
    await finishJob(job.id, "SUCCEEDED");

    return NextResponse.json({
      archetype: result.data.archetype,
      confidence: result.data.confidence,
      rationale: result.data.rationale,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Classification failed";
    await finishJob(job.id, "FAILED", message);
    await setProjectStatus(project.id, "FAILED");
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
