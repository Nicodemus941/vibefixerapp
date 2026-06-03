-- ============================================
-- "Everyone" feed: a recency-only view alongside the personalized rank.
-- ============================================
-- Users want a way to see the global feed of all founders' posts, not
-- just posts ranked against their own needs. Adds a `view_mode` argument
-- to feed_for_user: 'personalized' keeps the existing behavior; 'recent'
-- returns posts ordered purely by created_at (still respecting blocks +
-- group_id IS NULL + viewer != author).

DROP FUNCTION IF EXISTS feed_for_user(UUID, TEXT, INT);
DROP FUNCTION IF EXISTS feed_for_user(UUID, TEXT, INT, TEXT);

CREATE OR REPLACE FUNCTION feed_for_user(
  viewer_id UUID,
  tag_filter TEXT DEFAULT NULL,
  limit_count INT DEFAULT 30,
  view_mode TEXT DEFAULT 'personalized'
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  body TEXT,
  hashtags TEXT[],
  kind TEXT,
  created_at TIMESTAMPTZ,
  similarity REAL,
  author_display_name TEXT,
  author_company_name TEXT,
  author_industry TEXT,
  author_avatar_url TEXT
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
  -- Global "Everyone" view: pure recency, no embedding ranking.
  IF view_mode = 'recent' THEN
    RETURN QUERY
    SELECT
      p.id, p.user_id, p.body, p.hashtags, p.kind, p.created_at,
      NULL::REAL AS similarity,
      pr.display_name, pr.company_name, pr.industry, pr.avatar_url
    FROM posts p
    JOIN profiles pr ON pr.id = p.user_id
    WHERE (tag_filter IS NULL OR tag_filter = ANY(p.hashtags))
      AND p.user_id != viewer_id
      AND NOT EXISTS (
        SELECT 1 FROM blocks b
        WHERE b.blocker_id = viewer_id AND b.blocked_id = p.user_id
      )
      AND p.group_id IS NULL
    ORDER BY p.created_at DESC
    LIMIT limit_count;
    RETURN;
  END IF;

  -- Personalized view (default) — ranks by similarity to avg of the
  -- viewer's needs, falls back to recency if they have no embeddings.
  SELECT COUNT(*) INTO need_count
  FROM needs WHERE needs.user_id = viewer_id AND embedding IS NOT NULL;

  IF need_count > 0 THEN
    SELECT avg(embedding) INTO avg_emb
    FROM needs WHERE needs.user_id = viewer_id AND embedding IS NOT NULL;
  END IF;

  IF avg_emb IS NULL THEN
    RETURN QUERY
    SELECT
      p.id, p.user_id, p.body, p.hashtags, p.kind, p.created_at,
      NULL::REAL AS similarity,
      pr.display_name, pr.company_name, pr.industry, pr.avatar_url
    FROM posts p
    JOIN profiles pr ON pr.id = p.user_id
    WHERE (tag_filter IS NULL OR tag_filter = ANY(p.hashtags))
      AND p.user_id != viewer_id
      AND NOT EXISTS (
        SELECT 1 FROM blocks b
        WHERE b.blocker_id = viewer_id AND b.blocked_id = p.user_id
      )
      AND p.group_id IS NULL
    ORDER BY p.created_at DESC
    LIMIT limit_count;
  ELSE
    RETURN QUERY
    SELECT
      p.id, p.user_id, p.body, p.hashtags, p.kind, p.created_at,
      (1 - (p.embedding <=> avg_emb))::REAL AS similarity,
      pr.display_name, pr.company_name, pr.industry, pr.avatar_url
    FROM posts p
    JOIN profiles pr ON pr.id = p.user_id
    WHERE p.embedding IS NOT NULL
      AND (tag_filter IS NULL OR tag_filter = ANY(p.hashtags))
      AND p.user_id != viewer_id
      AND NOT EXISTS (
        SELECT 1 FROM blocks b
        WHERE b.blocker_id = viewer_id AND b.blocked_id = p.user_id
      )
      AND p.group_id IS NULL
    ORDER BY p.embedding <=> avg_emb ASC, p.created_at DESC
    LIMIT limit_count;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION feed_for_user(UUID, TEXT, INT, TEXT) TO authenticated, anon;
