-- ============================================
-- LOOP: Auth bootstrap, platform_events, onboarding flag
-- ============================================

-- ---------- profiles: add onboarding flag ----------
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS onboarding_complete BOOLEAN DEFAULT FALSE;

-- ---------- profiles: allow user to insert their own shell row ----------
-- (Belt-and-suspenders; the trigger below creates it automatically.)
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ---------- platform_events (append-only analytics) ----------
CREATE TABLE platform_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  payload JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX platform_events_user_idx ON platform_events(user_id);
CREATE INDEX platform_events_type_idx ON platform_events(event_type);

ALTER TABLE platform_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "platform_events_read_own" ON platform_events FOR SELECT
  USING (auth.uid() = user_id);

-- ---------- Auto-create profile shell on signup ----------
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'name',
      NEW.raw_user_meta_data->>'user_name',
      split_part(NEW.email, '@', 1)
    )
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
