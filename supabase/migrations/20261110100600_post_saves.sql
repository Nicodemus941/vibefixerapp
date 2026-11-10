-- ============================================
-- Feed parity, part 7: saved posts (private bookmarks)
-- ============================================

CREATE TABLE IF NOT EXISTS post_saves (
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, post_id)
);
CREATE INDEX IF NOT EXISTS post_saves_user_created_idx ON post_saves(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS post_saves_post_idx ON post_saves(post_id);

ALTER TABLE post_saves ENABLE ROW LEVEL SECURITY;

CREATE POLICY "post_saves_read_own" ON post_saves FOR SELECT
  USING (auth.uid() = user_id);

-- The EXISTS runs under posts RLS: you can only save what you can see.
CREATE POLICY "post_saves_insert_own" ON post_saves FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (SELECT 1 FROM posts p WHERE p.id = post_saves.post_id)
  );

CREATE POLICY "post_saves_delete_own" ON post_saves FOR DELETE
  USING (auth.uid() = user_id);
