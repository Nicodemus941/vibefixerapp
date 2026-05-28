-- ============================================
-- Follows graph + connections
-- ============================================
-- Asymmetric follow (no accept required) — minimum-friction discovery.
-- A "connection" is a mutual follow; the connection count + the per-org
-- "N of your connections work here" badge surface from this graph.

CREATE TABLE follows (
  follower_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (follower_id, following_id),
  CHECK (follower_id != following_id)
);
CREATE INDEX follows_following_idx ON follows(following_id);
CREATE INDEX follows_follower_created_idx ON follows(follower_id, created_at DESC);

ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

-- Everyone signed in can read follows (the graph is public — the
-- counts and "your connections" surfaces depend on it).
CREATE POLICY "follows_read_all" ON follows FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "follows_insert_self" ON follows FOR INSERT
  WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "follows_delete_self" ON follows FOR DELETE
  USING (auth.uid() = follower_id);

-- ============================================
-- profile_social_counts — followers / following / connections in one
-- query for a target user. Connections = mutual follow.
-- ============================================

CREATE OR REPLACE FUNCTION profile_social_counts(target_user UUID)
RETURNS TABLE (
  followers BIGINT,
  following BIGINT,
  connections BIGINT
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT
    (SELECT count(*) FROM follows WHERE following_id = target_user) AS followers,
    (SELECT count(*) FROM follows WHERE follower_id = target_user) AS following,
    (SELECT count(*) FROM follows f1
       WHERE f1.follower_id = target_user
         AND EXISTS (SELECT 1 FROM follows f2
                     WHERE f2.follower_id = f1.following_id
                       AND f2.following_id = target_user)) AS connections;
$$;
GRANT EXECUTE ON FUNCTION profile_social_counts(UUID) TO authenticated;

-- ============================================
-- viewer_connections_at_org — how many of the viewer's connections
-- (mutual follows) currently work at this org. Plus a list of the
-- first N for the org page member sort + "X of your connections" badge.
-- ============================================

CREATE OR REPLACE FUNCTION viewer_connections_at_org(viewer_id UUID, target_org UUID)
RETURNS BIGINT
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT count(DISTINCT p.user_id)
  FROM positions p
  JOIN follows f1 ON f1.following_id = p.user_id AND f1.follower_id = viewer_id
  JOIN follows f2 ON f2.follower_id = p.user_id AND f2.following_id = viewer_id
  WHERE p.organization_id = target_org
    AND p.is_current = true;
$$;
GRANT EXECUTE ON FUNCTION viewer_connections_at_org(UUID, UUID) TO authenticated;

-- ============================================
-- Notification on new follower.
-- ============================================

-- Widen notifications.kind CHECK to include 'new_follower'.
DO $$
BEGIN
  ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_kind_check;
  ALTER TABLE notifications ADD CONSTRAINT notifications_kind_check
    CHECK (kind IN (
      'new_match','match_accepted','new_message','new_reaction','new_comment',
      'new_document','document_signed','new_review','new_dispute','dispute_resolved',
      'new_follower'
    ));
EXCEPTION WHEN OTHERS THEN
  -- Constraint may have been absent in older schemas; ignore.
  NULL;
END $$;

CREATE OR REPLACE FUNCTION notify_new_follower()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO notifications (user_id, actor_id, kind, payload)
  VALUES (NEW.following_id, NEW.follower_id, 'new_follower', '{}'::jsonb);
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_follows_notify
  AFTER INSERT ON follows
  FOR EACH ROW EXECUTE FUNCTION notify_new_follower();
