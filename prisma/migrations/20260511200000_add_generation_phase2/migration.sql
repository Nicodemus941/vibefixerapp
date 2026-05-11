-- Phase 2: Generation table (durable record of a rebuilt site).
-- One Generation per Project (latest). Status tracked here for UI; durable
-- step state lives in Inngest. RLS enabled to match deny-by-default invariant.

CREATE TYPE "GenerationStatus" AS ENUM (
  'QUEUED',
  'SPECCING',
  'MATERIALIZING',
  'PUSHING',
  'DEPLOYING',
  'READY',
  'FAILED'
);

CREATE TABLE "Generation" (
  "id"              TEXT NOT NULL,
  "projectId"       TEXT NOT NULL,
  "siteSpec"        JSONB NOT NULL,
  "githubRepoUrl"   TEXT,
  "vercelProjectId" TEXT,
  "previewUrl"      TEXT,
  "status"          "GenerationStatus" NOT NULL DEFAULT 'QUEUED',
  "costCents"       INTEGER NOT NULL DEFAULT 0,
  "modelVersion"    TEXT,
  "startedAt"       TIMESTAMP(3),
  "finishedAt"      TIMESTAMP(3),
  "error"           TEXT,
  "createdAt"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "Generation_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Generation_projectId_key" ON "Generation"("projectId");
CREATE INDEX "Generation_status_idx" ON "Generation"("status");

ALTER TABLE "Generation"
  ADD CONSTRAINT "Generation_projectId_fkey"
  FOREIGN KEY ("projectId") REFERENCES "Project"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Generation" ENABLE ROW LEVEL SECURITY;
