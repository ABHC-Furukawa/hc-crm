import Link from "next/link";
import type { ResumeDetail } from "@/lib/resumes/queries";
import { fullName } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function ResumeBackLink({ resume }: { resume: ResumeDetail }) {
  const href = resume.candidateId
    ? `/candidates/${resume.candidateId}?tab=resume`
    : "/resumes";
  const label = resume.candidateId ? "候補者に戻る" : "履歴書一覧に戻る";

  return (
    <Button variant="ghost" size="sm" asChild>
      <Link href={href}>{label}</Link>
    </Button>
  );
}

export function ResumeCandidateLink({ resume }: { resume: ResumeDetail }) {
  if (!resume.candidate) return null;

  return (
    <p className="text-sm text-muted-foreground">
      紐づけ候補者:{" "}
      <Link
        href={`/candidates/${resume.candidate.id}`}
        className="text-primary hover:underline"
      >
        {fullName(resume.candidate.lastName, resume.candidate.firstName)}
      </Link>
    </p>
  );
}
