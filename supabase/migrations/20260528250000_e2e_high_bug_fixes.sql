-- ============================================
-- E2E test follow-up: fix four high-severity bugs
-- ============================================

-- BUG #1: handle_new_user did not recognize raw_user_meta_data.full_name,
-- so OAuth/magic-link signups that send the name under that key got
-- email-localpart as their display_name until they completed onboarding.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
DECLARE
  assigned_role TEXT;
BEGIN
  IF lower(NEW.email) = lower('nicodemmebaptiste@convelabs.com') THEN
    assigned_role := 'owner';
  ELSE
    assigned_role := 'user';
  END IF;

  INSERT INTO public.profiles (id, display_name, role)
  VALUES (
    NEW.id,
    COALESCE(
      NULLIF(trim(NEW.raw_user_meta_data->>'full_name'), ''),
      NULLIF(trim(NEW.raw_user_meta_data->>'name'), ''),
      NULLIF(trim(NEW.raw_user_meta_data->>'user_name'), ''),
      split_part(NEW.email, '@', 1)
    ),
    assigned_role
  )
  ON CONFLICT (id) DO UPDATE
  SET role = CASE
    WHEN EXCLUDED.role = 'owner' AND profiles.role <> 'owner' THEN 'owner'
    ELSE profiles.role
  END;
  RETURN NEW;
END;
$$;

-- BUG #2 + downstream #9: run_daily_matcher had no minimum similarity
-- threshold and stored even negative cosine pairs, surfacing -42% noise
-- matches to users + firing match notifications for them.
CREATE OR REPLACE FUNCTION run_daily_matcher()
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  inserted_count INT := 0;
  need_record RECORD;
  offer_record RECORD;
  -- Minimum cosine similarity required to insert a match. 0.5 is a
  -- reasonable floor: same-topic embeddings score ~0.95, mildly related
  -- ones land around 0.6, and unrelated topics fall well under 0.3.
  min_similarity CONSTANT REAL := 0.5;
BEGIN
  FOR need_record IN
    SELECT n.id, n.user_id, n.embedding, n.budget_max
    FROM needs n
    JOIN profiles pr ON pr.id = n.user_id
    WHERE n.status = 'open'
      AND n.embedding IS NOT NULL
      AND COALESCE(pr.reciprocity_status, 'active') != 'suspended'
  LOOP
    FOR offer_record IN
      SELECT
        o.id,
        o.user_id,
        o.price_min,
        (1 - (o.embedding <=> need_record.embedding))::REAL AS sim
      FROM offers o
      JOIN profiles pr ON pr.id = o.user_id
      WHERE o.is_active = true
        AND o.embedding IS NOT NULL
        AND o.user_id != need_record.user_id
        AND COALESCE(pr.reciprocity_status, 'active') != 'suspended'
        AND (1 - (o.embedding <=> need_record.embedding)) >= min_similarity
        AND (
          need_record.budget_max IS NULL
          OR o.price_min IS NULL
          OR need_record.budget_max >= o.price_min
        )
      ORDER BY o.embedding <=> need_record.embedding ASC
      LIMIT 3
    LOOP
      INSERT INTO matches (
        need_id, offer_id, seeker_id, provider_id, match_score, ai_intro_draft
      )
      VALUES (
        need_record.id,
        offer_record.id,
        need_record.user_id,
        offer_record.user_id,
        ROUND((offer_record.sim * 100)::NUMERIC, 2),
        NULL
      )
      ON CONFLICT (need_id, offer_id) DO NOTHING;

      IF FOUND THEN
        inserted_count := inserted_count + 1;
      END IF;
    END LOOP;
  END LOOP;

  RETURN inserted_count;
END;
$$;

GRANT EXECUTE ON FUNCTION run_daily_matcher() TO authenticated;

-- BUG #7: leaderboard_top_earners + leaderboard_top_closers were
-- referenced by the app but never deployed. /leaderboard would throw
-- on those tabs.

CREATE OR REPLACE FUNCTION leaderboard_top_earners(limit_count INT DEFAULT 10)
RETURNS TABLE (
  user_id UUID,
  display_name TEXT,
  company_name TEXT,
  avatar_url TEXT,
  total_earned NUMERIC,
  deal_count BIGINT
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
    COALESCE(SUM(e.amount - e.platform_fee), 0)::NUMERIC AS total_earned,
    COUNT(e.id) AS deal_count
  FROM profiles pr
  LEFT JOIN engagements e
    ON e.provider_id = pr.id
   AND e.escrow_status = 'released'
  GROUP BY pr.id, pr.display_name, pr.company_name, pr.avatar_url
  HAVING COUNT(e.id) >= 1
  ORDER BY total_earned DESC, deal_count DESC
  LIMIT limit_count;
$$;

GRANT EXECUTE ON FUNCTION leaderboard_top_earners(INT) TO authenticated;

CREATE OR REPLACE FUNCTION leaderboard_top_closers(limit_count INT DEFAULT 10)
RETURNS TABLE (
  user_id UUID,
  display_name TEXT,
  company_name TEXT,
  avatar_url TEXT,
  total_deals BIGINT,
  total_volume NUMERIC
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
    COUNT(e.id) AS total_deals,
    COALESCE(SUM(e.amount), 0)::NUMERIC AS total_volume
  FROM profiles pr
  LEFT JOIN engagements e
    ON (e.provider_id = pr.id OR e.seeker_id = pr.id)
   AND e.escrow_status = 'released'
  GROUP BY pr.id, pr.display_name, pr.company_name, pr.avatar_url
  HAVING COUNT(e.id) >= 1
  ORDER BY total_deals DESC, total_volume DESC
  LIMIT limit_count;
$$;

GRANT EXECUTE ON FUNCTION leaderboard_top_closers(INT) TO authenticated;
