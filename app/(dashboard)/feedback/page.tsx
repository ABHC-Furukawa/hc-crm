import { DashboardHeader } from "@/components/layout/dashboard-shell";
import { ImprovementRequestForm } from "@/components/feedback/improvement-request-form";

export default async function FeedbackPage() {
  return (
    <>
      <DashboardHeader title="改善・要望提案" />
      <main className="flex-1 space-y-4 p-4 sm:p-6">
        <p className="text-sm text-muted-foreground">
          HC OS の改善点や要望を開発者へ投稿できます。投稿内容は開発者のみが閲覧できます。
        </p>
        <div className="max-w-2xl">
          <ImprovementRequestForm />
        </div>
      </main>
    </>
  );
}
