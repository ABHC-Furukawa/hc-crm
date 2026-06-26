"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { JobImportLog } from "@prisma/client";
import { JOB_IMPORT_LOG_STATUS_LABELS } from "@/lib/jobs/labels";
import { REFERRAL_FEE_MIN_YEN } from "@/lib/jobs/sheet-columns";
import type { CompanySheetConfig } from "@/lib/jobs/sheets/company-sheet-config";
import {
  syncCompanyByKeyAction,
  type JobSyncActionState,
} from "@/lib/actions/job-sync";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

const selectClass =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm";

export function JobSyncPanel({
  configs,
  configured,
  canSync,
}: {
  configs: CompanySheetConfig[];
  configured: boolean;
  canSync: boolean;
}) {
  const router = useRouter();
  const [companyKey, setCompanyKey] = useState("");
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [state, setState] = useState<JobSyncActionState>({});

  async function handleSync() {
    if (!canSync || running || configs.length === 0) return;

    setRunning(true);
    setState({});

    const targets = companyKey
      ? configs.filter((c) => c.companyKey === companyKey)
      : configs;

    const results: NonNullable<JobSyncActionState["results"]> = [];

    try {
      for (let i = 0; i < targets.length; i++) {
        const config = targets[i]!;
        const label = companyKey
          ? config.displayName
          : `${config.displayName} (${i + 1}/${targets.length})`;
        setProgress(`${label} を同期中...`);

        const result = await syncCompanyByKeyAction(config.companyKey);
        if (result.results?.[0]) {
          results.push(result.results[0]);
        }
      }

      const totalSuccess = results.reduce((sum, r) => sum + r.successCount, 0);
      const totalFailed = results.reduce((sum, r) => sum + r.failedCount, 0);

      setState({
        success: totalSuccess > 0,
        message: companyKey
          ? undefined
          : `全 ${targets.length} タブ: 成功 ${totalSuccess} 件 / 失敗 ${totalFailed} 件`,
        results,
        ...(companyKey && results[0]
          ? {
              message: `${results[0].displayName}: 成功 ${results[0].successCount} 件 / 失敗 ${results[0].failedCount} 件`,
            }
          : {}),
        error:
          totalSuccess === 0
            ? "同期できた案件がありませんでした（紹介料40万円以上・必須列があるか確認してください）"
            : undefined,
      });
      router.refresh();
    } catch (error) {
      setState({
        error:
          error instanceof Error ? error.message : "同期中にエラーが発生しました",
      });
    } finally {
      setProgress(null);
      setRunning(false);
    }
  }

  if (!configured) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">同期設定</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <p>
            Google Sheets 同期が未設定です。以下の環境変数を設定してください。
          </p>
          <ul className="mt-2 list-inside list-disc space-y-1">
            <li>JOB_SPREADSHEET_ID</li>
            <li>GOOGLE_SERVICE_ACCOUNT_JSON</li>
          </ul>
        </CardContent>
      </Card>
    );
  }

  const minMan = REFERRAL_FEE_MIN_YEN / 10_000;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">手動同期</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!canSync && (
          <p className="text-sm text-muted-foreground">
            同期の実行は MANAGER 以上の権限が必要です。
          </p>
        )}

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            各派遣会社タブから直接同期（{configs.length} タブ）
          </p>
          <p className="text-xs text-muted-foreground">
            取込条件: 紹介料 {minMan}万円以上。列名はタブごとに自動マッピングします。
            シート上でグレーアウトされた行はクローズ案件として除外します。
          </p>

          <div className="space-y-2">
            <Label htmlFor="companyKey">派遣会社（省略時は全タブを順次同期）</Label>
            <select
              id="companyKey"
              value={companyKey}
              onChange={(e) => setCompanyKey(e.target.value)}
              className={selectClass}
              disabled={!canSync || running}
            >
              <option value="">全タブ一括同期</option>
              {configs.map((config) => (
                <option key={config.companyKey} value={config.companyKey}>
                  {config.displayName}（{config.sheetName}）
                </option>
              ))}
            </select>
          </div>

          <Button
            type="button"
            onClick={handleSync}
            disabled={!canSync || running}
          >
            {running ? "同期中..." : companyKey ? "選択タブを同期" : "全タブを同期"}
          </Button>
        </div>

        {progress && (
          <p className="text-sm font-medium text-primary">{progress}</p>
        )}

        {state.error && (
          <p className="text-sm text-destructive">{state.error}</p>
        )}
        {state.message && (
          <p className="text-sm text-muted-foreground">{state.message}</p>
        )}
        {state.results && state.results.length > 0 && (
          <ul className="max-h-48 space-y-1 overflow-y-auto text-sm">
            {state.results.map((r) => (
              <li key={r.displayName}>
                {r.displayName}: 成功 {r.successCount} / 失敗 {r.failedCount}
                {(r.skippedClosedCount ?? 0) > 0 || (r.removedCount ?? 0) > 0
                  ? ` · クローズ除外 ${r.skippedClosedCount ?? 0} / 削除 ${r.removedCount ?? 0}`
                  : null}
              </li>
            ))}
          </ul>
        )}

        <p className="text-xs text-muted-foreground">
          全タブ同期は1タブあたり1〜3分程度。自動同期: 毎日 JST 09:00 / 18:00
        </p>
      </CardContent>
    </Card>
  );
}

export function JobSyncStatusTable({
  companies,
}: {
  companies: {
    companyKey: string;
    displayName: string;
    sheetName: string;
    jobCount: number;
    lastSyncedAt: Date | null;
    lastStatus: string | null;
    lastSuccessCount: number | null;
    lastFailedCount: number | null;
  }[];
}) {
  if (companies.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">タブ別ステータス</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              <th className="pb-2 pr-4 font-medium">派遣会社</th>
              <th className="pb-2 pr-4 font-medium">タブ</th>
              <th className="pb-2 pr-4 font-medium">案件数</th>
              <th className="pb-2 pr-4 font-medium">最終同期</th>
              <th className="pb-2 font-medium">結果</th>
            </tr>
          </thead>
          <tbody>
            {companies.map((c) => (
              <tr key={c.companyKey} className="border-b last:border-0">
                <td className="py-2 pr-4">{c.displayName}</td>
                <td className="py-2 pr-4">{c.sheetName}</td>
                <td className="py-2 pr-4">{c.jobCount}</td>
                <td className="py-2 pr-4 whitespace-nowrap">
                  {c.lastSyncedAt
                    ? new Date(c.lastSyncedAt).toLocaleString("ja-JP")
                    : "—"}
                </td>
                <td className="py-2">
                  {c.lastStatus
                    ? `成功 ${c.lastSuccessCount ?? 0} / 失敗 ${c.lastFailedCount ?? 0}`
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}

export function JobImportLogList({ logs }: { logs: JobImportLog[] }) {
  if (logs.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">同期履歴</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              <th className="pb-2 pr-4 font-medium">日時</th>
              <th className="pb-2 pr-4 font-medium">タブ</th>
              <th className="pb-2 pr-4 font-medium">取込</th>
              <th className="pb-2 pr-4 font-medium">成功</th>
              <th className="pb-2 pr-4 font-medium">失敗</th>
              <th className="pb-2 font-medium">状態</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-b last:border-0">
                <td className="py-2 pr-4 whitespace-nowrap">
                  {new Date(log.importedAt).toLocaleString("ja-JP")}
                </td>
                <td className="py-2 pr-4">{log.companyName}</td>
                <td className="py-2 pr-4">{log.importedCount}</td>
                <td className="py-2 pr-4">{log.successCount}</td>
                <td className="py-2 pr-4">{log.failedCount}</td>
                <td className="py-2">{JOB_IMPORT_LOG_STATUS_LABELS[log.status]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
