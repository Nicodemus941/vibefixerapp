-- ============================================
-- LOOP: Reciprocal Founder Marketplace Schema
-- Postgres + pgvector + Supabase Auth
-- ============================================

CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------- PROFILES ----------
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  company_name TEXT,
  company_url TEXT,
  bio TEXT,
  industry TEXT,
  revenue_band TEXT CHECK (revenue_band IN ('pre-revenue','0-10k','10k-100k','100k-1m','1m-10m','10m+')),
  tier TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free','pro','vault')),
  reputation_score NUMERIC DEFAULT 0,
  reciprocity_status TEXT DEFAULT 'active' CHECK (reciprocity_status IN ('active','warned','suspended')),
  last_need_posted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ---------- OFFERS (what users sell) ----------
CREATE TABLE offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  price_min NUMERIC,
  price_max NUMERIC,
  pricing_model TEXT CHECK (pricing_model IN ('hourly','fixed','retainer','equity','revshare')),
  is_active BOOLEAN DEFAULT TRUE,
  embedding VECTOR(1536),
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX offers_embedding_idx ON offers USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX offers_user_idx ON offers(user_id);

-- ---------- NEEDS (what users seek) ----------
CREATE TABLE needs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  budget_min NUMERIC,
  budget_max NUMERIC,
  urgency TEXT CHECK (urgency IN ('now','this_week','this_month','exploratory')),
  status TEXT DEFAULT 'open' CHECK (status IN ('open','matched','filled','closed')),
  embedding VECTOR(1536),
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX needs_embedding_idx ON needs USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX needs_user_idx ON needs(user_id);
CREATE INDEX needs_status_idx ON needs(status);

-- ---------- MATCHES (AI-generated daily) ----------
CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  need_id UUID NOT NULL REFERENCES needs(id) ON DELETE CASCADE,
  offer_id UUID NOT NULL REFERENCES offers(id) ON DELETE CASCADE,
  seeker_id UUID NOT NULL REFERENCES profiles(id),
  provider_id UUID NOT NULL REFERENCES profiles(id),
  match_score NUMERIC NOT NULL,
  ai_intro_draft TEXT,
  seeker_status TEXT DEFAULT 'pending' CHECK (seeker_status IN ('pending','accepted','passed')),
  provider_status TEXT DEFAULT 'pending' CHECK (provider_status IN ('pending','accepted','passed')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(need_id, offer_id)
);
CREATE INDEX matches_seeker_idx ON matches(seeker_id);
CREATE INDEX matches_provider_idx ON matches(provider_id);

-- ---------- ENGAGEMENTS (paid deals) ----------
CREATE TABLE engagements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID REFERENCES matches(id),
  seeker_id UUID NOT NULL REFERENCES profiles(id),
  provider_id UUID NOT NULL REFERENCES profiles(id),
  amount NUMERIC NOT NULL,
  platform_fee NUMERIC NOT NULL,
  stripe_payment_intent TEXT,
  escrow_status TEXT DEFAULT 'held' CHECK (escrow_status IN ('held','released','refunded','disputed')),
  delivery_due_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX engagements_provider_idx ON engagements(provider_id);
CREATE INDEX engagements_seeker_idx ON engagements(seeker_id);

-- ---------- REPUTATION EVENTS (append-only) ----------
CREATE TABLE reputation_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'deal_closed','on_time_delivery','late_delivery','dispute_won',
    'dispute_lost','reciprocity_kept','reciprocity_broken','five_star_review'
  )),
  delta NUMERIC NOT NULL,
  related_engagement UUID REFERENCES engagements(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX rep_user_idx ON reputation_events(user_id);

-- ---------- RECIPROCITY ENFORCER ----------
-- Run as a daily cron job (Supabase Edge Function or pg_cron)
CREATE OR REPLACE FUNCTION enforce_reciprocity()
RETURNS void AS $$
BEGIN
  UPDATE profiles
  SET reciprocity_status = 'warned'
  WHERE last_need_posted_at < now() - INTERVAL '21 days'
    AND reciprocity_status = 'active';

  UPDATE profiles
  SET reciprocity_status = 'suspended'
  WHERE last_need_posted_at < now() - INTERVAL '30 days'
    AND reciprocity_status = 'warned';
END;
$$ LANGUAGE plpgsql;

-- Auto-update last_need_posted_at when a need is created
CREATE OR REPLACE FUNCTION update_last_need_posted()
RETURNS trigger AS $$
BEGIN
  UPDATE profiles SET last_need_posted_at = now() WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_need_posted
AFTER INSERT ON needs
FOR EACH ROW EXECUTE FUNCTION update_last_need_posted();

-- ---------- ROW LEVEL SECURITY ----------
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE needs ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE engagements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_read_all" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "offers_read_all" ON offers FOR SELECT USING (is_active = true);
CREATE POLICY "offers_write_own" ON offers FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "needs_read_all" ON needs FOR SELECT USING (status = 'open');
CREATE POLICY "needs_write_own" ON needs FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "matches_read_participant" ON matches FOR SELECT
  USING (auth.uid() = seeker_id OR auth.uid() = provider_id);

CREATE POLICY "engagements_read_participant" ON engagements FOR SELECT
  USING (auth.uid() = seeker_id OR auth.uid() = provider_id);
