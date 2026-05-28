-- ============================================
-- LOOP: Documents — NDA + contracts + amendments
-- ============================================

CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  counterparty_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  parent_document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
  kind TEXT NOT NULL CHECK (kind IN ('nda','contract','amendment')),
  title TEXT NOT NULL,
  body_text TEXT NOT NULL,
  file_url TEXT,
  fields JSONB,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','signed','amended','void')),
  created_at TIMESTAMPTZ DEFAULT now(),
  signed_at TIMESTAMPTZ,
  voided_at TIMESTAMPTZ
);
CREATE INDEX documents_conv_idx ON documents(conversation_id, created_at DESC);
CREATE INDEX documents_creator_idx ON documents(creator_id);
CREATE INDEX documents_counterparty_idx ON documents(counterparty_id);
CREATE INDEX documents_parent_idx ON documents(parent_document_id);
CREATE INDEX documents_status_idx ON documents(status);

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "documents_read_participants" ON documents FOR SELECT
  USING (auth.uid() = creator_id OR auth.uid() = counterparty_id);

CREATE POLICY "documents_insert_participant" ON documents FOR INSERT
  WITH CHECK (
    auth.uid() = creator_id
    AND auth.uid() IN (creator_id, counterparty_id)
  );

CREATE POLICY "documents_update_participants_while_draft" ON documents FOR UPDATE
  USING (
    (auth.uid() = creator_id OR auth.uid() = counterparty_id)
    AND status = 'draft'
  );

-- ============================================
-- document_signatures — append-only audit trail
-- ============================================
CREATE TABLE document_signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  signed_name TEXT NOT NULL,
  user_agent TEXT,
  signed_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(document_id, user_id)
);
CREATE INDEX document_signatures_doc_idx ON document_signatures(document_id);

ALTER TABLE document_signatures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "document_sigs_read_participants" ON document_signatures FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM documents d
    WHERE d.id = document_signatures.document_id
      AND (auth.uid() = d.creator_id OR auth.uid() = d.counterparty_id)
  ));

CREATE POLICY "document_sigs_insert_own" ON document_signatures FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM documents d
      WHERE d.id = document_signatures.document_id
        AND (auth.uid() = d.creator_id OR auth.uid() = d.counterparty_id)
        AND d.status = 'draft'
    )
  );

-- ============================================
-- Flip document.status to 'signed' once both parties have signed.
-- ============================================
CREATE OR REPLACE FUNCTION check_document_fully_signed()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
DECLARE
  d RECORD;
  sig_count INT;
BEGIN
  SELECT id, creator_id, counterparty_id, status, parent_document_id
    INTO d
    FROM documents WHERE id = NEW.document_id;

  IF d.status != 'draft' THEN RETURN NEW; END IF;

  SELECT COUNT(DISTINCT user_id) INTO sig_count
  FROM document_signatures
  WHERE document_id = d.id
    AND user_id IN (d.creator_id, d.counterparty_id);

  IF sig_count >= 2 THEN
    UPDATE documents
    SET status = 'signed', signed_at = now()
    WHERE id = d.id;

    -- If this is an amendment, mark the parent as 'amended'.
    IF d.parent_document_id IS NOT NULL THEN
      UPDATE documents
      SET status = 'amended'
      WHERE id = d.parent_document_id
        AND status = 'signed';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_check_doc_signed ON document_signatures;
CREATE TRIGGER trg_check_doc_signed
  AFTER INSERT ON document_signatures
  FOR EACH ROW EXECUTE FUNCTION check_document_fully_signed();

-- ============================================
-- Add document notifications
-- ============================================
ALTER TABLE notifications
  DROP CONSTRAINT IF EXISTS notifications_kind_check;

ALTER TABLE notifications
  ADD CONSTRAINT notifications_kind_check
  CHECK (kind IN (
    'new_match','new_message','new_reaction','match_accepted',
    'new_comment','new_document','document_signed'
  ));

ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS related_document_id UUID REFERENCES documents(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS notifications_document_idx
  ON notifications(related_document_id) WHERE related_document_id IS NOT NULL;

-- Notify the counterparty when a new document is created.
CREATE OR REPLACE FUNCTION notify_new_document()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO notifications (
    user_id, kind, actor_id, related_document_id, related_conversation_id, payload
  )
  VALUES (
    NEW.counterparty_id,
    'new_document',
    NEW.creator_id,
    NEW.id,
    NEW.conversation_id,
    jsonb_build_object('kind', NEW.kind, 'title', NEW.title)
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_document_notify ON documents;
CREATE TRIGGER trg_document_notify
  AFTER INSERT ON documents
  FOR EACH ROW EXECUTE FUNCTION notify_new_document();

-- Notify the other party when a doc is fully signed.
CREATE OR REPLACE FUNCTION notify_document_signed()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.status = 'signed' AND COALESCE(OLD.status, '') != 'signed' THEN
    INSERT INTO notifications (user_id, kind, actor_id, related_document_id, related_conversation_id, payload)
    VALUES
      (NEW.creator_id, 'document_signed', NEW.counterparty_id, NEW.id, NEW.conversation_id,
        jsonb_build_object('kind', NEW.kind, 'title', NEW.title)),
      (NEW.counterparty_id, 'document_signed', NEW.creator_id, NEW.id, NEW.conversation_id,
        jsonb_build_object('kind', NEW.kind, 'title', NEW.title));
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_document_signed_notify ON documents;
CREATE TRIGGER trg_document_signed_notify
  AFTER UPDATE ON documents
  FOR EACH ROW EXECUTE FUNCTION notify_document_signed();

-- ============================================
-- Storage bucket for uploaded document files.
-- ============================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

-- Read policy: object name format "{conversation_id}/{document_id}/{filename}"
-- A user can read an object iff they're a participant in the underlying conversation.
CREATE POLICY "documents_storage_read" ON storage.objects FOR SELECT
  USING (
    bucket_id = 'documents'
    AND EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id::TEXT = split_part(name, '/', 1)
        AND (c.participant_a = auth.uid() OR c.participant_b = auth.uid())
    )
  );

CREATE POLICY "documents_storage_insert" ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'documents'
    AND EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id::TEXT = split_part(name, '/', 1)
        AND (c.participant_a = auth.uid() OR c.participant_b = auth.uid())
    )
  );

CREATE POLICY "documents_storage_delete" ON storage.objects FOR DELETE
  USING (
    bucket_id = 'documents'
    AND owner = auth.uid()
  );

-- Realtime
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE documents;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE document_signatures;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END IF;
END $$;
