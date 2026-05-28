-- ============================================
-- LOOP: Stripe Connect — Express accounts + payment intents
-- ============================================

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS stripe_account_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_account_status TEXT NOT NULL DEFAULT 'none'
    CHECK (stripe_account_status IN ('none','onboarding','active','disabled'));

CREATE INDEX IF NOT EXISTS profiles_stripe_account_idx ON profiles(stripe_account_id)
  WHERE stripe_account_id IS NOT NULL;

ALTER TABLE engagements
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_charge_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_transfer_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_refund_id TEXT;

-- Distinguish paid (real Stripe) from manual (logical escrow we shipped before).
ALTER TABLE engagements
  ADD COLUMN IF NOT EXISTS payment_method TEXT NOT NULL DEFAULT 'manual'
    CHECK (payment_method IN ('manual','stripe'));

CREATE INDEX IF NOT EXISTS engagements_payment_intent_idx
  ON engagements(stripe_payment_intent_id)
  WHERE stripe_payment_intent_id IS NOT NULL;
