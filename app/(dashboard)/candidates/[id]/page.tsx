import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeft } from "lucide-react";
import { ActivityAction, ActivityEntityType } from "@prisma/client";
import { getActivitiesForCandidate } from "@/lib/actions/activities";
import { getCandidateById } from "@/lib/actions/candidates";
import { getActiveUsersForAssignment } from "@/lib/users/queries";
import { requireTenantContext } from "@/lib/tenant/context";
import { DashboardHeader } from "@/components/layout/dashboard-shell";
import { CandidateSummaryCard } from "@/components/candidates/detail/candidate-summary-card";
import { CandidateDetailNav } from "@/components/candidates/detail/candidate-detail-nav";
import { CandidateProfilePanel } from "@/components/candidates/detail/candidate-profile-panel";
import { ActivityTimelinePanel } from "@/components/candidates/detail/activity-timeline-panel";
import { TaskListPanel } from "@/components/candidates/detail/task-list-panel";
import { NoteListPanel } from "@/components/candidates/detail/note-list-panel";
import { CommunicationHistoryPanel } from "@/components/candidates/detail/communication-history-panel";
import { JobCasePanel } from "@/components/candidates/detail/job-case-panel";
import { InterviewPrepPanel } from "@/components/candidates/detail/interview-prep-panel";
import { ResumeSummaryPanel } from "@/components/resumes/resume-summary-panel";
import { CandidateDuplicateNoticeBanner } from "@/components/candidates/detail/candidate-duplicate-notice-banner";
import { getResumeSummaryForCandidate } from "@/lib/actions/resumes";
import {
  getInterviewPrepDayOfBody,
  getInterviewPrepTemplateBody,
  getOrCreateInterviewPrep,
} from "@/lib/actions/interview-prep";
import { canManageTenantSettings } from "@/lib/auth/rbac";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { isDetailTab, type DetailTabId } from "@/lib/constants/labels";
import { fullName } from "@/lib/utils";

function isActivityAction(value: string | undefined): value is ActivityAction {
  return (
    value !== undefined &&
    (Object.values(ActivityAction) as string[]).includes(value)
  );
}

function isActivityEntityType(value: string | undefined): value is ActivityEntityType {
  return (
    value !== undefined &&
    (Object.values(ActivityEntityType) as string[]).includes(value)
  );
}

export default async function CandidateDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    tab?: string;
    page?: string;
    action?: string;
    entityType?: string;
  }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const activeTab: DetailTabId = isDetailTab(sp.tab) ? sp.tab : "profile";

  const candidate = await getCandidateById(id);
  if (!candidate) notFound();

  const activityFilters = {
    action: isActivityAction(sp.action) ? sp.action : undefined,
    entityType: isActivityEntityType(sp.entityType) ? sp.entityType : undefined,
  };

  const activity =
    activeTab === "activity"
      ? await getActivitiesForCandidate(id, {
          page: sp.page,
          action: activityFilters.action,
          entityType: activityFilters.entityType,
        })
      : null;

  const { tenantId, user } = await requireTenantContext();

  const assignableUsers =
    activeTab === "tasks" ? await getActiveUsersForAssignment(tenantId) : [];

  const resumeSummary =
    activeTab === "resume"
      ? await getResumeSummaryForCandidate(id)
      : null;

  const interviewPrep =
    activeTab === "interview-prep"
      ? await getOrCreateInterviewPrep(id)
      : null;

  const interviewTemplateBody =
    activeTab === "interview-prep"
      ? await getInterviewPrepTemplateBody(tenantId)
      : null;

  const interviewDayOfBody =
    activeTab === "interview-prep"
      ? await getInterviewPrepDayOfBody(tenantId)
      : null;

  const resumeForInterview =
    activeTab === "interview-prep"
      ? await prisma.resume.findFirst({
          where: { candidateId: id, deletedAt: null },
          orderBy: { updatedAt: "desc" },
          select: { id: true, motivation: true },
        })
      : null;

  return (
    <>
      <DashboardHeader title={fullName(candidate.lastName, candidate.firstName)} />
      <main className="flex-1 space-y-6 p-4 sm:p-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/candidates">
            <ArrowLeft className="mr-2 h-4 w-4" />
            一覧に戻る
          </Link>
        </Button>

        <CandidateDuplicateNoticeBanner />

        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <CandidateSummaryCard candidate={candidate} />

          <div className="min-w-0 space-y-4">
            <Suspense fallback={<div className="h-9 animate-pulse rounded-lg bg-muted" />}>
              <CandidateDetailNav activeTab={activeTab} />
            </Suspense>

            {activeTab === "profile" && <CandidateProfilePanel candidate={candidate} />}
            {activeTab === "job" && <JobCasePanel candidate={candidate} />}
            {activeTab === "interview-prep" &&
              interviewPrep &&
              interviewTemplateBody != null &&
              interviewDayOfBody != null && (
              <InterviewPrepPanel
                candidate={candidate}
                preparation={interviewPrep}
                templateBody={interviewTemplateBody}
                dayOfBody={interviewDayOfBody}
                resumeMotivation={resumeForInterview?.motivation ?? null}
                hasResume={Boolean(resumeForInterview)}
                canEditTemplate={canManageTenantSettings(user.role)}
              />
            )}
            {activeTab === "resume" && (
              <ResumeSummaryPanel
                candidateId={id}
                candidateName={fullName(candidate.lastName, candidate.firstName)}
                resume={resumeSummary}
                compact
              />
            )}
            {activeTab === "activity" && activity && (
              <ActivityTimelinePanel
                candidateId={id}
                activity={activity}
                filters={activityFilters}
              />
            )}
            {activeTab === "tasks" && (
              <TaskListPanel candidate={candidate} assignableUsers={assignableUsers} />
            )}
            {activeTab === "notes" && <NoteListPanel candidate={candidate} />}
            {activeTab === "communications" && (
              <CommunicationHistoryPanel candidate={candidate} />
            )}
          </div>
        </div>
      </main>
    </>
  );
}
