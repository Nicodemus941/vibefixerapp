-- ============================================
-- Chunk D: Advertisement space
-- ============================================
-- Sponsored slots in the feed. Sponsors create ads with targeting +
-- a budget; ad_events log every impression/click; triggers keep
-- advertisements.impressions/clicks/budget_spent_cents in sync and
-- flip status to 'exhausted' when budget runs out.

CREATE TABLE advertisements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sponsor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  headline TEXT NOT NULL CHECK (char_length(headline) BETWEEN 1 AND 100),
  body TEXT NOT NULL CHECK (char_length(body) BETWEEN 1 AND 400),
  creative_url TEXT,
  cta_label TEXT NOT NULL DEFAULT 'Learn more' CHECK (char_length(cta_label) BETWEEN 1 AND 30),
  target_url TEXT NOT NULL CHECK (target_url ~* '^https?://'),

  -- Targeting (NULL means "any" — combined with AND)
  target_industries TEXT[],
  target_revenue_bands TEXT[],

  -- Budget in cents (Stripe-style)
  budget_total_cents INT NOT NULL CHECK (budget_total_cents > 0),
  budget_spent_cents INT NOT NULL DEFAULT 0 CHECK (budget_spent_cents >= 0),
  cost_per_impression_cents INT NOT NULL DEFAULT 1
    CHECK (cost_per_impression_cents > 0),

  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','active','paused','exhausted','archived')),
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,

  impressions INT NOT NULL DEFAULT 0,
  clicks INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CHECK (ends_at IS NULL OR starts_at IS NULL OR ends_at > starts_at)
);
CREATE INDEX advertisements_status_idx ON advertisements(status) WHERE status = 'active';
CREATE INDEX advertisements_sponsor_idx ON advertisements(sponsor_id);

ALTER TABLE advertisements ENABLE ROW LEVEL SECURITY;

-- Anyone signed in can see active ads (needed for feed injection).
-- Sponsors can see their own ads regardless of status.
CREATE POLICY "ads_read_active_or_own" ON advertisements FOR SELECT
  USING (status = 'active' OR auth.uid() = sponsor_id);

CREATE POLICY "ads_insert_own" ON advertisements FOR INSERT
  WITH CHECK (auth.uid() = sponsor_id);

CREATE POLICY "ads_update_own" ON advertisements FOR UPDATE
  USING (auth.uid() = sponsor_id)
  WITH CHECK (auth.uid() = sponsor_id);

-- ============================================
-- ad_events — impression + click log
-- ============================================

CREATE TABLE ad_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id UUID NOT NULL REFERENCES advertisements(id) ON DELETE CASCADE,
  viewer_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('impression','click')),
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX ad_events_ad_recent_idx ON ad_events(ad_id, created_at DESC);
CREATE INDEX ad_events_viewer_ad_idx ON ad_events(viewer_id, ad_id) WHERE viewer_id IS NOT NULL;

ALTER TABLE ad_events ENABLE ROW LEVEL SECURITY;

-- Anyone signed in can record their own events (logging impressions/clicks).
CREATE POLICY "ad_events_insert_self" ON ad_events FOR INSERT
  WITH CHECK (auth.uid() = viewer_id OR viewer_id IS NULL);

-- Only the sponsor can read their ad's events (for analytics).
CREATE POLICY "ad_events_read_sponsor" ON ad_events FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM advertisements a
    WHERE a.id = ad_events.ad_id AND a.sponsor_id = auth.uid()
  ));

-- ============================================
-- Trigger: on each ad_event, bump counters + budget. When budget runs
-- out, flip status to 'exhausted'.
-- ============================================

CREATE OR REPLACE FUNCTION sync_ad_counters()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  ad_row RECORD;
  new_spent INT;
BEGIN
  SELECT * INTO ad_row FROM advertisements WHERE id = NEW.ad_id;
  IF NOT FOUND THEN RETURN NEW; END IF;

  IF NEW.event_type = 'impression' THEN
    new_spent := ad_row.budget_spent_cents + ad_row.cost_per_impression_cents;
    UPDATE advertisements
    SET impressions = impressions + 1,
        budget_spent_cents = new_spent,
        status = CASE
          WHEN new_spent >= budget_total_cents THEN 'exhausted'
          ELSE status
        END,
        updated_at = now()
    WHERE id = NEW.ad_id;
  ELSE
    -- 'click' — counted but not billed in v1
    UPDATE advertisements
    SET clicks = clicks + 1, updated_at = now()
    WHERE id = NEW.ad_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_ad_events_sync
  AFTER INSERT ON ad_events
  FOR EACH ROW EXECUTE FUNCTION sync_ad_counters();

-- ============================================
-- pick_ad_for_viewer — return one active, in-budget, in-window ad that
-- targets the viewer (or has no targeting filters). Prefers ads the
-- viewer has seen the fewest times (soft frequency cap).
-- ============================================

CREATE OR REPLACE FUNCTION pick_ad_for_viewer(viewer_id UUID)
RETURNS TABLE (
  id UUID,
  sponsor_id UUID,
  organization_id UUID,
  organization_slug TEXT,
  organization_name TEXT,
  organization_logo_url TEXT,
  headline TEXT,
  body TEXT,
  creative_url TEXT,
  cta_label TEXT,
  target_url TEXT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_industry TEXT;
  v_revenue TEXT;
BEGIN
  SELECT industry, revenue_band INTO v_industry, v_revenue
  FROM profiles WHERE id = viewer_id;

  RETURN QUERY
  SELECT
    a.id, a.sponsor_id, a.organization_id, o.slug, o.name, o.logo_url,
    a.headline, a.body, a.creative_url, a.cta_label, a.target_url
  FROM advertisements a
  LEFT JOIN organizations o ON o.id = a.organization_id
  WHERE a.status = 'active'
    AND a.budget_spent_cents < a.budget_total_cents
    AND (a.starts_at IS NULL OR a.starts_at <= now())
    AND (a.ends_at IS NULL OR a.ends_at > now())
    -- Targeting: NULL/empty array means "any"
    AND (a.target_industries IS NULL OR cardinality(a.target_industries) = 0 OR v_industry = ANY(a.target_industries))
    AND (a.target_revenue_bands IS NULL OR cardinality(a.target_revenue_bands) = 0 OR v_revenue = ANY(a.target_revenue_bands))
    -- Don't show the viewer their own ad
    AND a.sponsor_id != viewer_id
  ORDER BY
    -- Prefer ads the viewer has seen fewer times today
    (SELECT count(*) FROM ad_events ae
       WHERE ae.ad_id = a.id AND ae.viewer_id = pick_ad_for_viewer.viewer_id
         AND ae.event_type = 'impression'
         AND ae.created_at > now() - interval '24 hours') ASC,
    random()
  LIMIT 1;
END;
$$;

GRANT EXECUTE ON FUNCTION pick_ad_for_viewer(UUID) TO authenticated;
