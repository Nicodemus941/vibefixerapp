-- ============================================
-- Open /jobs/[id] and /o/[slug] to anonymous reads for SEO
-- ============================================
-- Google can only index what it can crawl. The JobPosting and
-- Organization JSON-LD we ship are wasted while these pages auth-wall
-- crawlers. We open read on `job_listings` and `organizations`. The
-- people graph (`positions`, profile lookups for the member list)
-- stays authenticated so anonymous scrapers can't lift the employee
-- list out of an org page.

-- Job listings — full public read (status filter applied at the app layer).
DROP POLICY IF EXISTS "jobs_read_all" ON job_listings;
CREATE POLICY "jobs_read_public" ON job_listings FOR SELECT
  USING (true);

-- Organizations — full public read.
DROP POLICY IF EXISTS "organizations_read_all" ON organizations;
CREATE POLICY "organizations_read_public" ON organizations FOR SELECT
  USING (true);
