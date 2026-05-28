-- ============================================
-- Chunk B: Education + Certifications (resume layer)
-- ============================================
-- Mirrors `positions` for two more credential types. Same RLS model:
-- read-all (signed-in), CRUD by the owning user.

CREATE TABLE education (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  school_name TEXT NOT NULL
    CHECK (char_length(school_name) BETWEEN 1 AND 160),
  degree TEXT
    CHECK (degree IS NULL OR char_length(degree) <= 160),
  field_of_study TEXT
    CHECK (field_of_study IS NULL OR char_length(field_of_study) <= 160),
  start_year INT
    CHECK (start_year IS NULL OR (start_year BETWEEN 1900 AND 2100)),
  end_year INT
    CHECK (end_year IS NULL OR (end_year BETWEEN 1900 AND 2100)),
  description TEXT
    CHECK (description IS NULL OR char_length(description) <= 2000),
  created_at TIMESTAMPTZ DEFAULT now(),
  CHECK (end_year IS NULL OR start_year IS NULL OR end_year >= start_year)
);
CREATE INDEX education_user_idx ON education(user_id, end_year DESC NULLS FIRST);

ALTER TABLE education ENABLE ROW LEVEL SECURITY;
CREATE POLICY "education_read_all" ON education FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "education_insert_self" ON education FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "education_update_self" ON education FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "education_delete_self" ON education FOR DELETE USING (auth.uid() = user_id);

CREATE TABLE certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL
    CHECK (char_length(name) BETWEEN 1 AND 160),
  issuer TEXT
    CHECK (issuer IS NULL OR char_length(issuer) <= 160),
  issued_date DATE,
  expires_date DATE,
  credential_id TEXT
    CHECK (credential_id IS NULL OR char_length(credential_id) <= 120),
  credential_url TEXT
    CHECK (credential_url IS NULL OR credential_url ~* '^https?://'),
  description TEXT
    CHECK (description IS NULL OR char_length(description) <= 1000),
  created_at TIMESTAMPTZ DEFAULT now(),
  CHECK (expires_date IS NULL OR issued_date IS NULL OR expires_date >= issued_date)
);
CREATE INDEX certifications_user_idx ON certifications(user_id, issued_date DESC NULLS LAST);

ALTER TABLE certifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "certs_read_all" ON certifications FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "certs_insert_self" ON certifications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "certs_update_self" ON certifications FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "certs_delete_self" ON certifications FOR DELETE USING (auth.uid() = user_id);
