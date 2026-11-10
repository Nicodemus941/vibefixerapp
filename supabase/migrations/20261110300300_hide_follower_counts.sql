-- ============================================
-- Authentic network, part 3: no follower counts
-- ============================================
-- Following stays (it shapes the Following feed and ranking), but counts
-- are status, not help. Nobody sees another member's or company's
-- follower numbers. A member can still see their own followers.

-- People: rows are visible only to the two people in them. The owner of
-- a profile can list their own followers (following_id = me) and who they
-- follow. The feed, ranking and "connections at this company" read the
-- graph through SECURITY DEFINER functions and are unaffected.
DROP POLICY IF EXISTS "follows_read_all" ON follows;
CREATE POLICY "follows_read_own" ON follows FOR SELECT
  USING (auth.uid() = follower_id OR auth.uid() = following_id);

-- Counts only for yourself. Anyone else gets NULLs.
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
    CASE WHEN target_user = auth.uid() THEN
      (SELECT count(*) FROM follows WHERE following_id = target_user) END,
    CASE WHEN target_user = auth.uid() THEN
      (SELECT count(*) FROM follows WHERE follower_id = target_user) END,
    CASE WHEN target_user = auth.uid() THEN
      (SELECT count(*) FROM follows f1
         WHERE f1.follower_id = target_user
           AND EXISTS (SELECT 1 FROM follows f2
                       WHERE f2.follower_id = f1.following_id
                         AND f2.following_id = target_user)) END;
$$;
REVOKE ALL ON FUNCTION profile_social_counts(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION profile_social_counts(UUID) TO authenticated;

-- Companies: you can see your own org follows, not everyone's.
DROP POLICY IF EXISTS "org_follows_read_all" ON org_follows;
CREATE POLICY "org_follows_read_own" ON org_follows FOR SELECT
  USING (auth.uid() = follower_id);

-- The org follower count is no longer shown anywhere.
REVOKE ALL ON FUNCTION org_follower_count(UUID) FROM PUBLIC, anon, authenticated;
