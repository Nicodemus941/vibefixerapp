-- ============================================
-- LOOP: Search — posts + people
-- ============================================

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Trigram GIN indexes for fast ILIKE.
CREATE INDEX IF NOT EXISTS posts_body_trgm_idx
  ON posts USING GIN (body gin_trgm_ops);

CREATE INDEX IF NOT EXISTS profiles_display_name_trgm_idx
  ON profiles USING GIN (display_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS profiles_company_trgm_idx
  ON profiles USING GIN (company_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS profiles_industry_trgm_idx
  ON profiles USING GIN (industry gin_trgm_ops);

-- ============================================
-- search_loop(query, limit_per_section):
-- Returns interleaved rows tagged with `kind`
-- so the app can split into Posts / People in a
-- single RPC round-trip.
-- ============================================
CREATE OR REPLACE FUNCTION search_loop(
  q TEXT,
  limit_per INT DEFAULT 8
)
RETURNS TABLE (
  kind TEXT,
  rank REAL,
  -- post fields
  post_id UUID,
  post_body TEXT,
  post_hashtags TEXT[],
  post_kind TEXT,
  post_created_at TIMESTAMPTZ,
  post_user_id UUID,
  -- person fields
  person_id UUID,
  person_display_name TEXT,
  person_company_name TEXT,
  person_industry TEXT,
  person_role TEXT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  pattern TEXT := '%' || lower(trim(q)) || '%';
BEGIN
  IF q IS NULL OR length(trim(q)) < 2 THEN
    RETURN;
  END IF;

  RETURN QUERY
  (
    SELECT
      'post'::TEXT AS kind,
      similarity(p.body, q)::REAL AS rank,
      p.id, p.body, p.hashtags, p.kind, p.created_at, p.user_id,
      NULL::UUID, NULL::TEXT, NULL::TEXT, NULL::TEXT, NULL::TEXT
    FROM posts p
    WHERE lower(p.body) LIKE pattern
       OR EXISTS (
         SELECT 1 FROM unnest(p.hashtags) tag
         WHERE lower(tag) LIKE pattern
       )
    ORDER BY similarity(p.body, q) DESC, p.created_at DESC
    LIMIT limit_per
  )
  UNION ALL
  (
    SELECT
      'person'::TEXT AS kind,
      GREATEST(
        similarity(coalesce(pr.display_name, ''), q),
        similarity(coalesce(pr.company_name, ''), q),
        similarity(coalesce(pr.industry, ''), q)
      )::REAL AS rank,
      NULL::UUID, NULL::TEXT, NULL::TEXT[], NULL::TEXT, NULL::TIMESTAMPTZ, NULL::UUID,
      pr.id, pr.display_name, pr.company_name, pr.industry, pr.role
    FROM profiles pr
    WHERE lower(coalesce(pr.display_name, '')) LIKE pattern
       OR lower(coalesce(pr.company_name, '')) LIKE pattern
       OR lower(coalesce(pr.industry, '')) LIKE pattern
       OR lower(coalesce(pr.bio, '')) LIKE pattern
    ORDER BY GREATEST(
      similarity(coalesce(pr.display_name, ''), q),
      similarity(coalesce(pr.company_name, ''), q),
      similarity(coalesce(pr.industry, ''), q)
    ) DESC
    LIMIT limit_per
  );
END;
$$;

GRANT EXECUTE ON FUNCTION search_loop(TEXT, INT) TO authenticated;
