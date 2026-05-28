-- ============================================
-- LOOP: Daily match engine
-- Pulls open needs, finds top-3 offers by cosine
-- similarity (filtered by budget + active status +
-- not-self + not-suspended), inserts into matches.
-- Idempotent thanks to UNIQUE(need_id, offer_id).
-- ============================================

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

-- ============================================
-- Schedule daily at 06:00 UTC.
-- ============================================
DO $$
DECLARE
  job_id BIGINT;
BEGIN
  SELECT jobid INTO job_id FROM cron.job WHERE jobname = 'loop_daily_matcher';
  IF job_id IS NOT NULL THEN
    PERFORM cron.unschedule(job_id);
  END IF;
  PERFORM cron.schedule(
    'loop_daily_matcher',
    '0 6 * * *',
    $cron$SELECT public.run_daily_matcher();$cron$
  );
END $$;

-- ============================================
-- View that the app uses to list pending matches
-- for a user (both seeker- and provider-side).
-- ============================================
CREATE OR REPLACE FUNCTION pending_matches_for(viewer_id UUID)
RETURNS TABLE (
  id UUID,
  role TEXT,
  match_score NUMERIC,
  created_at TIMESTAMPTZ,
  counterparty_id UUID,
  counterparty_name TEXT,
  counterparty_company TEXT,
  counterparty_industry TEXT,
  need_id UUID,
  need_title TEXT,
  need_urgency TEXT,
  offer_id UUID,
  offer_title TEXT,
  offer_category TEXT,
  seeker_status TEXT,
  provider_status TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT
    m.id,
    CASE WHEN m.seeker_id = viewer_id THEN 'seeker' ELSE 'provider' END AS role,
    m.match_score,
    m.created_at,
    CASE WHEN m.seeker_id = viewer_id THEN m.provider_id ELSE m.seeker_id END AS counterparty_id,
    pr.display_name,
    pr.company_name,
    pr.industry,
    n.id, n.title, n.urgency,
    o.id, o.title, o.category,
    m.seeker_status, m.provider_status
  FROM matches m
  JOIN needs n ON n.id = m.need_id
  JOIN offers o ON o.id = m.offer_id
  JOIN profiles pr
    ON pr.id = CASE WHEN m.seeker_id = viewer_id THEN m.provider_id ELSE m.seeker_id END
  WHERE (m.seeker_id = viewer_id OR m.provider_id = viewer_id)
    AND CASE
      WHEN m.seeker_id = viewer_id THEN m.seeker_status != 'passed'
      ELSE m.provider_status != 'passed'
    END
  ORDER BY m.created_at DESC, m.match_score DESC
  LIMIT 50;
$$;

GRANT EXECUTE ON FUNCTION pending_matches_for(UUID) TO authenticated;
