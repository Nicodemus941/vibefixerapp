-- ============================================
-- Authentic network, part 7: typed card data
-- ============================================
-- The Fable feed cards show wells on needs and offers and a deal strip on
-- shipped posts. This adds the data behind them:
--   * posts.details: small optional JSON for need and offer cards.
--     Need: budget, timeline, category. Offer: price, model, category.
--     Only short strings; the app validates keys, the check caps size.
--   * posts.engagement_id: a Shipped post can point at a released deal its
--     author was part of. A trigger enforces that.
--   * post_deal_strips(post_ids): the public facts of those deals (amount,
--     days to deliver, both names, the seeker's review). Hidden across a
--     block with either party.
--   * member_track_records(user_ids): deals delivered as provider and
--     average rating, for the "Track record" well on offers.
--     engagements RLS only shows a member their own deals, so this is a
--     SECURITY DEFINER aggregate with no amounts.

ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS details JSONB,
  ADD COLUMN IF NOT EXISTS engagement_id UUID REFERENCES engagements(id) ON DELETE SET NULL;

ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_details_shape;
ALTER TABLE posts
  ADD CONSTRAINT posts_details_shape
  CHECK (details IS NULL OR (jsonb_typeof(details) = 'object' AND octet_length(details::TEXT) <= 400));

CREATE INDEX IF NOT EXISTS posts_engagement_idx ON posts(engagement_id) WHERE engagement_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.validate_post_engagement()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.engagement_id IS NULL THEN RETURN NEW; END IF;
  IF TG_OP = 'UPDATE' AND NEW.engagement_id IS NOT DISTINCT FROM OLD.engagement_id THEN
    RETURN NEW;
  END IF;
  IF NEW.kind <> 'win' OR NOT EXISTS (
    SELECT 1 FROM engagements e
    WHERE e.id = NEW.engagement_id
      AND e.escrow_status = 'released'
      AND (e.seeker_id = NEW.user_id OR e.provider_id = NEW.user_id)
  ) THEN
    RAISE EXCEPTION 'You can only attach a released deal you were part of to a Shipped post.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_posts_engagement ON posts;
CREATE TRIGGER trg_posts_engagement
  BEFORE INSERT OR UPDATE OF engagement_id ON posts
  FOR EACH ROW EXECUTE FUNCTION validate_post_engagement();

CREATE OR REPLACE FUNCTION public.post_deal_strips(post_ids UUID[])
RETURNS TABLE (
  post_id UUID,
  amount NUMERIC,
  delivered_days INT,
  provider_id UUID,
  provider_name TEXT,
  seeker_id UUID,
  seeker_name TEXT,
  review_rating INT,
  review_body TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT
    p.id,
    e.amount,
    greatest(0, extract(day FROM (e.completed_at - e.created_at)))::INT,
    e.provider_id,
    pp.display_name,
    e.seeker_id,
    ps.display_name,
    rv.rating,
    rv.body
  FROM posts p
  JOIN engagements e ON e.id = p.engagement_id AND e.escrow_status = 'released'
  JOIN profiles pp ON pp.id = e.provider_id
  JOIN profiles ps ON ps.id = e.seeker_id
  LEFT JOIN LATERAL (
    SELECT r.rating, r.body FROM reviews r
    WHERE r.engagement_id = e.id AND r.reviewee_id = e.provider_id
    ORDER BY r.created_at DESC LIMIT 1
  ) rv ON true
  WHERE auth.uid() IS NOT NULL
    AND p.id = ANY(post_ids)
    AND p.kind = 'win'
    AND NOT blocked_with_viewer(p.user_id)
    AND NOT blocked_with_viewer(e.provider_id)
    AND NOT blocked_with_viewer(e.seeker_id);
$$;
REVOKE ALL ON FUNCTION public.post_deal_strips(UUID[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.post_deal_strips(UUID[]) TO authenticated;

CREATE OR REPLACE FUNCTION public.member_track_records(user_ids UUID[])
RETURNS TABLE (
  user_id UUID,
  deals_delivered BIGINT,
  avg_rating NUMERIC,
  review_count BIGINT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT
    u.id,
    (SELECT count(*) FROM engagements e
      WHERE e.provider_id = u.id AND e.escrow_status = 'released'),
    (SELECT round(avg(r.rating)::NUMERIC, 1) FROM reviews r WHERE r.reviewee_id = u.id),
    (SELECT count(*) FROM reviews r WHERE r.reviewee_id = u.id)
  FROM unnest(user_ids) AS u(id)
  WHERE auth.uid() IS NOT NULL
    AND NOT blocked_with_viewer(u.id);
$$;
REVOKE ALL ON FUNCTION public.member_track_records(UUID[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.member_track_records(UUID[]) TO authenticated;

-- ---------- right rail: people who can help with your needs ----------
-- Suggestions are about help, not popularity: members whose active offers
-- are closest to the viewer's open needs (embeddings), not already
-- followed, not blocked either way, not suspended. Falls back to members
-- with offers in the same categories as the viewer's needs.
CREATE OR REPLACE FUNCTION public.people_to_follow(limit_count INT DEFAULT 3)
RETURNS TABLE (
  user_id UUID,
  display_name TEXT,
  company_name TEXT,
  avatar_url TEXT,
  offer_title TEXT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  me UUID := auth.uid();
  need_emb VECTOR(1536);
BEGIN
  IF me IS NULL THEN RETURN; END IF;
  SELECT avg(n.embedding) INTO need_emb
  FROM needs n WHERE n.user_id = me AND n.status = 'open' AND n.embedding IS NOT NULL;

  RETURN QUERY
  WITH candidates AS (
    SELECT DISTINCT ON (o.user_id)
      o.user_id AS uid,
      o.title AS title,
      CASE WHEN need_emb IS NOT NULL AND o.embedding IS NOT NULL
           THEN 1 - (o.embedding <=> need_emb) END AS sim,
      EXISTS (
        SELECT 1 FROM needs n
        WHERE n.user_id = me AND n.status = 'open' AND n.category = o.category
      ) AS same_category
    FROM offers o
    WHERE o.is_active
      AND o.user_id <> me
      AND NOT users_blocked(me, o.user_id)
      AND NOT EXISTS (SELECT 1 FROM follows f WHERE f.follower_id = me AND f.following_id = o.user_id)
    ORDER BY o.user_id,
      CASE WHEN need_emb IS NOT NULL AND o.embedding IS NOT NULL
           THEN o.embedding <=> need_emb END ASC NULLS LAST
  )
  SELECT pr.id, pr.display_name, pr.company_name, pr.avatar_url, c.title
  FROM candidates c
  JOIN profiles pr ON pr.id = c.uid
  WHERE coalesce(pr.reciprocity_status, 'active') <> 'suspended'
    AND (coalesce(c.sim, 0) >= 0.5 OR c.same_category)
  ORDER BY coalesce(c.sim, 0) DESC, c.same_category DESC, pr.display_name
  LIMIT least(greatest(coalesce(limit_count, 3), 1), 10);
END;
$$;
REVOKE ALL ON FUNCTION public.people_to_follow(INT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.people_to_follow(INT) TO authenticated;
