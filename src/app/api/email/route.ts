import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const BodySchema = z.object({
  email: z.string().email(),
  projectId: z.string().min(1),
  name: z.string().min(1).max(120).optional(),
});

// Captures email + attaches existing project to a (new or existing) user.
// Per Phase 1 brief: no sending yet. Just store.
export async function POST(req: NextRequest) {
  const parsed = BodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const { email, projectId, name } = parsed.data;

  const user = await prisma.user.upsert({
    where: { email },
    create: { email, name },
    update: { name: name ?? undefined },
  });

  const project = await prisma.project.update({
    where: { id: projectId },
    data: { userId: user.id },
    select: { id: true, slug: true },
  });

  return NextResponse.json({ userId: user.id, projectId: project.id, slug: project.slug });
}
