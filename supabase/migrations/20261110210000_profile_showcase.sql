-- ============================================
-- LOOP: Profile showcase (2026-11-10)
-- NOT APPLIED. Review, then apply with the Supabase CLI / dashboard.
--
-- Adds three owner curated profile sections plus proof links on
-- education and certifications:
--   profile_featured      links to articles, publications, press,
--                         podcasts, videos and the member's own work (max 12)
--   profile_achievements  things done, with optional proof link (max 20)
--   profile_goals         "Working toward" statements (max 5)
--   education.proof_url / education.document_url
--   certifications.document_url (credential_url already is the proof link)
--
-- RLS: signed in members can read, except across a block (either
-- direction, via blocked_with_viewer() from 20261110100000). Only the
-- owner can write. The public card /c/[id] reads with the service role on
-- the server (same as offers today) and applies the block check in app
-- code for signed in viewers.
--
-- Rows cascade from profiles(id), which cascades from auth.users, so
-- account deletion removes them.
--
-- The app tolerates this migration not being applied yet: reads fall back
-- to empty lists and the editors say the section is not enabled yet.
-- ============================================

-- ---------- profile_featured ----------
CREATE TABLE IF NOT EXISTS profile_featured (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  kind TEXT NOT NULL DEFAULT 'other'
    CHECK (kind IN ('article', 'publication', 'press', 'podcast', 'video', 'project', 'other')),
  title TEXT NOT NULL
    CHECK (char_length(title) BETWEEN 1 AND 200),
  url TEXT NOT NULL
    CHECK (char_length(url) <= 2000 AND url ~* '^https?://[^\s]+$'),
  publisher TEXT
    CHECK (publisher IS NULL OR char_length(publisher) <= 120),
  published_on DATE,
  description TEXT
    CHECK (description IS NULL OR char_length(description) <= 280),
  image_url TEXT
    CHECK (image_url IS NULL OR (char_length(image_url) <= 1000 AND image_url ~* '^https://')),
  position INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS profile_featured_user_idx ON profile_featured(user_id, position);

-- ---------- profile_achievements ----------
CREATE TABLE IF NOT EXISTS profile_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL
    CHECK (char_length(title) BETWEEN 1 AND 160),
  achieved_on DATE,
  issuer TEXT
    CHECK (issuer IS NULL OR char_length(issuer) <= 160),
  description TEXT
    CHECK (description IS NULL OR char_length(description) <= 1000),
  proof_url TEXT
    CHECK (proof_url IS NULL OR (char_length(proof_url) <= 2000 AND proof_url ~* '^https?://[^\s]+$')),
  position INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS profile_achievements_user_idx ON profile_achievements(user_id, position);

-- ---------- profile_goals ----------
CREATE TABLE IF NOT EXISTS profile_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  statement TEXT NOT NULL
    CHECK (char_length(statement) BETWEEN 1 AND 200),
  target_date DATE,
  help_text TEXT
    CHECK (help_text IS NULL OR char_length(help_text) <= 200),
  position INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS profile_goals_user_idx ON profile_goals(user_id, position);

-- ---------- per member caps ----------
-- Enforced in the database so a client can't bypass the app limit. The
-- advisory lock serialises concurrent inserts for one member.
CREATE OR REPLACE FUNCTION public.enforce_profile_section_cap()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  cap INT := TG_ARGV[0]::INT;
  n INT;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext(TG_TABLE_NAME || ':' || NEW.user_id::TEXT));
  EXECUTE format('SELECT count(*) FROM %I WHERE user_id = $1', TG_TABLE_NAME)
    INTO n USING NEW.user_id;
  IF n >= cap THEN
    RAISE EXCEPTION 'limit reached: % allows % items', TG_TABLE_NAME, cap
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.enforce_profile_section_cap() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS profile_featured_cap ON profile_featured;
CREATE TRIGGER profile_featured_cap BEFORE INSERT ON profile_featured
  FOR EACH ROW EXECUTE FUNCTION public.enforce_profile_section_cap('12');

DROP TRIGGER IF EXISTS profile_achievements_cap ON profile_achievements;
CREATE TRIGGER profile_achievements_cap BEFORE INSERT ON profile_achievements
  FOR EACH ROW EXECUTE FUNCTION public.enforce_profile_section_cap('20');

DROP TRIGGER IF EXISTS profile_goals_cap ON profile_goals;
CREATE TRIGGER profile_goals_cap BEFORE INSERT ON profile_goals
  FOR EACH ROW EXECUTE FUNCTION public.enforce_profile_section_cap('5');

-- ---------- RLS ----------
ALTER TABLE profile_featured ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE profile_goals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profile_featured_read" ON profile_featured;
CREATE POLICY "profile_featured_read" ON profile_featured FOR SELECT
  USING (auth.uid() IS NOT NULL AND NOT blocked_with_viewer(user_id));
DROP POLICY IF EXISTS "profile_featured_insert_self" ON profile_featured;
CREATE POLICY "profile_featured_insert_self" ON profile_featured FOR INSERT
  WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "profile_featured_update_self" ON profile_featured;
CREATE POLICY "profile_featured_update_self" ON profile_featured FOR UPDATE
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "profile_featured_delete_self" ON profile_featured;
CREATE POLICY "profile_featured_delete_self" ON profile_featured FOR DELETE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "profile_achievements_read" ON profile_achievements;
CREATE POLICY "profile_achievements_read" ON profile_achievements FOR SELECT
  USING (auth.uid() IS NOT NULL AND NOT blocked_with_viewer(user_id));
DROP POLICY IF EXISTS "profile_achievements_insert_self" ON profile_achievements;
CREATE POLICY "profile_achievements_insert_self" ON profile_achievements FOR INSERT
  WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "profile_achievements_update_self" ON profile_achievements;
CREATE POLICY "profile_achievements_update_self" ON profile_achievements FOR UPDATE
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "profile_achievements_delete_self" ON profile_achievements;
CREATE POLICY "profile_achievements_delete_self" ON profile_achievements FOR DELETE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "profile_goals_read" ON profile_goals;
CREATE POLICY "profile_goals_read" ON profile_goals FOR SELECT
  USING (auth.uid() IS NOT NULL AND NOT blocked_with_viewer(user_id));
DROP POLICY IF EXISTS "profile_goals_insert_self" ON profile_goals;
CREATE POLICY "profile_goals_insert_self" ON profile_goals FOR INSERT
  WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "profile_goals_update_self" ON profile_goals;
CREATE POLICY "profile_goals_update_self" ON profile_goals FOR UPDATE
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "profile_goals_delete_self" ON profile_goals;
CREATE POLICY "profile_goals_delete_self" ON profile_goals FOR DELETE
  USING (auth.uid() = user_id);

-- ---------- education + certifications: proof and document links ----------
ALTER TABLE education
  ADD COLUMN IF NOT EXISTS proof_url TEXT
    CHECK (proof_url IS NULL OR (char_length(proof_url) <= 2000 AND proof_url ~* '^https?://[^\s]+$')),
  ADD COLUMN IF NOT EXISTS document_url TEXT
    CHECK (document_url IS NULL OR (char_length(document_url) <= 2000 AND document_url ~* '^https?://[^\s]+$'));

ALTER TABLE certifications
  ADD COLUMN IF NOT EXISTS document_url TEXT
    CHECK (document_url IS NULL OR (char_length(document_url) <= 2000 AND document_url ~* '^https?://[^\s]+$'));

-- Same block rule as the new sections, so a blocked pair can't read each
-- other's credentials either.
DROP POLICY IF EXISTS "education_read_all" ON education;
CREATE POLICY "education_read_all" ON education FOR SELECT
  USING (auth.role() = 'authenticated' AND NOT blocked_with_viewer(user_id));

DROP POLICY IF EXISTS "certs_read_all" ON certifications;
CREATE POLICY "certs_read_all" ON certifications FOR SELECT
  USING (auth.role() = 'authenticated' AND NOT blocked_with_viewer(user_id));
