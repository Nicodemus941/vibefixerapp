-- ============================================
-- Authentic network, part 6: "For you" puts help first
-- ============================================
-- feed_for_user v3. For view_mode 'personalized':
--   1. needs the viewer can help with (viewer's active offers vs the need,
--      cosine similarity >= 0.5, posted in the last 14 days),
--   2. offers that fit the viewer's open needs (same rules),
--   3. posts from people the viewer follows,
--   4. everything else,
-- newest first inside each group. Reactions, comments and reposts never
-- affect the order. 'following' and 'recent' are unchanged (newest first).
-- Adds rank_reason ('can_help' | 'fits_needs' | 'following' | NULL) so the
-- card can say why it is there. Mirrored in src/lib/feed-rank.ts.
-- Blocks are enforced both ways, including on the original of a repost.

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
  quoted_post_id UUID,
  rank_reason TEXT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  offer_emb VECTOR(1536);
  need_emb VECTOR(1536);
  personalized BOOLEAN := view_mode NOT IN ('following', 'recent');
BEGIN
  IF auth.uid() IS NULL OR viewer_id IS DISTINCT FROM auth.uid() THEN
    RETURN;
  END IF;

  IF personalized THEN
    SELECT avg(o.embedding) INTO offer_emb
    FROM offers o
    WHERE o.user_id = viewer_id AND o.is_active AND o.embedding IS NOT NULL;

    SELECT avg(n.embedding) INTO need_emb
    FROM needs n
    WHERE n.user_id = viewer_id AND n.status = 'open' AND n.embedding IS NOT NULL;
  END IF;

  RETURN QUERY
  WITH base AS (
    SELECT
      p.id AS b_id, p.user_id AS b_user_id, p.body AS b_body, p.hashtags AS b_hashtags,
      p.kind AS b_kind, p.created_at AS b_created_at,
      pr.display_name AS b_name, pr.company_name AS b_company, pr.industry AS b_industry,
      pr.avatar_url AS b_avatar,
      p.media AS b_media, p.document AS b_document, p.link_preview AS b_link_preview,
      p.repost_of_id AS b_repost_of_id, p.quoted_post_id AS b_quoted_post_id,
      CASE WHEN personalized AND offer_emb IS NOT NULL AND p.kind = 'need' AND p.embedding IS NOT NULL
           THEN (1 - (p.embedding <=> offer_emb))::REAL END AS help_sim,
      CASE WHEN personalized AND need_emb IS NOT NULL AND p.kind = 'offer' AND p.embedding IS NOT NULL
           THEN (1 - (p.embedding <=> need_emb))::REAL END AS fit_sim,
      EXISTS (
        SELECT 1 FROM follows f
        WHERE f.follower_id = viewer_id AND f.following_id = p.user_id
      ) AS followed
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
  ),
  ranked AS (
    SELECT
      b.*,
      CASE
        WHEN personalized AND b.b_created_at > now() - INTERVAL '14 days' AND b.help_sim >= 0.5 THEN 'can_help'
        WHEN personalized AND b.b_created_at > now() - INTERVAL '14 days' AND b.fit_sim >= 0.5 THEN 'fits_needs'
        WHEN b.followed THEN 'following'
        ELSE NULL
      END AS reason
    FROM base b
    WHERE view_mode <> 'following' OR b.followed
  )
  SELECT
    r.b_id, r.b_user_id, r.b_body, r.b_hashtags, r.b_kind, r.b_created_at,
    CASE WHEN r.reason = 'can_help' THEN r.help_sim
         WHEN r.reason = 'fits_needs' THEN r.fit_sim
         ELSE NULL::REAL END,
    r.b_name, r.b_company, r.b_industry, r.b_avatar,
    r.b_media, r.b_document, r.b_link_preview, r.b_repost_of_id, r.b_quoted_post_id,
    CASE WHEN personalized THEN r.reason
         WHEN r.followed THEN 'following'
         ELSE NULL END
  FROM ranked r
  ORDER BY
    CASE WHEN NOT personalized THEN 0
         WHEN r.reason = 'can_help' THEN 0
         WHEN r.reason = 'fits_needs' THEN 1
         WHEN r.reason = 'following' THEN 2
         ELSE 3 END ASC,
    r.b_created_at DESC
  LIMIT least(greatest(coalesce(limit_count, 30), 1), 100);
END;
$$;

REVOKE ALL ON FUNCTION feed_for_user(UUID, TEXT, INT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION feed_for_user(UUID, TEXT, INT, TEXT) TO authenticated;
