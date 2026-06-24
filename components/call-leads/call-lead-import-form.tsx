"use client";

import { useActionState } from "react";
import Link from "next/link";
import { Upload } from "lucide-react";
import {
  importCallLeadsCsvAction,
  type CallLeadImportActionState,
} from "@/lib/actions/call-lead-import";
import { CSV_TEMPLATE_HEADERS } from "@/lib/validators/call-lead-import";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: CallLeadImportActionState = {};

export function CallLeadImportForm() {
  const [state, formAction, pending] = useActionState(
    importCallLeadsCsvAction,
    initialState
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>CSV 取込</CardTitle>
        <CardDescription>
          1 行目はヘッダー行としてください。必須列は「氏名」です。
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-md bg-muted/50 p-3 text-sm">
          <p className="font-medium">対応ヘッダー</p>
          <p className="mt-1 text-muted-foreground">
            {CSV_TEMPLATE_HEADERS.join("、")}
          </p>
        </div>

        {state.error && (
          <div className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {state.error}
          </div>
        )}

        {state.success && (
          <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
            <p className="font-medium">取込が完了しました</p>
            <ul className="mt-1 list-inside list-disc text-emerald-800">
              <li>取込 {state.importedCount} 件</li>
              <li>有効 {state.validCount} 件</li>
              <li>重複 {state.duplicateCount} 件</li>
              <li>対象外 {state.outOfScopeCount} 件</li>
            </ul>
            <Button variant="link" className="mt-2 h-auto p-0" asChild>
              <Link href="/call-leads">一覧を見る</Link>
            </Button>
          </div>
        )}

        {state.warnings && state.warnings.length > 0 && (
          <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            <p className="font-medium">警告</p>
            <ul className="mt-1 max-h-32 list-inside list-disc overflow-y-auto">
              {state.warnings.map((msg) => (
                <li key={msg}>{msg}</li>
              ))}
            </ul>
          </div>
        )}

        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="file">CSV ファイル</Label>
            <Input
              id="file"
              name="file"
              type="file"
              accept=".csv,text/csv"
              required
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={pending}>
              <Upload className="mr-2 h-4 w-4" />
              {pending ? "取込中…" : "取込実行"}
            </Button>
            <Button
              type="submit"
              variant="outline"
              disabled={pending}
              name="redirect"
              value="list"
            >
              取込して一覧へ
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
