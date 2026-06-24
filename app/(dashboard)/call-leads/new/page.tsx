import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { DashboardHeader } from "@/components/layout/dashboard-shell";
import { CallLeadManualForm } from "@/components/call-leads/call-lead-manual-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function NewCallLeadPage() {
  return (
    <>
      <DashboardHeader title="架電リード 新規登録" />
      <main className="flex-1 p-4 sm:p-6">
        <Button variant="ghost" size="sm" className="mb-4" asChild>
          <Link href="/call-leads">
            <ArrowLeft className="mr-2 h-4 w-4" />
            架電リストに戻る
          </Link>
        </Button>
        <Card className="mx-auto max-w-2xl">
          <CardHeader>
            <CardTitle>手動登録</CardTitle>
            <CardDescription>
              1 件ずつ架電リードを登録します。重複・対象外判定は自動で行われます。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CallLeadManualForm />
          </CardContent>
        </Card>
      </main>
    </>
  );
}
