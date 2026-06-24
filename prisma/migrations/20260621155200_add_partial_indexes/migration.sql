-- Partial Indexes & Constraints (Prisma が partial index を直接サポートしないため raw SQL)

-- ── Candidate: ソフトデリート考慮の電話番号 UNIQUE ──
CREATE UNIQUE INDEX IF NOT EXISTS idx_candidates_phone_active
  ON candidates (phone)
  WHERE deleted_at IS NULL;

-- ── CandidateAssignment: PRIMARY 担当1名制約 ──
CREATE UNIQUE INDEX IF NOT EXISTS idx_candidate_assignment_primary_active
  ON candidate_assignments (candidate_id)
  WHERE role = 'PRIMARY' AND unassigned_at IS NULL;

-- ── CandidateAssignment: CA別アクティブ担当 ──
CREATE INDEX IF NOT EXISTS idx_candidate_assignments_advisor_active
  ON candidate_assignments (user_id, candidate_id)
  WHERE unassigned_at IS NULL;

-- ── Candidate: アクティブ候補者のステータス検索 ──
CREATE INDEX IF NOT EXISTS idx_candidates_active_status
  ON candidates (status, updated_at DESC)
  WHERE deleted_at IS NULL;

-- ── Company: アクティブ企業 ──
CREATE INDEX IF NOT EXISTS idx_companies_active
  ON companies (account_manager_id, status)
  WHERE deleted_at IS NULL;

-- ── 全文検索（pg_trgm） ──
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_candidates_name_trgm
  ON candidates USING gin ((last_name || ' ' || first_name) gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_notes_content_fts
  ON notes USING gin (to_tsvector('simple', content));

-- ── JSONB GIN ──
CREATE INDEX IF NOT EXISTS idx_activities_metadata_gin
  ON activities USING gin (metadata jsonb_path_ops);

CREATE INDEX IF NOT EXISTS idx_calls_pbx_metadata_gin
  ON calls USING gin (pbx_metadata jsonb_path_ops);

CREATE INDEX IF NOT EXISTS idx_line_messages_raw_payload_gin
  ON line_messages USING gin (raw_payload jsonb_path_ops);

-- ── BRIN（大量ログ向け） ──
CREATE INDEX IF NOT EXISTS idx_activities_occurred_brin
  ON activities USING brin (occurred_at)
  WITH (pages_per_range = 128);

CREATE INDEX IF NOT EXISTS idx_communications_occurred_brin
  ON communications USING brin (occurred_at)
  WITH (pages_per_range = 128);
