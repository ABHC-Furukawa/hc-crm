import { notFound } from "next/navigation";
import { getResumeByIdForUser } from "@/lib/actions/resumes";
import { parseResumeJsonFields } from "@/lib/resumes/parse-json";
import { getResumePhotoSignedUrl } from "@/lib/resumes/storage";
import { DashboardHeader } from "@/components/layout/dashboard-shell";
import { ResumeForm } from "@/components/resumes/resume-form";
import { ResumeBackLink } from "@/components/resumes/resume-nav-links";
import { ResumeWorkflowSteps } from "@/components/resumes/resume-list-filters";
import { ResumeStatusActions } from "@/components/resumes/resume-status-actions";
import { RESUME_TEMPLATE_LABELS } from "@/lib/resumes/constants";

export default async function ResumeEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const resume = await getResumeByIdForUser(id);
  if (!resume) notFound();

  const jsonFields = parseResumeJsonFields(resume);
  const photoDisplayUrl = await getResumePhotoSignedUrl(resume.photoUrl);

  return (
    <>
      <DashboardHeader title={`履歴書編集 — ${resume.fullName}`} />
      <main className="flex-1 space-y-6 p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <ResumeBackLink resume={resume} />
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm text-muted-foreground">
              {RESUME_TEMPLATE_LABELS[resume.templateType]}
            </p>
            <ResumeStatusActions resumeId={resume.id} status={resume.status} />
          </div>
        </div>

        <ResumeWorkflowSteps
          current={resume.status === "READY" ? "ready" : "edit"}
        />

        <ResumeForm
          resume={resume}
          jsonFields={jsonFields}
          photoDisplayUrl={photoDisplayUrl}
        />
      </main>
    </>
  );
}
