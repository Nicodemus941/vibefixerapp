-- ============================================
-- Feed parity, part 9: post impressions ("N views", author only)
-- ============================================
-- One row per (post, viewer): a viewer counts at most once per post.
-- Authors never count their own views. Rows are write only for clients;
-- authors read totals through post_view_counts().

CREATE TABLE IF NOT EXISTS post_impressions (
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  viewer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (post_id, viewer_id)
);

ALTER TABLE post_impressions ENABLE ROW LEVEL SECURITY;

-- EXISTS runs under posts RLS (blocks apply).
CREATE POLICY "post_impressions_insert_own" ON post_impressions FOR INSERT
  WITH CHECK (
    auth.uid() = viewer_id
    AND EXISTS (
      SELECT 1 FROM posts p
      WHERE p.id = post_impressions.post_id AND p.user_id <> auth.uid()
    )
  );

CREATE OR REPLACE FUNCTION post_view_counts(post_ids UUID[])
RETURNS TABLE (post_id UUID, views BIGINT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT p.id, count(i.viewer_id)
  FROM posts p
  LEFT JOIN post_impressions i ON i.post_id = p.id
  WHERE auth.uid() IS NOT NULL
    AND p.user_id = auth.uid()
    AND p.id = ANY(post_ids)
  GROUP BY p.id;
$$;
REVOKE ALL ON FUNCTION post_view_counts(UUID[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION post_view_counts(UUID[]) TO authenticated;
