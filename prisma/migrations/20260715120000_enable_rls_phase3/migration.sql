-- HC OS — Row Level Security (Phase 3)
-- Storage policies, schema privilege hardening, security documentation helpers

-- ---------------------------------------------------------------------------
-- 1. Storage: resume-photos バケット + パス検証ヘルパー
-- Path layout: {tenantId}/{candidateId|standalone}/{resumeId}/photo.{ext}
-- ---------------------------------------------------------------------------

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'resume-photos',
  'resume-photos',
  false,
  2097152,
  ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]
)
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

CREATE OR REPLACE FUNCTION public.app_can_read_resume_photo_storage(
  p_bucket_id text,
  p_object_name text
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, storage
AS $$
DECLARE
  v_segments text[];
  v_tenant_id uuid;
  v_resume_id uuid;
BEGIN
  IF p_bucket_id <> 'resume-photos' OR NOT public.app_user_is_active() THEN
    RETURN false;
  END IF;

  v_segments := storage.foldername(p_object_name);

  IF v_segments IS NULL OR array_length(v_segments, 1) < 3 THEN
    RETURN false;
  END IF;

  BEGIN
    v_tenant_id := v_segments[1]::uuid;
    v_resume_id := v_segments[3]::uuid;
  EXCEPTION
    WHEN invalid_text_representation THEN
      RETURN false;
  END;

  RETURN public.app_tenant_match(v_tenant_id)
    AND public.app_can_access_resume(v_resume_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.app_can_read_resume_photo_storage(text, text) TO authenticated;

-- storage.objects: authenticated は参照のみ（書込は service_role / サーバー経由）
DROP POLICY IF EXISTS resume_photos_select ON storage.objects;

CREATE POLICY resume_photos_select ON storage.objects
  FOR SELECT TO authenticated
  USING (public.app_can_read_resume_photo_storage(bucket_id, name));

-- ---------------------------------------------------------------------------
-- 2. public スキーマ権限の明示化（anon 拒否 / authenticated 最小許可）
-- RLS が実際のアクセス制御。GRANT は PostgREST 利用の前提条件。
-- ---------------------------------------------------------------------------

REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM anon;
REVOKE USAGE ON SCHEMA public FROM anon;

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON FUNCTIONS FROM anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT EXECUTE ON FUNCTIONS TO authenticated;

-- ---------------------------------------------------------------------------
-- 3. RLS 適用状況の検証用ビュー（Security Advisor 確認用）
-- ---------------------------------------------------------------------------

CREATE OR REPLACE VIEW public.app_rls_status AS
SELECT
  c.relname AS table_name,
  c.relrowsecurity AS rls_enabled,
  c.relforcerowsecurity AS rls_forced
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
  AND c.relname NOT LIKE '\_%' ESCAPE '\'
ORDER BY c.relname;

COMMENT ON VIEW public.app_rls_status IS
  'HC OS RLS audit view. All CRM tables should have rls_enabled = true.';

REVOKE ALL ON public.app_rls_status FROM anon;
GRANT SELECT ON public.app_rls_status TO authenticated;
