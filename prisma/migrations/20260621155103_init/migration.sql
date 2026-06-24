-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'MANAGER', 'ADVISOR');

-- CreateEnum
CREATE TYPE "CandidateStatus" AS ENUM ('NEW', 'CONTACTING', 'INTERVIEWING', 'OFFER', 'PLACED', 'ON_HOLD', 'WITHDRAWN', 'REJECTED');

-- CreateEnum
CREATE TYPE "CandidateSource" AS ENUM ('REFERRAL', 'JOB_BOARD', 'SNS', 'EVENT', 'INBOUND', 'LINE', 'OTHER');

-- CreateEnum
CREATE TYPE "AssignmentRole" AS ENUM ('PRIMARY', 'SECONDARY');

-- CreateEnum
CREATE TYPE "CompanyStatus" AS ENUM ('PROSPECT', 'ACTIVE', 'INACTIVE', 'CLOSED');

-- CreateEnum
CREATE TYPE "CompanyIndustry" AS ENUM ('IT', 'FINANCE', 'MANUFACTURING', 'RETAIL', 'HEALTHCARE', 'CONSULTING', 'MEDIA', 'EDUCATION', 'OTHER');

-- CreateEnum
CREATE TYPE "TagCategory" AS ENUM ('SKILL', 'EXPERIENCE', 'PREFERENCE', 'STATUS', 'CUSTOM');

-- CreateEnum
CREATE TYPE "NoteType" AS ENUM ('GENERAL', 'INTERVIEW', 'FOLLOW_UP', 'INTERNAL');

-- CreateEnum
CREATE TYPE "CommunicationChannel" AS ENUM ('CALL', 'EMAIL', 'SMS', 'LINE', 'MEETING', 'OTHER');

-- CreateEnum
CREATE TYPE "CommunicationDirection" AS ENUM ('INBOUND', 'OUTBOUND', 'INTERNAL');

-- CreateEnum
CREATE TYPE "CommunicationStatus" AS ENUM ('DRAFT', 'SENT', 'DELIVERED', 'READ', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PbxProvider" AS ENUM ('TWILIO', 'MIITEL', 'BIZTEL', 'ZOOM_PHONE', 'ASTERISK', 'FREEPBX', 'CUSTOM', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "CallStatus" AS ENUM ('INITIATED', 'RINGING', 'IN_PROGRESS', 'ANSWERED', 'COMPLETED', 'MISSED', 'VOICEMAIL', 'BUSY', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "RecordingStatus" AS ENUM ('NONE', 'PENDING', 'AVAILABLE', 'FAILED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "TranscriptStatus" AS ENUM ('NONE', 'PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "AiSummaryStatus" AS ENUM ('NONE', 'PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "LineConversationStatus" AS ENUM ('OPEN', 'CLOSED', 'BLOCKED');

-- CreateEnum
CREATE TYPE "LineMessageType" AS ENUM ('TEXT', 'IMAGE', 'STICKER', 'FILE', 'FLEX', 'LOCATION', 'OTHER');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('TODO', 'IN_PROGRESS', 'DONE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TaskPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "ActivityAction" AS ENUM ('CREATED', 'UPDATED', 'DELETED', 'STATUS_CHANGED', 'ASSIGNED', 'UNASSIGNED', 'COMMUNICATION_LOGGED', 'CALL_COMPLETED', 'FILE_UPLOADED', 'NOTE_ADDED', 'TAG_ASSIGNED', 'TAG_REMOVED', 'APPLICATION_SUBMITTED');

-- CreateEnum
CREATE TYPE "ActivityEntityType" AS ENUM ('CANDIDATE', 'COMPANY', 'COMMUNICATION', 'CALL', 'LINE_CONVERSATION', 'LINE_MESSAGE', 'EMAIL_THREAD', 'EMAIL_MESSAGE', 'TASK', 'FILE', 'NOTE', 'TAG', 'APPLICATION', 'CANDIDATE_ASSIGNMENT', 'USER');

-- CreateEnum
CREATE TYPE "FileCategory" AS ENUM ('RESUME', 'CV', 'PORTFOLIO', 'CONTRACT', 'RECORDING', 'TRANSCRIPT', 'OTHER');

-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('DRAFT', 'APPLIED', 'SCREENING', 'INTERVIEW_1', 'INTERVIEW_2', 'INTERVIEW_FINAL', 'OFFER', 'ACCEPTED', 'REJECTED_BY_COMPANY', 'REJECTED_BY_CANDIDATE', 'WITHDRAWN');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "auth_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'ADVISOR',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "candidates" (
    "id" UUID NOT NULL,
    "created_by_id" UUID,
    "last_name" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name_kana" TEXT,
    "first_name_kana" TEXT,
    "email" TEXT,
    "phone" TEXT NOT NULL,
    "phone_secondary" TEXT,
    "status" "CandidateStatus" NOT NULL DEFAULT 'NEW',
    "source" "CandidateSource" NOT NULL DEFAULT 'OTHER',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "candidates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "candidate_assignments" (
    "id" UUID NOT NULL,
    "candidate_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "role" "AssignmentRole" NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "unassigned_at" TIMESTAMP(3),

    CONSTRAINT "candidate_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "companies" (
    "id" UUID NOT NULL,
    "account_manager_id" UUID,
    "name" TEXT NOT NULL,
    "name_kana" TEXT,
    "industry" "CompanyIndustry" NOT NULL DEFAULT 'OTHER',
    "status" "CompanyStatus" NOT NULL DEFAULT 'PROSPECT',
    "phone" TEXT,
    "email" TEXT,
    "website" TEXT,
    "address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tags" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "category" "TagCategory" NOT NULL DEFAULT 'CUSTOM',
    "color" TEXT NOT NULL DEFAULT '#6366f1',
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "candidate_tags" (
    "candidate_id" UUID NOT NULL,
    "tag_id" UUID NOT NULL,
    "assigned_by_id" UUID,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "candidate_tags_pkey" PRIMARY KEY ("candidate_id","tag_id")
);

-- CreateTable
CREATE TABLE "notes" (
    "id" UUID NOT NULL,
    "candidate_id" UUID NOT NULL,
    "author_id" UUID NOT NULL,
    "company_id" UUID,
    "application_id" UUID,
    "type" "NoteType" NOT NULL DEFAULT 'GENERAL',
    "content" TEXT NOT NULL,
    "is_pinned" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "communications" (
    "id" UUID NOT NULL,
    "candidate_id" UUID NOT NULL,
    "user_id" UUID,
    "channel" "CommunicationChannel" NOT NULL,
    "direction" "CommunicationDirection" NOT NULL,
    "subject" TEXT,
    "body" TEXT,
    "status" "CommunicationStatus" NOT NULL DEFAULT 'SENT',
    "occurred_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "communications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calls" (
    "id" UUID NOT NULL,
    "communication_id" UUID NOT NULL,
    "provider" "PbxProvider" NOT NULL DEFAULT 'UNKNOWN',
    "external_call_id" TEXT,
    "parent_call_id" UUID,
    "from_number" TEXT NOT NULL,
    "to_number" TEXT NOT NULL,
    "call_status" "CallStatus" NOT NULL DEFAULT 'INITIATED',
    "duration_seconds" INTEGER,
    "answered_by_user_id" UUID,
    "recording_url" TEXT,
    "recording_storage_path" TEXT,
    "recording_status" "RecordingStatus" NOT NULL DEFAULT 'NONE',
    "transcript" TEXT,
    "transcript_status" "TranscriptStatus" NOT NULL DEFAULT 'NONE',
    "transcript_error" TEXT,
    "ai_summary" TEXT,
    "ai_summary_status" "AiSummaryStatus" NOT NULL DEFAULT 'NONE',
    "ai_summary_error" TEXT,
    "ai_summary_model" TEXT,
    "ai_summary_at" TIMESTAMP(3),
    "pipeline_retry_count" INTEGER NOT NULL DEFAULT 0,
    "started_at" TIMESTAMP(3),
    "answered_at" TIMESTAMP(3),
    "ended_at" TIMESTAMP(3),
    "pbx_metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "calls_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "line_conversations" (
    "id" UUID NOT NULL,
    "candidate_id" UUID NOT NULL,
    "line_channel_id" TEXT NOT NULL,
    "line_user_id" TEXT NOT NULL,
    "status" "LineConversationStatus" NOT NULL DEFAULT 'OPEN',
    "last_message_at" TIMESTAMP(3),
    "unread_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "line_conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "line_messages" (
    "id" UUID NOT NULL,
    "line_conversation_id" UUID NOT NULL,
    "communication_id" UUID NOT NULL,
    "external_message_id" TEXT,
    "message_type" "LineMessageType" NOT NULL DEFAULT 'TEXT',
    "reply_token" TEXT,
    "raw_payload" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "line_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_threads" (
    "id" UUID NOT NULL,
    "candidate_id" UUID NOT NULL,
    "subject" TEXT,
    "external_thread_id" TEXT,
    "last_message_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_threads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_messages" (
    "id" UUID NOT NULL,
    "email_thread_id" UUID NOT NULL,
    "communication_id" UUID NOT NULL,
    "message_id" TEXT,
    "external_message_id" TEXT,
    "in_reply_to" TEXT,
    "from_address" TEXT NOT NULL,
    "to_addresses" TEXT[],
    "cc_addresses" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "html_body" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tasks" (
    "id" UUID NOT NULL,
    "candidate_id" UUID NOT NULL,
    "assigned_to_id" UUID,
    "communication_id" UUID,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "TaskStatus" NOT NULL DEFAULT 'TODO',
    "priority" "TaskPriority" NOT NULL DEFAULT 'MEDIUM',
    "due_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activities" (
    "id" UUID NOT NULL,
    "candidate_id" UUID NOT NULL,
    "user_id" UUID,
    "action" "ActivityAction" NOT NULL,
    "entity_type" "ActivityEntityType" NOT NULL,
    "entity_id" UUID NOT NULL,
    "metadata" JSONB,
    "occurred_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "files" (
    "id" UUID NOT NULL,
    "candidate_id" UUID NOT NULL,
    "uploaded_by_id" UUID NOT NULL,
    "communication_id" UUID,
    "application_id" UUID,
    "file_name" TEXT NOT NULL,
    "storage_path" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "size_bytes" INTEGER NOT NULL,
    "category" "FileCategory" NOT NULL DEFAULT 'OTHER',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "files_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "applications" (
    "id" UUID NOT NULL,
    "candidate_id" UUID NOT NULL,
    "company_id" UUID NOT NULL,
    "job_title" TEXT NOT NULL,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'DRAFT',
    "applied_at" TIMESTAMP(3),
    "interview_at" TIMESTAMP(3),
    "offer_at" TIMESTAMP(3),
    "closed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "applications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_auth_id_key" ON "users"("auth_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "candidates_status_idx" ON "candidates"("status");

-- CreateIndex
CREATE INDEX "candidates_deleted_at_idx" ON "candidates"("deleted_at");

-- CreateIndex
CREATE INDEX "candidates_last_name_first_name_idx" ON "candidates"("last_name", "first_name");

-- CreateIndex
CREATE INDEX "candidates_email_idx" ON "candidates"("email");

-- CreateIndex
CREATE INDEX "candidates_phone_idx" ON "candidates"("phone");

-- CreateIndex
CREATE INDEX "candidates_phone_secondary_idx" ON "candidates"("phone_secondary");

-- CreateIndex
CREATE INDEX "candidates_updated_at_idx" ON "candidates"("updated_at" DESC);

-- CreateIndex
CREATE INDEX "candidate_assignments_candidate_id_role_unassigned_at_idx" ON "candidate_assignments"("candidate_id", "role", "unassigned_at");

-- CreateIndex
CREATE INDEX "candidate_assignments_user_id_role_unassigned_at_idx" ON "candidate_assignments"("user_id", "role", "unassigned_at");

-- CreateIndex
CREATE UNIQUE INDEX "companies_name_key" ON "companies"("name");

-- CreateIndex
CREATE INDEX "companies_account_manager_id_idx" ON "companies"("account_manager_id");

-- CreateIndex
CREATE INDEX "companies_status_idx" ON "companies"("status");

-- CreateIndex
CREATE INDEX "companies_deleted_at_idx" ON "companies"("deleted_at");

-- CreateIndex
CREATE INDEX "companies_name_idx" ON "companies"("name");

-- CreateIndex
CREATE UNIQUE INDEX "tags_name_key" ON "tags"("name");

-- CreateIndex
CREATE INDEX "tags_category_idx" ON "tags"("category");

-- CreateIndex
CREATE INDEX "candidate_tags_tag_id_candidate_id_idx" ON "candidate_tags"("tag_id", "candidate_id");

-- CreateIndex
CREATE INDEX "candidate_tags_assigned_by_id_idx" ON "candidate_tags"("assigned_by_id");

-- CreateIndex
CREATE INDEX "notes_candidate_id_created_at_idx" ON "notes"("candidate_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "notes_author_id_idx" ON "notes"("author_id");

-- CreateIndex
CREATE INDEX "notes_company_id_idx" ON "notes"("company_id");

-- CreateIndex
CREATE INDEX "notes_application_id_idx" ON "notes"("application_id");

-- CreateIndex
CREATE INDEX "notes_candidate_id_is_pinned_idx" ON "notes"("candidate_id", "is_pinned");

-- CreateIndex
CREATE INDEX "communications_candidate_id_occurred_at_idx" ON "communications"("candidate_id", "occurred_at" DESC);

-- CreateIndex
CREATE INDEX "communications_user_id_idx" ON "communications"("user_id");

-- CreateIndex
CREATE INDEX "communications_channel_idx" ON "communications"("channel");

-- CreateIndex
CREATE UNIQUE INDEX "calls_communication_id_key" ON "calls"("communication_id");

-- CreateIndex
CREATE INDEX "calls_from_number_idx" ON "calls"("from_number");

-- CreateIndex
CREATE INDEX "calls_to_number_idx" ON "calls"("to_number");

-- CreateIndex
CREATE INDEX "calls_call_status_idx" ON "calls"("call_status");

-- CreateIndex
CREATE INDEX "calls_transcript_status_idx" ON "calls"("transcript_status");

-- CreateIndex
CREATE INDEX "calls_ai_summary_status_idx" ON "calls"("ai_summary_status");

-- CreateIndex
CREATE INDEX "calls_transcript_status_ai_summary_status_idx" ON "calls"("transcript_status", "ai_summary_status");

-- CreateIndex
CREATE INDEX "calls_ended_at_idx" ON "calls"("ended_at" DESC);

-- CreateIndex
CREATE INDEX "calls_parent_call_id_idx" ON "calls"("parent_call_id");

-- CreateIndex
CREATE UNIQUE INDEX "calls_provider_external_call_id_key" ON "calls"("provider", "external_call_id");

-- CreateIndex
CREATE INDEX "line_conversations_candidate_id_idx" ON "line_conversations"("candidate_id");

-- CreateIndex
CREATE INDEX "line_conversations_last_message_at_idx" ON "line_conversations"("last_message_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "line_conversations_line_channel_id_line_user_id_key" ON "line_conversations"("line_channel_id", "line_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "line_messages_communication_id_key" ON "line_messages"("communication_id");

-- CreateIndex
CREATE INDEX "line_messages_line_conversation_id_created_at_idx" ON "line_messages"("line_conversation_id", "created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "line_messages_line_conversation_id_external_message_id_key" ON "line_messages"("line_conversation_id", "external_message_id");

-- CreateIndex
CREATE INDEX "email_threads_candidate_id_idx" ON "email_threads"("candidate_id");

-- CreateIndex
CREATE INDEX "email_threads_external_thread_id_idx" ON "email_threads"("external_thread_id");

-- CreateIndex
CREATE INDEX "email_threads_last_message_at_idx" ON "email_threads"("last_message_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "email_messages_communication_id_key" ON "email_messages"("communication_id");

-- CreateIndex
CREATE INDEX "email_messages_email_thread_id_created_at_idx" ON "email_messages"("email_thread_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "email_messages_from_address_idx" ON "email_messages"("from_address");

-- CreateIndex
CREATE UNIQUE INDEX "email_messages_message_id_key" ON "email_messages"("message_id");

-- CreateIndex
CREATE INDEX "tasks_candidate_id_idx" ON "tasks"("candidate_id");

-- CreateIndex
CREATE INDEX "tasks_assigned_to_id_status_idx" ON "tasks"("assigned_to_id", "status");

-- CreateIndex
CREATE INDEX "tasks_due_at_idx" ON "tasks"("due_at");

-- CreateIndex
CREATE INDEX "tasks_status_due_at_idx" ON "tasks"("status", "due_at");

-- CreateIndex
CREATE INDEX "activities_candidate_id_occurred_at_idx" ON "activities"("candidate_id", "occurred_at" DESC);

-- CreateIndex
CREATE INDEX "activities_entity_type_entity_id_idx" ON "activities"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "activities_user_id_occurred_at_idx" ON "activities"("user_id", "occurred_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "files_storage_path_key" ON "files"("storage_path");

-- CreateIndex
CREATE INDEX "files_candidate_id_idx" ON "files"("candidate_id");

-- CreateIndex
CREATE INDEX "files_application_id_idx" ON "files"("application_id");

-- CreateIndex
CREATE INDEX "applications_candidate_id_idx" ON "applications"("candidate_id");

-- CreateIndex
CREATE INDEX "applications_company_id_idx" ON "applications"("company_id");

-- CreateIndex
CREATE INDEX "applications_status_idx" ON "applications"("status");

-- CreateIndex
CREATE UNIQUE INDEX "applications_candidate_id_company_id_job_title_key" ON "applications"("candidate_id", "company_id", "job_title");

-- AddForeignKey
ALTER TABLE "candidates" ADD CONSTRAINT "candidates_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidate_assignments" ADD CONSTRAINT "candidate_assignments_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidate_assignments" ADD CONSTRAINT "candidate_assignments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "companies" ADD CONSTRAINT "companies_account_manager_id_fkey" FOREIGN KEY ("account_manager_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidate_tags" ADD CONSTRAINT "candidate_tags_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidate_tags" ADD CONSTRAINT "candidate_tags_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "candidate_tags" ADD CONSTRAINT "candidate_tags_assigned_by_id_fkey" FOREIGN KEY ("assigned_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notes" ADD CONSTRAINT "notes_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "communications" ADD CONSTRAINT "communications_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "communications" ADD CONSTRAINT "communications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calls" ADD CONSTRAINT "calls_communication_id_fkey" FOREIGN KEY ("communication_id") REFERENCES "communications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calls" ADD CONSTRAINT "calls_answered_by_user_id_fkey" FOREIGN KEY ("answered_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "line_conversations" ADD CONSTRAINT "line_conversations_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "line_messages" ADD CONSTRAINT "line_messages_line_conversation_id_fkey" FOREIGN KEY ("line_conversation_id") REFERENCES "line_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "line_messages" ADD CONSTRAINT "line_messages_communication_id_fkey" FOREIGN KEY ("communication_id") REFERENCES "communications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_threads" ADD CONSTRAINT "email_threads_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_messages" ADD CONSTRAINT "email_messages_email_thread_id_fkey" FOREIGN KEY ("email_thread_id") REFERENCES "email_threads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_messages" ADD CONSTRAINT "email_messages_communication_id_fkey" FOREIGN KEY ("communication_id") REFERENCES "communications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assigned_to_id_fkey" FOREIGN KEY ("assigned_to_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_communication_id_fkey" FOREIGN KEY ("communication_id") REFERENCES "communications"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "files" ADD CONSTRAINT "files_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "files" ADD CONSTRAINT "files_uploaded_by_id_fkey" FOREIGN KEY ("uploaded_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "files" ADD CONSTRAINT "files_communication_id_fkey" FOREIGN KEY ("communication_id") REFERENCES "communications"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "files" ADD CONSTRAINT "files_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "applications"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_candidate_id_fkey" FOREIGN KEY ("candidate_id") REFERENCES "candidates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
