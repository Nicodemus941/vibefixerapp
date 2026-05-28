-- ============================================
-- LOOP: Groups — niche communities founders can moderate
-- ============================================

CREATE TABLE groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9-]{2,40}$'),
  name TEXT NOT NULL CHECK (char_length(name) BETWEEN 2 AND 60),
  description TEXT,
  visibility TEXT NOT NULL DEFAULT 'public'
    CHECK (visibility IN ('public','private')),
  created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE SET NULL,
  member_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX groups_visibility_idx ON groups(visibility, created_at DESC);

CREATE TABLE group_members (
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner','moderator','member')),
  joined_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (group_id, user_id)
);
CREATE INDEX group_members_user_idx ON group_members(user_id);

ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES groups(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS posts_group_idx ON posts(group_id, created_at DESC)
  WHERE group_id IS NOT NULL;

-- ============================================
-- RLS
-- ============================================
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;

-- Anyone signed in can read public groups; private requires membership.
CREATE POLICY "groups_read" ON groups FOR SELECT
  USING (
    visibility = 'public'
    OR EXISTS (SELECT 1 FROM group_members gm WHERE gm.group_id = groups.id AND gm.user_id = auth.uid())
  );

CREATE POLICY "groups_insert_self" ON groups FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "groups_update_owner" ON groups FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM group_members gm
    WHERE gm.group_id = groups.id AND gm.user_id = auth.uid() AND gm.role = 'owner'
  ));

CREATE POLICY "groups_delete_owner" ON groups FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM group_members gm
    WHERE gm.group_id = groups.id AND gm.user_id = auth.uid() AND gm.role = 'owner'
  ));

-- Members rows: viewers see members of groups they can see.
CREATE POLICY "group_members_read" ON group_members FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM groups g
      WHERE g.id = group_members.group_id
        AND (g.visibility = 'public'
             OR EXISTS (SELECT 1 FROM group_members me
                        WHERE me.group_id = g.id AND me.user_id = auth.uid())))
  );

-- Join: anyone can join public; for private, only owner/mod can add.
CREATE POLICY "group_members_insert_self_public" ON group_members FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (SELECT 1 FROM groups g WHERE g.id = group_members.group_id AND g.visibility = 'public')
  );

CREATE POLICY "group_members_insert_by_mod" ON group_members FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM group_members me
            WHERE me.group_id = group_members.group_id
              AND me.user_id = auth.uid()
              AND me.role IN ('owner','moderator'))
  );

-- Leave: yourself, anytime (except owners can't leave their own group via UI).
CREATE POLICY "group_members_delete_self_or_mod" ON group_members FOR DELETE
  USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM group_members me
               WHERE me.group_id = group_members.group_id
                 AND me.user_id = auth.uid()
                 AND me.role IN ('owner','moderator'))
  );

-- Owner / mod can promote / demote members.
CREATE POLICY "group_members_update_by_mod" ON group_members FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM group_members me
    WHERE me.group_id = group_members.group_id
      AND me.user_id = auth.uid()
      AND me.role IN ('owner','moderator')
  ));

-- ============================================
-- Helpers: keep groups.member_count consistent + auto-add creator as owner.
-- ============================================
CREATE OR REPLACE FUNCTION groups_create_owner()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO group_members (group_id, user_id, role)
  VALUES (NEW.id, NEW.created_by, 'owner')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_groups_create_owner ON groups;
CREATE TRIGGER trg_groups_create_owner
  AFTER INSERT ON groups
  FOR EACH ROW EXECUTE FUNCTION groups_create_owner();

CREATE OR REPLACE FUNCTION group_members_bump_count()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE groups SET member_count = member_count + 1 WHERE id = NEW.group_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE groups SET member_count = GREATEST(0, member_count - 1) WHERE id = OLD.group_id;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_group_members_count ON group_members;
CREATE TRIGGER trg_group_members_count
  AFTER INSERT OR DELETE ON group_members
  FOR EACH ROW EXECUTE FUNCTION group_members_bump_count();
