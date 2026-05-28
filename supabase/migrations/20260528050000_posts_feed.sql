-- ============================================
-- LOOP: User posts + personalized feed
-- ============================================

CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  body TEXT NOT NULL CHECK (char_length(body) BETWEEN 1 AND 600),
  hashtags TEXT[] NOT NULL DEFAULT '{}',
  kind TEXT NOT NULL DEFAULT 'update'
    CHECK (kind IN ('update','need','offer','win')),
  embedding VECTOR(1536),
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX posts_user_idx ON posts(user_id);
CREATE INDEX posts_created_idx ON posts(created_at DESC);
CREATE INDEX posts_hashtags_idx ON posts USING GIN(hashtags);
CREATE INDEX posts_embedding_idx ON posts USING ivfflat (embedding vector_cosine_ops);

ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Anyone signed in can read posts (Loop is a small intentional community)
CREATE POLICY "posts_read_authenticated" ON posts FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "posts_insert_own" ON posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "posts_update_own" ON posts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "posts_delete_own" ON posts FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- feed_for_user(): returns posts ranked by
-- cosine similarity to the viewer's averaged
-- need embeddings. Falls back to chronological
-- if the viewer has no needs (new user).
-- ============================================

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
  author_industry TEXT
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
    -- Average the viewer's need embeddings (pgvector supports avg())
    SELECT avg(embedding) INTO avg_emb
    FROM needs WHERE needs.user_id = viewer_id AND embedding IS NOT NULL;
  END IF;

  IF avg_emb IS NULL THEN
    RETURN QUERY
    SELECT
      p.id, p.user_id, p.body, p.hashtags, p.kind, p.created_at,
      NULL::REAL AS similarity,
      pr.display_name, pr.company_name, pr.industry
    FROM posts p
    JOIN profiles pr ON pr.id = p.user_id
    WHERE (tag_filter IS NULL OR tag_filter = ANY(p.hashtags))
    ORDER BY p.created_at DESC
    LIMIT limit_count;
  ELSE
    RETURN QUERY
    SELECT
      p.id, p.user_id, p.body, p.hashtags, p.kind, p.created_at,
      (1 - (p.embedding <=> avg_emb))::REAL AS similarity,
      pr.display_name, pr.company_name, pr.industry
    FROM posts p
    JOIN profiles pr ON pr.id = p.user_id
    WHERE p.embedding IS NOT NULL
      AND (tag_filter IS NULL OR tag_filter = ANY(p.hashtags))
    ORDER BY p.embedding <=> avg_emb ASC, p.created_at DESC
    LIMIT limit_count;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION feed_for_user(UUID, TEXT, INT) TO authenticated, anon;

-- ============================================
-- Trending hashtags helper
-- ============================================

CREATE OR REPLACE FUNCTION trending_hashtags(
  since_hours INT DEFAULT 168,
  limit_count INT DEFAULT 10
)
RETURNS TABLE (tag TEXT, count BIGINT)
LANGUAGE sql
STABLE
SET search_path = public, pg_temp
AS $$
  SELECT lower(unnest(hashtags)) AS tag, COUNT(*) AS count
  FROM posts
  WHERE created_at > now() - (since_hours || ' hours')::INTERVAL
  GROUP BY tag
  ORDER BY count DESC, tag ASC
  LIMIT limit_count;
$$;

GRANT EXECUTE ON FUNCTION trending_hashtags(INT, INT) TO authenticated, anon;
