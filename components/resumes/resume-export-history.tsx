import { formatDateTime } from "@/lib/utils";
import type { ResumeDetail } from "@/lib/resumes/queries";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function ResumeExportHistory({
  exportLogs,
}: {
  exportLogs: ResumeDetail["exportLogs"];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>PDF 出力履歴</CardTitle>
        <CardDescription>
          ダウンロード・別タブ表示のたびに記録されます（直近 {exportLogs.length} 件）
        </CardDescription>
      </CardHeader>
      <CardContent>
        {exportLogs.length === 0 ? (
          <p className="text-sm text-muted-foreground">まだ出力されていません。</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[28rem] text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 pr-4 font-medium">日時</th>
                  <th className="pb-2 pr-4 font-medium">出力者</th>
                  <th className="pb-2 font-medium">ファイル名</th>
                </tr>
              </thead>
              <tbody>
                {exportLogs.map((log) => (
                  <tr key={log.id} className="border-b border-border/60">
                    <td className="py-2 pr-4 whitespace-nowrap">
                      {formatDateTime(log.exportedAt)}
                    </td>
                    <td className="py-2 pr-4">
                      {log.exportedBy?.name ?? "—"}
                    </td>
                    <td className="py-2 break-all">{log.fileName ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
