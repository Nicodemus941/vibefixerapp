-- Enable RLS on all Phase 1 tables. No policies = deny all access via PostgREST/anon key.
-- App reaches these tables via Prisma using the direct DB connection, which bypasses RLS.
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Project" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Scrape" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Audit" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ConsentRecord" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Job" ENABLE ROW LEVEL SECURITY;
