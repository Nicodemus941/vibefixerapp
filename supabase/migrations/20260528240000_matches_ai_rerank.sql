-- ============================================
-- LOOP: Claude re-rank layer on top of the embedding matcher
-- ============================================
-- The cron matcher writes raw cosine-similarity matches into `matches`.
-- This migration extends the schema to record a second-pass Claude
-- judgment (rationale + draft intro + adjusted score) and exposes those
-- fields to the app via pending_matches_for.

ALTER TABLE matches ADD COLUMN IF NOT EXISTS ai_rationale TEXT;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS ai_reranked_at TIMESTAMPTZ;
ALTER TABLE matches ADD COLUMN IF NOT EXISTS ai_model TEXT;

CREATE INDEX IF NOT EXISTS matches_unreranked_idx
  ON matches(created_at DESC)
  WHERE ai_reranked_at IS NULL;

-- Re-create pending_matches_for to surface the AI fields.
DROP FUNCTION IF EXISTS pending_matches_for(UUID);

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
  provider_status TEXT,
  ai_intro_draft TEXT,
  ai_rationale TEXT,
  ai_reranked_at TIMESTAMPTZ
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
    m.seeker_status, m.provider_status,
    m.ai_intro_draft, m.ai_rationale, m.ai_reranked_at
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
