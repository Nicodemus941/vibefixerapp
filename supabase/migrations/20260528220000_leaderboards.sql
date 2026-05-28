-- ============================================
-- LOOP: Leaderboards + celebration feed events
-- ============================================

-- ----- Top closers (most deals shipped in window) -----
CREATE OR REPLACE FUNCTION leaderboard_top_closers(
  since_days INT DEFAULT 30,
  limit_count INT DEFAULT 10
)
RETURNS TABLE (
  user_id UUID,
  display_name TEXT,
  company_name TEXT,
  avatar_url TEXT,
  deals_shipped BIGINT,
  total_amount NUMERIC
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT
    pr.id AS user_id,
    pr.display_name,
    pr.company_name,
    pr.avatar_url,
    COUNT(*) AS deals_shipped,
    COALESCE(SUM(e.amount), 0)::NUMERIC AS total_amount
  FROM engagements e
  JOIN profiles pr ON pr.id = e.provider_id
  WHERE e.escrow_status = 'released'
    AND e.completed_at > now() - (since_days || ' days')::INTERVAL
  GROUP BY pr.id, pr.display_name, pr.company_name, pr.avatar_url
  ORDER BY deals_shipped DESC, total_amount DESC
  LIMIT limit_count;
$$;
GRANT EXECUTE ON FUNCTION leaderboard_top_closers(INT, INT) TO authenticated, anon;

-- ----- Top earners (sum amount released to provider in window) -----
CREATE OR REPLACE FUNCTION leaderboard_top_earners(
  since_days INT DEFAULT 30,
  limit_count INT DEFAULT 10
)
RETURNS TABLE (
  user_id UUID,
  display_name TEXT,
  company_name TEXT,
  avatar_url TEXT,
  earned NUMERIC,
  deals BIGINT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT
    pr.id AS user_id,
    pr.display_name,
    pr.company_name,
    pr.avatar_url,
    COALESCE(SUM(e.amount - e.platform_fee), 0)::NUMERIC AS earned,
    COUNT(*) AS deals
  FROM engagements e
  JOIN profiles pr ON pr.id = e.provider_id
  WHERE e.escrow_status = 'released'
    AND e.completed_at > now() - (since_days || ' days')::INTERVAL
  GROUP BY pr.id, pr.display_name, pr.company_name, pr.avatar_url
  ORDER BY earned DESC
  LIMIT limit_count;
$$;
GRANT EXECUTE ON FUNCTION leaderboard_top_earners(INT, INT) TO authenticated, anon;

-- ----- Top rated (reputation_score with at least 3 reviews) -----
CREATE OR REPLACE FUNCTION leaderboard_top_rated(
  limit_count INT DEFAULT 10
)
RETURNS TABLE (
  user_id UUID,
  display_name TEXT,
  company_name TEXT,
  avatar_url TEXT,
  reputation_score NUMERIC,
  review_count BIGINT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT
    pr.id AS user_id,
    pr.display_name,
    pr.company_name,
    pr.avatar_url,
    pr.reputation_score,
    COUNT(r.id) AS review_count
  FROM profiles pr
  LEFT JOIN reviews r ON r.reviewee_id = pr.id
  GROUP BY pr.id, pr.display_name, pr.company_name, pr.avatar_url, pr.reputation_score
  HAVING COUNT(r.id) >= 3
  ORDER BY pr.reputation_score DESC, COUNT(r.id) DESC
  LIMIT limit_count;
$$;
GRANT EXECUTE ON FUNCTION leaderboard_top_rated(INT, INT) TO authenticated, anon;

-- ============================================
-- Celebrations — auto-post feed_events for milestones.
-- ============================================
ALTER TABLE feed_events
  DROP CONSTRAINT IF EXISTS feed_events_event_type_check;

ALTER TABLE feed_events
  ADD CONSTRAINT feed_events_event_type_check
  CHECK (event_type IN (
    'match_closed','open_need','deal_shipped','top_closer',
    'reciprocity_streak','new_vault_member','first_deal','milestone_deals'
  ));

CREATE OR REPLACE FUNCTION celebrate_provider_milestones()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
  total INT;
BEGIN
  IF NEW.escrow_status = 'released' AND COALESCE(OLD.escrow_status, '') != 'released' THEN
    SELECT COUNT(*) INTO total
    FROM engagements
    WHERE provider_id = NEW.provider_id
      AND escrow_status = 'released';

    IF total = 1 THEN
      INSERT INTO feed_events (event_type, primary_user_id, related_engagement, headline, amount, visibility)
      VALUES ('first_deal', NEW.provider_id, NEW.id,
        'First deal shipped 🚀', NEW.amount, 'public');
    ELSIF total IN (5, 10, 25, 50, 100) THEN
      INSERT INTO feed_events (event_type, primary_user_id, related_engagement, headline, amount, visibility)
      VALUES ('milestone_deals', NEW.provider_id, NEW.id,
        total || ' deals shipped on Loop 🎉', NEW.amount, 'public');
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_celebrate_milestones ON engagements;
CREATE TRIGGER trg_celebrate_milestones
  AFTER UPDATE ON engagements
  FOR EACH ROW EXECUTE FUNCTION celebrate_provider_milestones();
