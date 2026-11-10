-- ============================================
-- Feed parity, part 11: search_loop respects blocks and reposts
-- ============================================
-- search_loop is SECURITY DEFINER, so posts RLS doesn't apply to it. Add
-- the same filters the feed uses: no posts across a block (either way),
-- no group posts, and no plain reposts (they have no text of their own and
-- would otherwise match on the copied hashtags). People results are
-- unchanged.

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
    WHERE (lower(p.body) LIKE pattern
       OR EXISTS (
         SELECT 1 FROM unnest(p.hashtags) tag
         WHERE lower(tag) LIKE pattern
       ))
      AND p.group_id IS NULL
      AND p.repost_of_id IS NULL
      AND NOT users_blocked(auth.uid(), p.user_id)
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
