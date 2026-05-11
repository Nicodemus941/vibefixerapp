import { prisma } from "./prisma";
import type { JobKind, JobStatus, ProjectStatus } from "@prisma/client";

export async function createJob(projectId: string, kind: JobKind) {
  return prisma.job.create({ data: { projectId, kind, status: "PENDING" } });
}

export async function startJob(id: string) {
  return prisma.job.update({
    where: { id },
    data: { status: "RUNNING", startedAt: new Date(), attempt: { increment: 1 } },
  });
}

export async function finishJob(id: string, status: Extract<JobStatus, "SUCCEEDED" | "FAILED">, error?: string) {
  return prisma.job.update({
    where: { id },
    data: { status, finishedAt: new Date(), error },
  });
}

export async function setProjectStatus(projectId: string, status: ProjectStatus) {
  return prisma.project.update({ where: { id: projectId }, data: { status } });
}
