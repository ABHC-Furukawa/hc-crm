-- HC OS — Row Level Security (Phase 1)
-- tenants, users, call_leads, candidates, jobs, communications, resumes, resume_export_logs

-- ---------------------------------------------------------------------------
-- 1. ヘルパー関数
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.app_user_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT u.id
  FROM public.users u
  WHERE u.auth_id = auth.uid()::text
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.app_user_tenant_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT u.tenant_id
  FROM public.users u
  WHERE u.auth_id = auth.uid()::text
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.app_user_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT u.role::text
  FROM public.users u
  WHERE u.auth_id = auth.uid()::text
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.app_user_is_active()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT u.is_active FROM public.users u WHERE u.auth_id = auth.uid()::text LIMIT 1),
    false
  );
$$;

CREATE OR REPLACE FUNCTION public.app_is_develop()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.app_user_role() = 'DEVELOP' AND public.app_user_is_active();
$$;

CREATE OR REPLACE FUNCTION public.app_tenant_match(p_tenant_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.app_user_is_active()
    AND (
      public.app_is_develop()
      OR public.app_user_tenant_id() = p_tenant_id
    );
$$;

CREATE OR REPLACE FUNCTION public.app_can_access_candidate(p_candidate_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.candidates c
    JOIN public.users u ON u.auth_id = auth.uid()::text
    WHERE c.id = p_candidate_id
      AND c.deleted_at IS NULL
      AND u.is_active = true
      AND (
        u.role = 'DEVELOP'
        OR (u.role = 'ADMIN' AND c.tenant_id = u.tenant_id)
        OR (
          u.role = 'MANAGER'
          AND c.tenant_id = u.tenant_id
          AND (
            EXISTS (
              SELECT 1 FROM public.candidate_assignments ca
              WHERE ca.candidate_id = c.id
                AND ca.user_id = u.id
                AND ca.unassigned_at IS NULL
            )
            OR EXISTS (
              SELECT 1
              FROM public.candidate_assignments ca
              JOIN public.users adv ON adv.id = ca.user_id
              WHERE ca.candidate_id = c.id
                AND ca.unassigned_at IS NULL
                AND adv.manager_id = u.id
                AND adv.is_active = true
            )
          )
        )
        OR (
          u.role = 'ADVISOR'
          AND c.tenant_id = u.tenant_id
          AND EXISTS (
            SELECT 1 FROM public.candidate_assignments ca
            WHERE ca.candidate_id = c.id
              AND ca.user_id = u.id
              AND ca.unassigned_at IS NULL
          )
        )
      )
  );
$$;

CREATE OR REPLACE FUNCTION public.app_can_access_resume(p_resume_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.resumes r
    JOIN public.users u ON u.auth_id = auth.uid()::text
    WHERE r.id = p_resume_id
      AND r.deleted_at IS NULL
      AND u.is_active = true
      AND (
        u.role = 'DEVELOP'
        OR (
          r.tenant_id = u.tenant_id
          AND (
            (r.candidate_id IS NOT NULL AND public.app_can_access_candidate(r.candidate_id))
            OR (
              r.candidate_id IS NULL
              AND (
                u.role IN ('ADMIN', 'MANAGER')
                OR r.created_by_id = u.id
              )
            )
          )
        )
      )
  );
$$;

CREATE OR REPLACE FUNCTION public.app_can_read_user(p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.users reader
    JOIN public.users target ON target.id = p_user_id
    WHERE reader.auth_id = auth.uid()::text
      AND reader.is_active = true
      AND (
        reader.id = target.id
        OR reader.role = 'DEVELOP'
        OR (
          reader.role = 'ADMIN'
          AND reader.tenant_id = target.tenant_id
        )
        OR (
          reader.tenant_id = target.tenant_id
          AND target.is_active = true
        )
      )
  );
$$;

-- ---------------------------------------------------------------------------
-- 2. RLS 有効化
-- ---------------------------------------------------------------------------

ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resume_export_logs ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- 3. tenants
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS tenants_select ON public.tenants;
DROP POLICY IF EXISTS tenants_insert ON public.tenants;
DROP POLICY IF EXISTS tenants_update ON public.tenants;

CREATE POLICY tenants_select ON public.tenants
  FOR SELECT TO authenticated
  USING (
    public.app_user_is_active()
    AND (
      public.app_is_develop()
      OR id = public.app_user_tenant_id()
    )
  );

CREATE POLICY tenants_insert ON public.tenants
  FOR INSERT TO authenticated
  WITH CHECK (public.app_is_develop());

CREATE POLICY tenants_update ON public.tenants
  FOR UPDATE TO authenticated
  USING (
    public.app_user_is_active()
    AND (
      public.app_is_develop()
      OR (public.app_user_role() = 'ADMIN' AND id = public.app_user_tenant_id())
    )
  )
  WITH CHECK (
    public.app_is_develop()
    OR (public.app_user_role() = 'ADMIN' AND id = public.app_user_tenant_id())
  );

-- ---------------------------------------------------------------------------
-- 4. users
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS users_select ON public.users;
DROP POLICY IF EXISTS users_insert ON public.users;
DROP POLICY IF EXISTS users_update ON public.users;
DROP POLICY IF EXISTS users_delete ON public.users;

CREATE POLICY users_select ON public.users
  FOR SELECT TO authenticated
  USING (public.app_can_read_user(id));

CREATE POLICY users_insert ON public.users
  FOR INSERT TO authenticated
  WITH CHECK (
    public.app_user_is_active()
    AND public.app_user_role() IN ('DEVELOP', 'ADMIN')
    AND (
      public.app_is_develop()
      OR tenant_id = public.app_user_tenant_id()
    )
  );

CREATE POLICY users_update ON public.users
  FOR UPDATE TO authenticated
  USING (
    public.app_user_is_active()
    AND (
      id = public.app_user_id()
      OR (
        public.app_user_role() IN ('DEVELOP', 'ADMIN')
        AND (public.app_is_develop() OR tenant_id = public.app_user_tenant_id())
      )
    )
  )
  WITH CHECK (
    public.app_user_is_active()
    AND (
      id = public.app_user_id()
      OR (
        public.app_user_role() IN ('DEVELOP', 'ADMIN')
        AND (public.app_is_develop() OR tenant_id = public.app_user_tenant_id())
      )
    )
  );

CREATE POLICY users_delete ON public.users
  FOR DELETE TO authenticated
  USING (
    public.app_user_is_active()
    AND public.app_user_role() IN ('DEVELOP', 'ADMIN')
    AND (public.app_is_develop() OR tenant_id = public.app_user_tenant_id())
    AND id <> public.app_user_id()
  );

-- ---------------------------------------------------------------------------
-- 5. call_leads
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS call_leads_select ON public.call_leads;
DROP POLICY IF EXISTS call_leads_insert ON public.call_leads;
DROP POLICY IF EXISTS call_leads_update ON public.call_leads;
DROP POLICY IF EXISTS call_leads_delete ON public.call_leads;

CREATE POLICY call_leads_select ON public.call_leads
  FOR SELECT TO authenticated
  USING (public.app_tenant_match(tenant_id));

CREATE POLICY call_leads_insert ON public.call_leads
  FOR INSERT TO authenticated
  WITH CHECK (public.app_tenant_match(tenant_id));

CREATE POLICY call_leads_update ON public.call_leads
  FOR UPDATE TO authenticated
  USING (public.app_tenant_match(tenant_id))
  WITH CHECK (public.app_tenant_match(tenant_id));

CREATE POLICY call_leads_delete ON public.call_leads
  FOR DELETE TO authenticated
  USING (
    public.app_tenant_match(tenant_id)
    AND public.app_user_role() IN ('DEVELOP', 'ADMIN')
  );

-- ---------------------------------------------------------------------------
-- 6. candidates
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS candidates_select ON public.candidates;
DROP POLICY IF EXISTS candidates_insert ON public.candidates;
DROP POLICY IF EXISTS candidates_update ON public.candidates;
DROP POLICY IF EXISTS candidates_delete ON public.candidates;

CREATE POLICY candidates_select ON public.candidates
  FOR SELECT TO authenticated
  USING (public.app_can_access_candidate(id));

CREATE POLICY candidates_insert ON public.candidates
  FOR INSERT TO authenticated
  WITH CHECK (
    public.app_user_is_active()
    AND public.app_tenant_match(tenant_id)
  );

CREATE POLICY candidates_update ON public.candidates
  FOR UPDATE TO authenticated
  USING (public.app_can_access_candidate(id))
  WITH CHECK (public.app_can_access_candidate(id));

CREATE POLICY candidates_delete ON public.candidates
  FOR DELETE TO authenticated
  USING (
    public.app_tenant_match(tenant_id)
    AND public.app_user_role() IN ('DEVELOP', 'ADMIN')
  );

-- ---------------------------------------------------------------------------
-- 7. jobs
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS jobs_select ON public.jobs;
DROP POLICY IF EXISTS jobs_insert ON public.jobs;
DROP POLICY IF EXISTS jobs_update ON public.jobs;
DROP POLICY IF EXISTS jobs_delete ON public.jobs;

CREATE POLICY jobs_select ON public.jobs
  FOR SELECT TO authenticated
  USING (public.app_tenant_match(tenant_id));

CREATE POLICY jobs_insert ON public.jobs
  FOR INSERT TO authenticated
  WITH CHECK (public.app_tenant_match(tenant_id));

CREATE POLICY jobs_update ON public.jobs
  FOR UPDATE TO authenticated
  USING (public.app_tenant_match(tenant_id))
  WITH CHECK (public.app_tenant_match(tenant_id));

CREATE POLICY jobs_delete ON public.jobs
  FOR DELETE TO authenticated
  USING (
    public.app_tenant_match(tenant_id)
    AND public.app_user_role() IN ('DEVELOP', 'ADMIN')
  );

-- ---------------------------------------------------------------------------
-- 8. communications
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS communications_select ON public.communications;
DROP POLICY IF EXISTS communications_insert ON public.communications;
DROP POLICY IF EXISTS communications_update ON public.communications;
DROP POLICY IF EXISTS communications_delete ON public.communications;

CREATE POLICY communications_select ON public.communications
  FOR SELECT TO authenticated
  USING (public.app_can_access_candidate(candidate_id));

CREATE POLICY communications_insert ON public.communications
  FOR INSERT TO authenticated
  WITH CHECK (public.app_can_access_candidate(candidate_id));

CREATE POLICY communications_update ON public.communications
  FOR UPDATE TO authenticated
  USING (public.app_can_access_candidate(candidate_id))
  WITH CHECK (public.app_can_access_candidate(candidate_id));

CREATE POLICY communications_delete ON public.communications
  FOR DELETE TO authenticated
  USING (
    public.app_user_role() IN ('DEVELOP', 'ADMIN')
    AND EXISTS (
      SELECT 1 FROM public.candidates c
      WHERE c.id = communications.candidate_id
        AND public.app_tenant_match(c.tenant_id)
    )
  );

-- ---------------------------------------------------------------------------
-- 9. resumes
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS resumes_select ON public.resumes;
DROP POLICY IF EXISTS resumes_insert ON public.resumes;
DROP POLICY IF EXISTS resumes_update ON public.resumes;
DROP POLICY IF EXISTS resumes_delete ON public.resumes;

CREATE POLICY resumes_select ON public.resumes
  FOR SELECT TO authenticated
  USING (public.app_can_access_resume(id));

CREATE POLICY resumes_insert ON public.resumes
  FOR INSERT TO authenticated
  WITH CHECK (
    public.app_user_is_active()
    AND public.app_tenant_match(tenant_id)
  );

CREATE POLICY resumes_update ON public.resumes
  FOR UPDATE TO authenticated
  USING (public.app_can_access_resume(id))
  WITH CHECK (public.app_can_access_resume(id));

CREATE POLICY resumes_delete ON public.resumes
  FOR DELETE TO authenticated
  USING (
    public.app_tenant_match(tenant_id)
    AND public.app_user_role() IN ('DEVELOP', 'ADMIN')
  );

-- ---------------------------------------------------------------------------
-- 10. resume_export_logs
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS resume_export_logs_select ON public.resume_export_logs;
DROP POLICY IF EXISTS resume_export_logs_insert ON public.resume_export_logs;

CREATE POLICY resume_export_logs_select ON public.resume_export_logs
  FOR SELECT TO authenticated
  USING (public.app_can_access_resume(resume_id));

CREATE POLICY resume_export_logs_insert ON public.resume_export_logs
  FOR INSERT TO authenticated
  WITH CHECK (
    public.app_can_access_resume(resume_id)
    AND exported_by_id = public.app_user_id()
  );
