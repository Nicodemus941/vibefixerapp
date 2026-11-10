-- ============================================
-- LOOP: Company logos + covers, group covers (Fable redesign, 2026-11-10)
-- NOT APPLIED. Review, then apply after 20261110120000_profile_covers.sql
-- (group covers are stored in the "covers" bucket created there).
--
-- 1. organizations.cover_url  (logo_url already exists)
-- 2. groups.cover_url
-- 3. "org-logos" storage bucket: public read; write by the company page
--    owner (organizations.created_by) or a platform admin/owner.
--    Path convention: org-logos/{organization_id}/{logo|cover}-{ts}.{ext}
-- 4. Platform admins may update organization rows (so an admin can fix a
--    logo or cover for a company whose creator left).
-- ============================================

ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS cover_url TEXT
    CHECK (cover_url IS NULL OR cover_url ~* '^https://');

ALTER TABLE groups
  ADD COLUMN IF NOT EXISTS cover_url TEXT
    CHECK (cover_url IS NULL OR cover_url ~* '^https://');

-- Who may manage a company page's images.
CREATE OR REPLACE FUNCTION can_manage_org_media(org_id_text TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    EXISTS (
      SELECT 1 FROM organizations o
      WHERE o.id::TEXT = org_id_text
        AND o.created_by = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM profiles pr
      WHERE pr.id = auth.uid()
        AND pr.role IN ('owner', 'admin')
    );
$$;
REVOKE ALL ON FUNCTION can_manage_org_media(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION can_manage_org_media(TEXT) TO authenticated;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'org-logos',
  'org-logos',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
  SET public = EXCLUDED.public,
      file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "org_logos_storage_insert_manager" ON storage.objects;
CREATE POLICY "org_logos_storage_insert_manager" ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'org-logos'
    AND auth.uid() IS NOT NULL
    AND can_manage_org_media(split_part(name, '/', 1))
  );

DROP POLICY IF EXISTS "org_logos_storage_update_manager" ON storage.objects;
CREATE POLICY "org_logos_storage_update_manager" ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'org-logos'
    AND can_manage_org_media(split_part(name, '/', 1))
  )
  WITH CHECK (
    bucket_id = 'org-logos'
    AND can_manage_org_media(split_part(name, '/', 1))
  );

DROP POLICY IF EXISTS "org_logos_storage_delete_manager" ON storage.objects;
CREATE POLICY "org_logos_storage_delete_manager" ON storage.objects FOR DELETE
  USING (
    bucket_id = 'org-logos'
    AND can_manage_org_media(split_part(name, '/', 1))
  );

DROP POLICY IF EXISTS "organizations_update_platform_admin" ON organizations;
CREATE POLICY "organizations_update_platform_admin" ON organizations FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM profiles pr
            WHERE pr.id = auth.uid() AND pr.role IN ('owner', 'admin'))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM profiles pr
            WHERE pr.id = auth.uid() AND pr.role IN ('owner', 'admin'))
  );
