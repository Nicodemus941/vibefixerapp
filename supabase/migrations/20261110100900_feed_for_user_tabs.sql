-- ============================================
-- Feed parity, part 10: feed_for_user v2
-- ============================================
-- * view_mode: 'personalized' (For you, unchanged ranking), 'following'
--   (people the viewer follows, newest first), 'recent' (everyone, newest
--   first).
-- * Returns media, document, link_preview, repost_of_id, quoted_post_id.
-- * Blocks are enforced both ways, including on the original of a plain
--   repost.
-- * viewer_id must be the caller. Previously any signed in user (or anon)
--   could pass someone else's id and read that person's ranked feed.

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
  author_avatar_url TEXT,
  media JSONB,
  document JSONB,
  link_preview JSONB,
  repost_of_id UUID,
  quoted_post_id UUID
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  avg_emb VECTOR(1536);
  ranked BOOLEAN := false;
BEGIN
  IF auth.uid() IS NULL OR viewer_id IS DISTINCT FROM auth.uid() THEN
    RETURN;
  END IF;

  IF view_mode = 'personalized' THEN
    SELECT avg(n.embedding) INTO avg_emb
    FROM needs n WHERE n.user_id = viewer_id AND n.embedding IS NOT NULL;
    ranked := avg_emb IS NOT NULL;
  END IF;

  RETURN QUERY
  SELECT
    p.id, p.user_id, p.body, p.hashtags, p.kind, p.created_at,
    CASE WHEN ranked THEN (1 - (p.embedding <=> avg_emb))::REAL ELSE NULL::REAL END AS similarity,
    pr.display_name, pr.company_name, pr.industry, pr.avatar_url,
    p.media, p.document, p.link_preview, p.repost_of_id, p.quoted_post_id
  FROM posts p
  JOIN profiles pr ON pr.id = p.user_id
  WHERE p.kind IN ('need','offer','win')
    AND (tag_filter IS NULL OR tag_filter = ANY(p.hashtags))
    AND p.user_id <> viewer_id
    AND p.group_id IS NULL
    AND NOT users_blocked(viewer_id, p.user_id)
    AND (
      p.repost_of_id IS NULL
      OR NOT EXISTS (
        SELECT 1 FROM posts o
        WHERE o.id = p.repost_of_id
          AND (o.user_id = viewer_id OR users_blocked(viewer_id, o.user_id))
      )
    )
    AND (
      view_mode <> 'following'
      OR EXISTS (
        SELECT 1 FROM follows f
        WHERE f.follower_id = viewer_id AND f.following_id = p.user_id
      )
    )
    AND (NOT ranked OR p.embedding IS NOT NULL)
  ORDER BY
    CASE WHEN ranked THEN p.embedding <=> avg_emb END ASC NULLS LAST,
    p.created_at DESC
  LIMIT least(greatest(coalesce(limit_count, 30), 1), 100);
END;
$$;

REVOKE ALL ON FUNCTION feed_for_user(UUID, TEXT, INT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION feed_for_user(UUID, TEXT, INT, TEXT) TO authenticated;
