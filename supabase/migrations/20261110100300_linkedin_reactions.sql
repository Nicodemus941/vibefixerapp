-- ============================================
-- Feed parity, part 4: LinkedIn style reactions
-- ============================================
-- Like, Celebrate, Support, Insightful, Love, Funny. One reaction per user
-- per post (picking another one replaces it).
-- Existing rows are mapped, not dropped:
--   fire -> like, handshake -> support, in -> celebrate
-- If a user had several of the old kinds on one post, the most recent wins.

ALTER TABLE post_reactions DROP CONSTRAINT IF EXISTS post_reactions_kind_check;

UPDATE post_reactions SET kind = CASE kind
  WHEN 'fire' THEN 'like'
  WHEN 'handshake' THEN 'support'
  WHEN 'in' THEN 'celebrate'
  ELSE kind
END
WHERE kind IN ('fire','handshake','in');

DELETE FROM post_reactions r
USING post_reactions newer
WHERE r.post_id = newer.post_id
  AND r.user_id = newer.user_id
  AND r.kind <> newer.kind
  AND (coalesce(r.created_at, 'epoch'::timestamptz), r.kind)
    < (coalesce(newer.created_at, 'epoch'::timestamptz), newer.kind);

ALTER TABLE post_reactions DROP CONSTRAINT IF EXISTS post_reactions_pkey;
ALTER TABLE post_reactions ADD CONSTRAINT post_reactions_pkey PRIMARY KEY (post_id, user_id);

ALTER TABLE post_reactions ALTER COLUMN kind SET DEFAULT 'like';
ALTER TABLE post_reactions ADD CONSTRAINT post_reactions_kind_check
  CHECK (kind IN ('like','celebrate','support','insightful','love','funny'));

CREATE INDEX IF NOT EXISTS post_reactions_post_kind_idx ON post_reactions(post_id, kind);

-- Switching reaction is an UPDATE of your own row.
DROP POLICY IF EXISTS "post_reactions_update_own" ON post_reactions;
CREATE POLICY "post_reactions_update_own" ON post_reactions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Reacting requires an active account and a post you can see.
DROP POLICY IF EXISTS "post_reactions_write_own" ON post_reactions;
CREATE POLICY "post_reactions_write_own" ON post_reactions FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND viewer_is_active()
    AND EXISTS (SELECT 1 FROM posts p WHERE p.id = post_reactions.post_id)
  );
