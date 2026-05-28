-- ============================================
-- Chunk A: Organizations + positions (employment tagging)
-- ============================================
-- First-class company entities. Users create an org, other users list
-- their employment by attaching a position to it. Org pages show how
-- many Loop founders work there and who they are.

CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE
    CHECK (slug ~ '^[a-z0-9][a-z0-9-]{1,39}$' AND slug !~ '--'),
  name TEXT NOT NULL
    CHECK (char_length(name) BETWEEN 1 AND 120),
  description TEXT
    CHECK (description IS NULL OR char_length(description) <= 4000),
  website TEXT
    CHECK (website IS NULL OR website ~* '^https?://'),
  logo_url TEXT,
  industry TEXT,
  size_band TEXT
    CHECK (size_band IS NULL
      OR size_band IN ('solo','2-10','11-50','51-200','201-500','501-1000','1000+')),
  headquarters TEXT,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  verified BOOLEAN NOT NULL DEFAULT false,
  member_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX organizations_name_trgm_idx ON organizations USING gin (name gin_trgm_ops);
CREATE INDEX organizations_industry_idx ON organizations(industry) WHERE industry IS NOT NULL;

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Anyone signed in can read orgs (public directory)
CREATE POLICY "organizations_read_all" ON organizations FOR SELECT
  USING (auth.role() = 'authenticated');

-- Anyone signed in can create one (becomes the creator)
CREATE POLICY "organizations_insert_self" ON organizations FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- Only the creator can edit (verified flag can only be set by admin via
-- the admin client, since RLS-bypass key is used there)
CREATE POLICY "organizations_update_creator" ON organizations FOR UPDATE
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

-- ============================================
-- Positions — employment history. Each position is a (user, org, title,
-- date range) tuple. Allows tagging an org by name even if no Loop page
-- exists yet (organization_name fallback), so users can list old jobs
-- at companies that may never get a /o/ page.
-- ============================================

CREATE TABLE positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  organization_name TEXT,
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 160),
  start_date DATE NOT NULL,
  end_date DATE,
  is_current BOOLEAN NOT NULL DEFAULT false,
  description TEXT CHECK (description IS NULL OR char_length(description) <= 2000),
  created_at TIMESTAMPTZ DEFAULT now(),

  -- At least one of (linked org, free-text org name) must be set
  CHECK (organization_id IS NOT NULL OR (organization_name IS NOT NULL AND char_length(trim(organization_name)) > 0)),
  -- End date can't precede start date
  CHECK (end_date IS NULL OR end_date >= start_date),
  -- Current positions don't have an end date
  CHECK (is_current = false OR end_date IS NULL)
);
CREATE INDEX positions_user_start_idx ON positions(user_id, start_date DESC);
CREATE INDEX positions_org_current_idx ON positions(organization_id, is_current)
  WHERE organization_id IS NOT NULL;

ALTER TABLE positions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "positions_read_all" ON positions FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "positions_insert_self" ON positions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "positions_update_self" ON positions FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "positions_delete_self" ON positions FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- Keep organizations.member_count in sync with current positions.
-- ============================================

CREATE OR REPLACE FUNCTION recount_org_members(target_org UUID)
RETURNS VOID
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  UPDATE organizations o
  SET member_count = (
    SELECT count(DISTINCT user_id)
    FROM positions
    WHERE organization_id = target_org AND is_current = true
  )
  WHERE o.id = target_org;
$$;

CREATE OR REPLACE FUNCTION sync_position_member_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.organization_id IS NOT NULL THEN
      PERFORM recount_org_members(NEW.organization_id);
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.organization_id IS NOT NULL THEN
      PERFORM recount_org_members(OLD.organization_id);
    END IF;
  ELSE
    IF OLD.organization_id IS DISTINCT FROM NEW.organization_id THEN
      IF OLD.organization_id IS NOT NULL THEN
        PERFORM recount_org_members(OLD.organization_id);
      END IF;
      IF NEW.organization_id IS NOT NULL THEN
        PERFORM recount_org_members(NEW.organization_id);
      END IF;
    ELSIF OLD.is_current IS DISTINCT FROM NEW.is_current THEN
      IF NEW.organization_id IS NOT NULL THEN
        PERFORM recount_org_members(NEW.organization_id);
      END IF;
    END IF;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER trg_positions_member_count
  AFTER INSERT OR UPDATE OR DELETE ON positions
  FOR EACH ROW EXECUTE FUNCTION sync_position_member_count();

-- ============================================
-- search_organizations — autocomplete for the position editor.
-- Uses trigram match on name with prefix preference.
-- ============================================

CREATE OR REPLACE FUNCTION search_organizations(query TEXT, limit_count INT DEFAULT 8)
RETURNS TABLE (
  id UUID,
  slug TEXT,
  name TEXT,
  industry TEXT,
  logo_url TEXT,
  member_count INT
)
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT o.id, o.slug, o.name, o.industry, o.logo_url, o.member_count
  FROM organizations o
  WHERE o.name ILIKE query || '%'
     OR o.name % query
  ORDER BY
    (o.name ILIKE query || '%') DESC,
    similarity(o.name, query) DESC,
    o.member_count DESC
  LIMIT limit_count;
$$;

GRANT EXECUTE ON FUNCTION search_organizations(TEXT, INT) TO authenticated;
