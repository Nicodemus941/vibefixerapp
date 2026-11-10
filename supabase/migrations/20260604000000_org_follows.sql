-- ============================================
-- Follow organizations
-- ============================================
-- People-follow already exists (`follows` between profiles). Orgs need
-- their own follow graph because the foreign-key targets differ.
-- Mirrors the people-follow shape: asymmetric, public-readable graph,
-- self-insert / self-delete.

CREATE TABLE org_follows (
  follower_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (follower_id, organization_id)
);
CREATE INDEX org_follows_org_idx ON org_follows(organization_id);
CREATE INDEX org_follows_follower_created_idx ON org_follows(follower_id, created_at DESC);

ALTER TABLE org_follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_follows_read_all" ON org_follows FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "org_follows_insert_self" ON org_follows FOR INSERT
  WITH CHECK (auth.uid() = follower_id);

CREATE POLICY "org_follows_delete_self" ON org_follows FOR DELETE
  USING (auth.uid() = follower_id);

-- Counter helper. Could also be a denormalized counter on
-- organizations, but follower counts are cheap at scale with the
-- (organization_id) index and we already follow this pattern for
-- person-followers.
CREATE OR REPLACE FUNCTION org_follower_count(target_org UUID)
RETURNS BIGINT
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT count(*) FROM org_follows WHERE organization_id = target_org;
$$;
GRANT EXECUTE ON FUNCTION org_follower_count(UUID) TO authenticated;
