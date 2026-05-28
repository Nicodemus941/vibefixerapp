-- ============================================
-- E2E follow-up: groups.created_by and reports.reporter_id were
-- NOT NULL, but their FKs cascade as ON DELETE SET NULL. When a user
-- deletes their account, Postgres tries to set the column to NULL
-- and fails the NOT NULL check, blocking the entire deletion.
-- Drop the NOT NULL so the SET NULL path actually works.
-- ============================================

ALTER TABLE groups  ALTER COLUMN created_by  DROP NOT NULL;
ALTER TABLE reports ALTER COLUMN reporter_id DROP NOT NULL;
