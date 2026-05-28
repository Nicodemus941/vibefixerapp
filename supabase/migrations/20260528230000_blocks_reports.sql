-- ============================================
-- LOOP: Blocks + Reports
-- ============================================

CREATE TABLE blocks (
  blocker_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (blocker_id, blocked_id),
  CHECK (blocker_id != blocked_id)
);
CREATE INDEX blocks_blocked_idx ON blocks(blocked_id);

ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "blocks_read_own" ON blocks FOR SELECT
  USING (auth.uid() = blocker_id);

CREATE POLICY "blocks_insert_own" ON blocks FOR INSERT
  WITH CHECK (auth.uid() = blocker_id);

CREATE POLICY "blocks_delete_own" ON blocks FOR DELETE
  USING (auth.uid() = blocker_id);

-- Reports
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
  target_kind TEXT NOT NULL CHECK (target_kind IN ('post','comment','user','message')),
  target_id UUID NOT NULL,
  reason TEXT NOT NULL CHECK (char_length(reason) BETWEEN 1 AND 2000),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','reviewed','dismissed')),
  reviewer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX reports_status_idx ON reports(status, created_at DESC);
CREATE INDEX reports_target_idx ON reports(target_kind, target_id);

ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Read: own reports OR admin/owner
CREATE POLICY "reports_read_own_or_admin" ON reports FOR SELECT
  USING (
    auth.uid() = reporter_id
    OR EXISTS (SELECT 1 FROM profiles pr WHERE pr.id = auth.uid() AND pr.role IN ('owner','admin'))
  );

CREATE POLICY "reports_insert_own" ON reports FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "reports_update_admin" ON reports FOR UPDATE
  USING (EXISTS (SELECT 1 FROM profiles pr WHERE pr.id = auth.uid() AND pr.role IN ('owner','admin')));

-- ============================================
-- Apply block filter to feed_for_user so blocked users disappear.
-- ============================================
DROP FUNCTION IF EXISTS feed_for_user(UUID, TEXT, INT);

CREATE OR REPLACE FUNCTION feed_for_user(
  viewer_id UUID,
  tag_filter TEXT DEFAULT NULL,
  limit_count INT DEFAULT 30
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

GRANT EXECUTE ON FUNCTION feed_for_user(UUID, TEXT, INT) TO authenticated, anon;
