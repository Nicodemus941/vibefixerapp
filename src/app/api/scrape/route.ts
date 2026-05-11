import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { normalizeUrl, slugify, shortId } from "@/lib/utils";
import { scrapeUrl } from "@/lib/firecrawl";
import { createJob, startJob, finishJob, setProjectStatus } from "@/lib/jobs";

export const runtime = "nodejs";
export const maxDuration = 60;

const BodySchema = z.object({
  url: z.string().min(3),
  consent: z.literal(true, { errorMap: () => ({ message: "Consent required" }) }),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  let normalizedUrl: string;
  try {
    normalizedUrl = normalizeUrl(parsed.data.url);
  } catch {
    return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
  }

  const slug = `${slugify(normalizedUrl)}-${shortId()}`;
  const ipAddress =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? req.headers.get("x-real-ip") ?? "unknown";
  const userAgent = req.headers.get("user-agent") ?? "unknown";

  const project = await prisma.project.create({
    data: {
      url: normalizedUrl,
      slug,
      status: "SCRAPING",
      consent: {
        create: { url: normalizedUrl, ipAddress, userAgent },
      },
    },
  });

  const job = await createJob(project.id, "SCRAPE");
  await startJob(job.id);

  try {
    const result = await scrapeUrl(normalizedUrl);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 90); // 90-day raw scrape retention.

    await prisma.scrape.create({
      data: {
        projectId: project.id,
        copy: result.copy,
        images: result.images,
        colors: result.colors,
        fonts: result.fonts,
        structure: result.structure,
        source: result.source,
        expiresAt,
      },
    });
    await finishJob(job.id, "SUCCEEDED");
    await setProjectStatus(project.id, "CLASSIFYING");

    return NextResponse.json({ projectId: project.id, slug: project.slug, source: result.source });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Scrape failed";
    await finishJob(job.id, "FAILED", message);
    await setProjectStatus(project.id, "FAILED");
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
