import { notFound } from "next/navigation";
import { getInterviewPrepTemplateForSettings } from "@/lib/actions/interview-prep";
import { InterviewPrepTemplateForm } from "@/components/settings/interview-prep-template-form";

export default async function SettingsInterviewPrepPage() {
  const result = await getInterviewPrepTemplateForSettings();
  if ("error" in result && result.error) {
    notFound();
  }

  return (
    <InterviewPrepTemplateForm bodyMarkdown={result.bodyMarkdown!} />
  );
}
