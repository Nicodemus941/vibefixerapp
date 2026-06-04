-- Profile reads should be limited to authenticated users only — the
-- previous policy `USING (true)` let anonymous visitors read every
-- founder's display_name, company, industry, bio, revenue_band, and
-- reputation_score. Caught by the post-merge end-to-end test.

DROP POLICY IF EXISTS "profiles_read_all" ON profiles;
CREATE POLICY "profiles_read_authenticated" ON profiles FOR SELECT
  USING (auth.role() = 'authenticated');
