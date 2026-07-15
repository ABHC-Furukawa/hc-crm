-- HC OS — Row Level Security (Phase 2)
-- Candidate children, comms channels, call-lead children, masters, KPI, import logs

-- ---------------------------------------------------------------------------
-- 1. 追加ヘルパー関数
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.app_is_admin_or_develop()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.app_user_is_active()
    AND public.app_user_role() IN ('DEVELOP', 'ADMIN');
$$;

CREATE OR REPLACE FUNCTION public.app_can_access_call_lead(p_call_lead_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.call_leads cl
    WHERE cl.id = p_call_lead_id
      AND public.app_tenant_match(cl.tenant_id)
  );
$$;

CREATE OR REPLACE FUNCTION public.app_can_access_communication(p_communication_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.communications c
    WHERE c.id = p_communication_id
      AND public.app_can_access_candidate(c.candidate_id)
  );
$$;

CREATE OR REPLACE FUNCTION public.app_can_access_interview_prep(p_preparation_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.interview_preparations ip
    WHERE ip.id = p_preparation_id
      AND public.app_can_access_candidate(ip.candidate_id)
  );
$$;

CREATE OR REPLACE FUNCTION public.app_can_view_user_metrics(p_target_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.users viewer
    JOIN public.users target ON target.id = p_target_user_id
    WHERE viewer.auth_id = auth.uid()::text
      AND viewer.is_active = true
      AND target.is_active = true
      AND (
        viewer.role = 'DEVELOP'
        OR (viewer.role = 'ADMIN' AND target.tenant_id = viewer.tenant_id)
        OR (
          viewer.role = 'MANAGER'
          AND target.tenant_id = viewer.tenant_id
          AND (target.id = viewer.id OR target.manager_id = viewer.id)
        )
        OR (viewer.role = 'ADVISOR' AND target.id = viewer.id)
      )
  );
$$;

CREATE OR REPLACE FUNCTION public.app_can_view_team_metrics(p_tenant_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.app_tenant_match(p_tenant_id)
    AND public.app_user_role() IN ('DEVELOP', 'ADMIN', 'MANAGER');
$$;

CREATE OR REPLACE FUNCTION public.app_can_read_kpi_goal_row(p_tenant_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.app_user_is_active()
    AND public.app_tenant_match(p_tenant_id)
    AND (
      (p_user_id IS NULL AND public.app_can_view_team_metrics(p_tenant_id))
      OR (p_user_id IS NOT NULL AND public.app_can_view_user_metrics(p_user_id))
    );
$$;

CREATE OR REPLACE FUNCTION public.app_can_read_improvement_request(p_request_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.improvement_requests ir
    JOIN public.users u ON u.auth_id = auth.uid()::text
    WHERE ir.id = p_request_id
      AND u.is_active = true
      AND (
        u.role = 'DEVELOP'
        OR (ir.submitted_by_id = u.id AND public.app_tenant_match(ir.tenant_id))
      )
  );
$$;

CREATE OR REPLACE FUNCTION public.app_can_access_import_tenant(p_tenant_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.app_tenant_match(p_tenant_id)
    AND public.app_user_role() IN ('DEVELOP', 'ADMIN');
$$;

-- ---------------------------------------------------------------------------
-- 2. RLS 有効化
-- ---------------------------------------------------------------------------

ALTER TABLE public.candidate_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidate_job_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidate_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_preparations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.line_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.line_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_lead_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_lead_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_prep_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kpi_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_metrics_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.improvement_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.import_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.raw_call_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_lead_import_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.raw_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_import_logs ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- 3. 候補者配下（candidate_id ベース）
-- ---------------------------------------------------------------------------

DO $policy$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'candidate_assignments',
    'candidate_job_cases',
    'candidate_tags',
    'notes',
    'tasks',
    'activities',
    'files',
    'applications',
    'interview_preparations'
  ]
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I_select ON public.%I', t, t);
    EXECUTE format('DROP POLICY IF EXISTS %I_insert ON public.%I', t, t);
    EXECUTE format('DROP POLICY IF EXISTS %I_update ON public.%I', t, t);
    EXECUTE format('DROP POLICY IF EXISTS %I_delete ON public.%I', t, t);

    EXECUTE format(
      'CREATE POLICY %I_select ON public.%I FOR SELECT TO authenticated USING (public.app_can_access_candidate(candidate_id))',
      t, t
    );
    EXECUTE format(
      'CREATE POLICY %I_insert ON public.%I FOR INSERT TO authenticated WITH CHECK (public.app_can_access_candidate(candidate_id))',
      t, t
    );
    EXECUTE format(
      'CREATE POLICY %I_update ON public.%I FOR UPDATE TO authenticated USING (public.app_can_access_candidate(candidate_id)) WITH CHECK (public.app_can_access_candidate(candidate_id))',
      t, t
    );
    EXECUTE format(
      'CREATE POLICY %I_delete ON public.%I FOR DELETE TO authenticated USING (public.app_is_admin_or_develop() AND EXISTS (SELECT 1 FROM public.candidates c WHERE c.id = %I.candidate_id AND public.app_tenant_match(c.tenant_id)))',
      t, t, t
    );
  END LOOP;
END;
$policy$;

-- interview_questions / interview_results（preparation 経由）
DROP POLICY IF EXISTS interview_questions_select ON public.interview_questions;
DROP POLICY IF EXISTS interview_questions_insert ON public.interview_questions;
DROP POLICY IF EXISTS interview_questions_update ON public.interview_questions;
DROP POLICY IF EXISTS interview_questions_delete ON public.interview_questions;

CREATE POLICY interview_questions_select ON public.interview_questions
  FOR SELECT TO authenticated
  USING (public.app_can_access_interview_prep(preparation_id));

CREATE POLICY interview_questions_insert ON public.interview_questions
  FOR INSERT TO authenticated
  WITH CHECK (public.app_can_access_interview_prep(preparation_id));

CREATE POLICY interview_questions_update ON public.interview_questions
  FOR UPDATE TO authenticated
  USING (public.app_can_access_interview_prep(preparation_id))
  WITH CHECK (public.app_can_access_interview_prep(preparation_id));

CREATE POLICY interview_questions_delete ON public.interview_questions
  FOR DELETE TO authenticated
  USING (
    public.app_is_admin_or_develop()
    AND EXISTS (
      SELECT 1
      FROM public.interview_preparations ip
      JOIN public.candidates c ON c.id = ip.candidate_id
      WHERE ip.id = interview_questions.preparation_id
        AND public.app_tenant_match(c.tenant_id)
    )
  );

DROP POLICY IF EXISTS interview_results_select ON public.interview_results;
DROP POLICY IF EXISTS interview_results_insert ON public.interview_results;
DROP POLICY IF EXISTS interview_results_update ON public.interview_results;
DROP POLICY IF EXISTS interview_results_delete ON public.interview_results;

CREATE POLICY interview_results_select ON public.interview_results
  FOR SELECT TO authenticated
  USING (public.app_can_access_interview_prep(preparation_id));

CREATE POLICY interview_results_insert ON public.interview_results
  FOR INSERT TO authenticated
  WITH CHECK (public.app_can_access_interview_prep(preparation_id));

CREATE POLICY interview_results_update ON public.interview_results
  FOR UPDATE TO authenticated
  USING (public.app_can_access_interview_prep(preparation_id))
  WITH CHECK (public.app_can_access_interview_prep(preparation_id));

CREATE POLICY interview_results_delete ON public.interview_results
  FOR DELETE TO authenticated
  USING (
    public.app_is_admin_or_develop()
    AND EXISTS (
      SELECT 1
      FROM public.interview_preparations ip
      JOIN public.candidates c ON c.id = ip.candidate_id
      WHERE ip.id = interview_results.preparation_id
        AND public.app_tenant_match(c.tenant_id)
    )
  );

-- ---------------------------------------------------------------------------
-- 4. 連絡チャネル
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS calls_select ON public.calls;
DROP POLICY IF EXISTS calls_insert ON public.calls;
DROP POLICY IF EXISTS calls_update ON public.calls;
DROP POLICY IF EXISTS calls_delete ON public.calls;

CREATE POLICY calls_select ON public.calls
  FOR SELECT TO authenticated
  USING (public.app_can_access_communication(communication_id));

CREATE POLICY calls_insert ON public.calls
  FOR INSERT TO authenticated
  WITH CHECK (public.app_can_access_communication(communication_id));

CREATE POLICY calls_update ON public.calls
  FOR UPDATE TO authenticated
  USING (public.app_can_access_communication(communication_id))
  WITH CHECK (public.app_can_access_communication(communication_id));

CREATE POLICY calls_delete ON public.calls
  FOR DELETE TO authenticated
  USING (
    public.app_is_admin_or_develop()
    AND EXISTS (
      SELECT 1 FROM public.communications c
      WHERE c.id = calls.communication_id
        AND public.app_can_access_candidate(c.candidate_id)
    )
  );

DROP POLICY IF EXISTS line_conversations_select ON public.line_conversations;
DROP POLICY IF EXISTS line_conversations_insert ON public.line_conversations;
DROP POLICY IF EXISTS line_conversations_update ON public.line_conversations;
DROP POLICY IF EXISTS line_conversations_delete ON public.line_conversations;

CREATE POLICY line_conversations_select ON public.line_conversations
  FOR SELECT TO authenticated
  USING (public.app_can_access_candidate(candidate_id));

CREATE POLICY line_conversations_insert ON public.line_conversations
  FOR INSERT TO authenticated
  WITH CHECK (public.app_can_access_candidate(candidate_id));

CREATE POLICY line_conversations_update ON public.line_conversations
  FOR UPDATE TO authenticated
  USING (public.app_can_access_candidate(candidate_id))
  WITH CHECK (public.app_can_access_candidate(candidate_id));

CREATE POLICY line_conversations_delete ON public.line_conversations
  FOR DELETE TO authenticated
  USING (public.app_is_admin_or_develop() AND EXISTS (
    SELECT 1 FROM public.candidates c
    WHERE c.id = line_conversations.candidate_id AND public.app_tenant_match(c.tenant_id)
  ));

DROP POLICY IF EXISTS line_messages_select ON public.line_messages;
DROP POLICY IF EXISTS line_messages_insert ON public.line_messages;
DROP POLICY IF EXISTS line_messages_update ON public.line_messages;
DROP POLICY IF EXISTS line_messages_delete ON public.line_messages;

CREATE POLICY line_messages_select ON public.line_messages
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.line_conversations lc
    WHERE lc.id = line_messages.line_conversation_id
      AND public.app_can_access_candidate(lc.candidate_id)
  ));

CREATE POLICY line_messages_insert ON public.line_messages
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.line_conversations lc
    WHERE lc.id = line_messages.line_conversation_id
      AND public.app_can_access_candidate(lc.candidate_id)
  ));

CREATE POLICY line_messages_update ON public.line_messages
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.line_conversations lc
    WHERE lc.id = line_messages.line_conversation_id
      AND public.app_can_access_candidate(lc.candidate_id)
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.line_conversations lc
    WHERE lc.id = line_messages.line_conversation_id
      AND public.app_can_access_candidate(lc.candidate_id)
  ));

CREATE POLICY line_messages_delete ON public.line_messages
  FOR DELETE TO authenticated
  USING (public.app_is_admin_or_develop());

DROP POLICY IF EXISTS email_threads_select ON public.email_threads;
DROP POLICY IF EXISTS email_threads_insert ON public.email_threads;
DROP POLICY IF EXISTS email_threads_update ON public.email_threads;
DROP POLICY IF EXISTS email_threads_delete ON public.email_threads;

CREATE POLICY email_threads_select ON public.email_threads
  FOR SELECT TO authenticated
  USING (public.app_can_access_candidate(candidate_id));

CREATE POLICY email_threads_insert ON public.email_threads
  FOR INSERT TO authenticated
  WITH CHECK (public.app_can_access_candidate(candidate_id));

CREATE POLICY email_threads_update ON public.email_threads
  FOR UPDATE TO authenticated
  USING (public.app_can_access_candidate(candidate_id))
  WITH CHECK (public.app_can_access_candidate(candidate_id));

CREATE POLICY email_threads_delete ON public.email_threads
  FOR DELETE TO authenticated
  USING (public.app_is_admin_or_develop() AND EXISTS (
    SELECT 1 FROM public.candidates c
    WHERE c.id = email_threads.candidate_id AND public.app_tenant_match(c.tenant_id)
  ));

DROP POLICY IF EXISTS email_messages_select ON public.email_messages;
DROP POLICY IF EXISTS email_messages_insert ON public.email_messages;
DROP POLICY IF EXISTS email_messages_update ON public.email_messages;
DROP POLICY IF EXISTS email_messages_delete ON public.email_messages;

CREATE POLICY email_messages_select ON public.email_messages
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.email_threads et
    WHERE et.id = email_messages.email_thread_id
      AND public.app_can_access_candidate(et.candidate_id)
  ));

CREATE POLICY email_messages_insert ON public.email_messages
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.email_threads et
    WHERE et.id = email_messages.email_thread_id
      AND public.app_can_access_candidate(et.candidate_id)
  ));

CREATE POLICY email_messages_update ON public.email_messages
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.email_threads et
    WHERE et.id = email_messages.email_thread_id
      AND public.app_can_access_candidate(et.candidate_id)
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.email_threads et
    WHERE et.id = email_messages.email_thread_id
      AND public.app_can_access_candidate(et.candidate_id)
  ));

CREATE POLICY email_messages_delete ON public.email_messages
  FOR DELETE TO authenticated
  USING (public.app_is_admin_or_develop());

-- ---------------------------------------------------------------------------
-- 5. 架電リスト子テーブル
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS call_attempts_select ON public.call_attempts;
DROP POLICY IF EXISTS call_attempts_insert ON public.call_attempts;
DROP POLICY IF EXISTS call_attempts_update ON public.call_attempts;
DROP POLICY IF EXISTS call_attempts_delete ON public.call_attempts;

CREATE POLICY call_attempts_select ON public.call_attempts
  FOR SELECT TO authenticated
  USING (public.app_can_access_call_lead(call_lead_id));

CREATE POLICY call_attempts_insert ON public.call_attempts
  FOR INSERT TO authenticated
  WITH CHECK (public.app_can_access_call_lead(call_lead_id));

CREATE POLICY call_attempts_update ON public.call_attempts
  FOR UPDATE TO authenticated
  USING (public.app_can_access_call_lead(call_lead_id))
  WITH CHECK (public.app_can_access_call_lead(call_lead_id));

CREATE POLICY call_attempts_delete ON public.call_attempts
  FOR DELETE TO authenticated
  USING (public.app_is_admin_or_develop() AND public.app_can_access_call_lead(call_lead_id));

DROP POLICY IF EXISTS call_lead_notes_select ON public.call_lead_notes;
DROP POLICY IF EXISTS call_lead_notes_insert ON public.call_lead_notes;
DROP POLICY IF EXISTS call_lead_notes_update ON public.call_lead_notes;
DROP POLICY IF EXISTS call_lead_notes_delete ON public.call_lead_notes;

CREATE POLICY call_lead_notes_select ON public.call_lead_notes
  FOR SELECT TO authenticated
  USING (public.app_can_access_call_lead(call_lead_id));

CREATE POLICY call_lead_notes_insert ON public.call_lead_notes
  FOR INSERT TO authenticated
  WITH CHECK (public.app_can_access_call_lead(call_lead_id));

CREATE POLICY call_lead_notes_update ON public.call_lead_notes
  FOR UPDATE TO authenticated
  USING (public.app_can_access_call_lead(call_lead_id))
  WITH CHECK (public.app_can_access_call_lead(call_lead_id));

CREATE POLICY call_lead_notes_delete ON public.call_lead_notes
  FOR DELETE TO authenticated
  USING (public.app_is_admin_or_develop() AND public.app_can_access_call_lead(call_lead_id));

DROP POLICY IF EXISTS call_lead_activities_select ON public.call_lead_activities;
DROP POLICY IF EXISTS call_lead_activities_insert ON public.call_lead_activities;
DROP POLICY IF EXISTS call_lead_activities_update ON public.call_lead_activities;
DROP POLICY IF EXISTS call_lead_activities_delete ON public.call_lead_activities;

CREATE POLICY call_lead_activities_select ON public.call_lead_activities
  FOR SELECT TO authenticated
  USING (public.app_tenant_match(tenant_id));

CREATE POLICY call_lead_activities_insert ON public.call_lead_activities
  FOR INSERT TO authenticated
  WITH CHECK (public.app_tenant_match(tenant_id));

CREATE POLICY call_lead_activities_update ON public.call_lead_activities
  FOR UPDATE TO authenticated
  USING (public.app_tenant_match(tenant_id))
  WITH CHECK (public.app_tenant_match(tenant_id));

CREATE POLICY call_lead_activities_delete ON public.call_lead_activities
  FOR DELETE TO authenticated
  USING (public.app_is_admin_or_develop() AND public.app_tenant_match(tenant_id));

-- ---------------------------------------------------------------------------
-- 6. テナントマスタ
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS companies_select ON public.companies;
DROP POLICY IF EXISTS companies_insert ON public.companies;
DROP POLICY IF EXISTS companies_update ON public.companies;
DROP POLICY IF EXISTS companies_delete ON public.companies;

CREATE POLICY companies_select ON public.companies
  FOR SELECT TO authenticated
  USING (public.app_tenant_match(tenant_id));

CREATE POLICY companies_insert ON public.companies
  FOR INSERT TO authenticated
  WITH CHECK (public.app_tenant_match(tenant_id));

CREATE POLICY companies_update ON public.companies
  FOR UPDATE TO authenticated
  USING (public.app_tenant_match(tenant_id))
  WITH CHECK (public.app_tenant_match(tenant_id));

CREATE POLICY companies_delete ON public.companies
  FOR DELETE TO authenticated
  USING (public.app_is_admin_or_develop() AND public.app_tenant_match(tenant_id));

DROP POLICY IF EXISTS tags_select ON public.tags;
DROP POLICY IF EXISTS tags_insert ON public.tags;
DROP POLICY IF EXISTS tags_update ON public.tags;
DROP POLICY IF EXISTS tags_delete ON public.tags;

CREATE POLICY tags_select ON public.tags
  FOR SELECT TO authenticated
  USING (public.app_tenant_match(tenant_id));

CREATE POLICY tags_insert ON public.tags
  FOR INSERT TO authenticated
  WITH CHECK (public.app_tenant_match(tenant_id));

CREATE POLICY tags_update ON public.tags
  FOR UPDATE TO authenticated
  USING (public.app_tenant_match(tenant_id))
  WITH CHECK (public.app_tenant_match(tenant_id));

CREATE POLICY tags_delete ON public.tags
  FOR DELETE TO authenticated
  USING (public.app_is_admin_or_develop() AND public.app_tenant_match(tenant_id));

DROP POLICY IF EXISTS interview_prep_templates_select ON public.interview_prep_templates;
DROP POLICY IF EXISTS interview_prep_templates_insert ON public.interview_prep_templates;
DROP POLICY IF EXISTS interview_prep_templates_update ON public.interview_prep_templates;
DROP POLICY IF EXISTS interview_prep_templates_delete ON public.interview_prep_templates;

CREATE POLICY interview_prep_templates_select ON public.interview_prep_templates
  FOR SELECT TO authenticated
  USING (public.app_tenant_match(tenant_id));

CREATE POLICY interview_prep_templates_insert ON public.interview_prep_templates
  FOR INSERT TO authenticated
  WITH CHECK (public.app_is_admin_or_develop() AND public.app_tenant_match(tenant_id));

CREATE POLICY interview_prep_templates_update ON public.interview_prep_templates
  FOR UPDATE TO authenticated
  USING (public.app_is_admin_or_develop() AND public.app_tenant_match(tenant_id))
  WITH CHECK (public.app_is_admin_or_develop() AND public.app_tenant_match(tenant_id));

CREATE POLICY interview_prep_templates_delete ON public.interview_prep_templates
  FOR DELETE TO authenticated
  USING (public.app_is_admin_or_develop() AND public.app_tenant_match(tenant_id));

-- ---------------------------------------------------------------------------
-- 7. KPI / 改善提案 / 監査ログ
-- ---------------------------------------------------------------------------

DROP POLICY IF EXISTS kpi_goals_select ON public.kpi_goals;
DROP POLICY IF EXISTS kpi_goals_insert ON public.kpi_goals;
DROP POLICY IF EXISTS kpi_goals_update ON public.kpi_goals;
DROP POLICY IF EXISTS kpi_goals_delete ON public.kpi_goals;

CREATE POLICY kpi_goals_select ON public.kpi_goals
  FOR SELECT TO authenticated
  USING (public.app_can_read_kpi_goal_row(tenant_id, user_id));

CREATE POLICY kpi_goals_insert ON public.kpi_goals
  FOR INSERT TO authenticated
  WITH CHECK (
    public.app_can_read_kpi_goal_row(tenant_id, user_id)
    AND (
      user_id IS NULL
      OR user_id = public.app_user_id()
      OR public.app_is_admin_or_develop()
    )
  );

CREATE POLICY kpi_goals_update ON public.kpi_goals
  FOR UPDATE TO authenticated
  USING (public.app_can_read_kpi_goal_row(tenant_id, user_id))
  WITH CHECK (public.app_can_read_kpi_goal_row(tenant_id, user_id));

CREATE POLICY kpi_goals_delete ON public.kpi_goals
  FOR DELETE TO authenticated
  USING (public.app_is_admin_or_develop() AND public.app_tenant_match(tenant_id));

DROP POLICY IF EXISTS activity_metrics_daily_select ON public.activity_metrics_daily;
DROP POLICY IF EXISTS activity_metrics_daily_insert ON public.activity_metrics_daily;
DROP POLICY IF EXISTS activity_metrics_daily_update ON public.activity_metrics_daily;
DROP POLICY IF EXISTS activity_metrics_daily_delete ON public.activity_metrics_daily;

CREATE POLICY activity_metrics_daily_select ON public.activity_metrics_daily
  FOR SELECT TO authenticated
  USING (public.app_can_read_kpi_goal_row(tenant_id, user_id));

CREATE POLICY activity_metrics_daily_insert ON public.activity_metrics_daily
  FOR INSERT TO authenticated
  WITH CHECK (public.app_can_access_import_tenant(tenant_id));

CREATE POLICY activity_metrics_daily_update ON public.activity_metrics_daily
  FOR UPDATE TO authenticated
  USING (public.app_can_access_import_tenant(tenant_id))
  WITH CHECK (public.app_can_access_import_tenant(tenant_id));

CREATE POLICY activity_metrics_daily_delete ON public.activity_metrics_daily
  FOR DELETE TO authenticated
  USING (public.app_can_access_import_tenant(tenant_id));

DROP POLICY IF EXISTS improvement_requests_select ON public.improvement_requests;
DROP POLICY IF EXISTS improvement_requests_insert ON public.improvement_requests;
DROP POLICY IF EXISTS improvement_requests_update ON public.improvement_requests;
DROP POLICY IF EXISTS improvement_requests_delete ON public.improvement_requests;

CREATE POLICY improvement_requests_select ON public.improvement_requests
  FOR SELECT TO authenticated
  USING (public.app_can_read_improvement_request(id));

CREATE POLICY improvement_requests_insert ON public.improvement_requests
  FOR INSERT TO authenticated
  WITH CHECK (
    public.app_user_is_active()
    AND public.app_tenant_match(tenant_id)
    AND submitted_by_id = public.app_user_id()
  );

CREATE POLICY improvement_requests_update ON public.improvement_requests
  FOR UPDATE TO authenticated
  USING (public.app_can_read_improvement_request(id))
  WITH CHECK (public.app_can_read_improvement_request(id));

CREATE POLICY improvement_requests_delete ON public.improvement_requests
  FOR DELETE TO authenticated
  USING (public.app_is_develop());

DROP POLICY IF EXISTS tenant_audit_logs_select ON public.tenant_audit_logs;

CREATE POLICY tenant_audit_logs_select ON public.tenant_audit_logs
  FOR SELECT TO authenticated
  USING (public.app_is_develop());

-- ---------------------------------------------------------------------------
-- 8. インポート・同期ログ（参照のみ / 書込はサーバー経由）
-- ---------------------------------------------------------------------------

DO $import$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'import_logs',
    'raw_call_leads',
    'call_lead_import_logs',
    'raw_jobs',
    'job_import_logs'
  ]
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I_select ON public.%I', t, t);
    EXECUTE format(
      'CREATE POLICY %I_select ON public.%I FOR SELECT TO authenticated USING (public.app_can_access_import_tenant(tenant_id))',
      t, t
    );
  END LOOP;
END;
$import$;
