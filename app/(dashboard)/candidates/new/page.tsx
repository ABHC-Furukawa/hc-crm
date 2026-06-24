import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CANDIDATE_DISPLAY } from "@/lib/constants/candidate-display";
import { DashboardHeader } from "@/components/layout/dashboard-shell";
import { CandidateForm } from "@/components/candidates/candidate-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function NewCandidatePage() {
  return (
    <>
      <DashboardHeader title={CANDIDATE_DISPLAY.newTitle} />
      <main className="flex-1 p-4 sm:p-6">
        <Button variant="ghost" size="sm" className="mb-4" asChild>
          <Link href="/candidates">
            <ArrowLeft className="mr-2 h-4 w-4" />
            一覧に戻る
          </Link>
        </Button>
        <Card className="mx-auto max-w-4xl">
          <CardHeader>
            <CardTitle>{CANDIDATE_DISPLAY.registerFormTitle}</CardTitle>
            <CardDescription>
              基本情報・就業状況・希望条件など、必要な項目を入力してください
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CandidateForm mode="create" />
          </CardContent>
        </Card>
      </main>
    </>
  );
}
