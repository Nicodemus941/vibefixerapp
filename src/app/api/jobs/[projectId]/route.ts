import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(_req: NextRequest, { params }: { params: { projectId: string } }) {
  const project = await prisma.project.findUnique({
    where: { id: params.projectId },
    select: {
      id: true,
      slug: true,
      status: true,
      archetype: true,
      audit: { select: { id: true, overallScore: true } },
      jobs: {
        orderBy: { createdAt: "asc" },
        select: { id: true, kind: true, status: true, error: true, finishedAt: true },
      },
    },
  });
  if (!project) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(project, { headers: { "Cache-Control": "no-store" } });
}
