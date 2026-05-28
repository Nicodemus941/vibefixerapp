-- ============================================
-- LOOP: Roles + owner account auto-assignment
-- ============================================

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user'
    CHECK (role IN ('user','owner','admin'));

CREATE INDEX IF NOT EXISTS profiles_role_idx ON profiles(role)
  WHERE role <> 'user';

-- Backfill: if the owner already signed up before this migration,
-- promote them now. (Loop.users not exposed; check auth.users.)
UPDATE profiles
SET role = 'owner'
WHERE id IN (
  SELECT id FROM auth.users
  WHERE lower(email) = lower('nicodemmebaptiste@convelabs.com')
);

-- Extend handle_new_user so future signups by the owner email
-- get role='owner' automatically. Existing function only sets
-- display_name; we also set role here.
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
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
      NEW.raw_user_meta_data->>'name',
      NEW.raw_user_meta_data->>'user_name',
      split_part(NEW.email, '@', 1)
    ),
    assigned_role
  )
  ON CONFLICT (id) DO UPDATE
  SET role = CASE
    -- Promote on conflict only if the role isn't already higher.
    WHEN EXCLUDED.role = 'owner' AND profiles.role <> 'owner' THEN 'owner'
    ELSE profiles.role
  END;
  RETURN NEW;
END;
$$;
