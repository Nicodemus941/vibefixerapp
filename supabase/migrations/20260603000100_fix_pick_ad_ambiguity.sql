-- pick_ad_for_viewer used unqualified `id` in WHERE which collided with
-- the RETURNS TABLE id output variable inside the function body.
-- Caught by the post-merge end-to-end test — every call errored with
-- "column reference id is ambiguous".

CREATE OR REPLACE FUNCTION pick_ad_for_viewer(viewer_id UUID)
RETURNS TABLE (id UUID, sponsor_id UUID, organization_id UUID,
  organization_slug TEXT, organization_name TEXT, organization_logo_url TEXT,
  headline TEXT, body TEXT, creative_url TEXT, cta_label TEXT, target_url TEXT)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, pg_temp
AS $$
DECLARE
  v_industry TEXT;
  v_revenue TEXT;
BEGIN
  SELECT p.industry, p.revenue_band INTO v_industry, v_revenue
  FROM profiles p WHERE p.id = viewer_id;
  RETURN QUERY
  SELECT a.id, a.sponsor_id, a.organization_id, o.slug, o.name, o.logo_url,
    a.headline, a.body, a.creative_url, a.cta_label, a.target_url
  FROM advertisements a LEFT JOIN organizations o ON o.id = a.organization_id
  WHERE a.status = 'active'
    AND a.budget_spent_cents < a.budget_total_cents
    AND (a.starts_at IS NULL OR a.starts_at <= now())
    AND (a.ends_at IS NULL OR a.ends_at > now())
    AND (a.target_industries IS NULL OR cardinality(a.target_industries) = 0 OR v_industry = ANY(a.target_industries))
    AND (a.target_revenue_bands IS NULL OR cardinality(a.target_revenue_bands) = 0 OR v_revenue = ANY(a.target_revenue_bands))
    AND a.sponsor_id != viewer_id
  ORDER BY
    (SELECT count(*) FROM ad_events ae WHERE ae.ad_id = a.id AND ae.viewer_id = pick_ad_for_viewer.viewer_id
       AND ae.event_type = 'impression' AND ae.created_at > now() - interval '24 hours') ASC,
    random()
  LIMIT 1;
END;
$$;
