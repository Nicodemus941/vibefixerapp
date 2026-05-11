import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { prisma } from "@/lib/prisma";
import { AuditPdf } from "@/lib/pdf";
import type { RubricCategory } from "@/lib/rubric";

export const runtime = "nodejs";

export async function GET(_req: NextRequest, { params }: { params: { slug: string } }) {
  const project = await prisma.project.findUnique({
    where: { slug: params.slug },
    include: { audit: true },
  });
  if (!project || !project.audit) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const buffer = await renderToBuffer(
    AuditPdf({
      url: project.url,
      overallScore: project.audit.overallScore,
      scores: project.audit.scores as Record<RubricCategory, number>,
      recommendations: project.audit.recommendations as Parameters<typeof AuditPdf>[0]["recommendations"],
    }),
  );

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="rebuild-engine-audit-${project.slug}.pdf"`,
      "Cache-Control": "private, max-age=300",
    },
  });
}
