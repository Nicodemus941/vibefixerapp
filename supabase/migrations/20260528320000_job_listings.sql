-- ============================================
-- Chunk C: Job listings + matching
-- ============================================
-- Postable from an organization page (or standalone) by any signed-in
-- user. Embedded with text-embedding-3-small so we can rank against a
-- viewer's needs vector — same matching pipeline the founder matcher
-- already uses.

CREATE TABLE job_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poster_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 160),
  description TEXT NOT NULL CHECK (char_length(description) BETWEEN 10 AND 8000),
  employment_type TEXT NOT NULL
    CHECK (employment_type IN ('full_time','part_time','contract','internship','volunteer')),
  remote_policy TEXT NOT NULL
    CHECK (remote_policy IN ('remote','hybrid','onsite')),
  location TEXT CHECK (location IS NULL OR char_length(location) <= 120),
  compensation_min NUMERIC CHECK (compensation_min IS NULL OR compensation_min >= 0),
  compensation_max NUMERIC CHECK (compensation_max IS NULL OR compensation_max >= 0),
  compensation_period TEXT
    CHECK (compensation_period IS NULL OR compensation_period IN ('hour','month','year','project')),
  currency TEXT NOT NULL DEFAULT 'USD',
  application_url TEXT
    CHECK (application_url IS NULL OR application_url ~* '^https?://'),
  application_email TEXT,
  embedding VECTOR(1536),
  status TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open','closed','filled')),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  CHECK (compensation_max IS NULL OR compensation_min IS NULL OR compensation_max >= compensation_min),
  CHECK (application_url IS NOT NULL OR application_email IS NOT NULL)
);
CREATE INDEX job_listings_status_created_idx ON job_listings(status, created_at DESC);
CREATE INDEX job_listings_org_idx ON job_listings(organization_id) WHERE organization_id IS NOT NULL;
CREATE INDEX job_listings_poster_idx ON job_listings(poster_id);

ALTER TABLE job_listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "jobs_read_all" ON job_listings FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "jobs_insert_own" ON job_listings FOR INSERT
  WITH CHECK (auth.uid() = poster_id);

CREATE POLICY "jobs_update_own" ON job_listings FOR UPDATE
  USING (auth.uid() = poster_id)
  WITH CHECK (auth.uid() = poster_id);

CREATE POLICY "jobs_delete_own" ON job_listings FOR DELETE
  USING (auth.uid() = poster_id);

-- ============================================
-- match_jobs_for_user — rank open jobs against the average of the
-- viewer's needs embeddings (the same signal the founder matcher uses).
-- Falls back to recency when the user has no embeddings yet.
-- Returns each row with a similarity score so the UI can decide whether
-- to surface "Recommended for you" vs "Latest jobs".
-- ============================================

CREATE OR REPLACE FUNCTION match_jobs_for_user(
  viewer_id UUID,
  limit_count INT DEFAULT 30
)
RETURNS TABLE (
  id UUID,
  poster_id UUID,
  organization_id UUID,
  organization_slug TEXT,
  organization_name TEXT,
  organization_logo_url TEXT,
  title TEXT,
  description TEXT,
  employment_type TEXT,
  remote_policy TEXT,
  location TEXT,
  compensation_min NUMERIC,
  compensation_max NUMERIC,
  compensation_period TEXT,
  currency TEXT,
  application_url TEXT,
  application_email TEXT,
  created_at TIMESTAMPTZ,
  similarity REAL
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  avg_emb VECTOR(1536);
  need_count INT;
BEGIN
  SELECT COUNT(*) INTO need_count
  FROM needs WHERE needs.user_id = viewer_id AND embedding IS NOT NULL;

  IF need_count > 0 THEN
    SELECT avg(embedding) INTO avg_emb
    FROM needs WHERE needs.user_id = viewer_id AND embedding IS NOT NULL;
  END IF;

  IF avg_emb IS NULL THEN
    RETURN QUERY
    SELECT
      j.id, j.poster_id, j.organization_id,
      o.slug, o.name, o.logo_url,
      j.title, j.description, j.employment_type, j.remote_policy, j.location,
      j.compensation_min, j.compensation_max, j.compensation_period, j.currency,
      j.application_url, j.application_email, j.created_at,
      NULL::REAL AS similarity
    FROM job_listings j
    LEFT JOIN organizations o ON o.id = j.organization_id
    WHERE j.status = 'open'
      AND (j.expires_at IS NULL OR j.expires_at > now())
    ORDER BY j.created_at DESC
    LIMIT limit_count;
  ELSE
    RETURN QUERY
    SELECT
      j.id, j.poster_id, j.organization_id,
      o.slug, o.name, o.logo_url,
      j.title, j.description, j.employment_type, j.remote_policy, j.location,
      j.compensation_min, j.compensation_max, j.compensation_period, j.currency,
      j.application_url, j.application_email, j.created_at,
      (1 - (j.embedding <=> avg_emb))::REAL AS similarity
    FROM job_listings j
    LEFT JOIN organizations o ON o.id = j.organization_id
    WHERE j.status = 'open'
      AND (j.expires_at IS NULL OR j.expires_at > now())
      AND j.embedding IS NOT NULL
    ORDER BY j.embedding <=> avg_emb ASC, j.created_at DESC
    LIMIT limit_count;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION match_jobs_for_user(UUID, INT) TO authenticated;
