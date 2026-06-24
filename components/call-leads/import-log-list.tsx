import type { ImportLog } from "@prisma/client";
import {
  formatCallLeadSource,
  IMPORT_LOG_STATUS_LABELS,
} from "@/lib/constants/call-lead-labels";
import { formatDateTime } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function ImportLogList({ logs }: { logs: ImportLog[] }) {
  if (logs.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">最近の取込履歴</CardTitle>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>日時</TableHead>
              <TableHead>ソース</TableHead>
              <TableHead>取込</TableHead>
              <TableHead>重複</TableHead>
              <TableHead>対象外</TableHead>
              <TableHead>状態</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log) => (
              <TableRow key={log.id}>
                <TableCell className="whitespace-nowrap">
                  {formatDateTime(log.importedAt)}
                </TableCell>
                <TableCell>
                  {formatCallLeadSource(log.sourceType, log.sourceName)}
                </TableCell>
                <TableCell>{log.importedCount}</TableCell>
                <TableCell>{log.duplicateCount}</TableCell>
                <TableCell>{log.outOfScopeCount}</TableCell>
                <TableCell>{IMPORT_LOG_STATUS_LABELS[log.status]}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
