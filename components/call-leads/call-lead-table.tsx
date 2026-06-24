"use client";

import Link from "next/link";
import type { CallLeadListItem } from "@/lib/call-leads/queries";
import type { AssignableUser } from "@/lib/users/queries";
import { isCallLeadGrayedOut } from "@/lib/constants/call-lead-labels";
import { formatDate, formatDateTime, cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CallLeadAssigneeSelector } from "@/components/call-leads/call-lead-assignee-selector";
import { CallLeadNoteCell } from "@/components/call-leads/call-lead-note-cell";
import { CallLeadPhoneActions } from "@/components/call-leads/call-lead-phone-actions";
import { CallLeadStatusSelector } from "@/components/call-leads/call-lead-status-selector";
import { CallLeadConvertButton } from "@/components/call-leads/detail/call-lead-convert-button";

function mutedCellClassName(status: CallLeadListItem["status"]) {
  return cn(isCallLeadGrayedOut(status) && "opacity-40 grayscale");
}

export function CallLeadTable({
  callLeads,
  assignableUsers,
}: {
  callLeads: CallLeadListItem[];
  assignableUsers: AssignableUser[];
}) {
  if (callLeads.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
        架電リードがありません。CSV 取込または手動登録してください。
      </div>
    );
  }

  return (
    <>
      <div className="hidden overflow-x-auto lg:block rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>応募日時</TableHead>
              <TableHead>氏名</TableHead>
              <TableHead>メール</TableHead>
              <TableHead>電話番号</TableHead>
              <TableHead>年齢</TableHead>
              <TableHead>応募地</TableHead>
              <TableHead>ステータス</TableHead>
              <TableHead>担当</TableHead>
              <TableHead className="text-right">発信回数</TableHead>
              <TableHead>最終架電</TableHead>
              <TableHead>次回架電</TableHead>
              <TableHead className="min-w-[140px]">Note</TableHead>
              <TableHead className="min-w-[120px]">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {callLeads.map((lead) => (
              <TableRow key={lead.id}>
                <TableCell className={cn("whitespace-nowrap text-muted-foreground", mutedCellClassName(lead.status))}>
                  {lead.appliedAt ? formatDateTime(lead.appliedAt) : "—"}
                </TableCell>
                <TableCell className={mutedCellClassName(lead.status)}>
                  <Link
                    href={`/call-leads/${lead.id}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {lead.name}
                  </Link>
                </TableCell>
                <TableCell className={cn("max-w-[160px] truncate", mutedCellClassName(lead.status))}>
                  {lead.email ?? "—"}
                </TableCell>
                <TableCell className={mutedCellClassName(lead.status)}>
                  <CallLeadPhoneActions
                    callLeadId={lead.id}
                    phone={lead.phone}
                    status={lead.status}
                  />
                </TableCell>
                <TableCell className={mutedCellClassName(lead.status)}>{lead.age ?? "—"}</TableCell>
                <TableCell className={mutedCellClassName(lead.status)}>{lead.applicationArea ?? "—"}</TableCell>
                <TableCell className={mutedCellClassName(lead.status)}>
                  <CallLeadStatusSelector
                    callLeadId={lead.id}
                    status={lead.status}
                  />
                </TableCell>
                <TableCell className={mutedCellClassName(lead.status)}>
                  <CallLeadAssigneeSelector
                    callLeadId={lead.id}
                    assignedUserId={lead.assignedUserId}
                    status={lead.status}
                    assignableUsers={assignableUsers}
                  />
                </TableCell>
                <TableCell className={cn("text-right", mutedCellClassName(lead.status))}>{lead.callCount}</TableCell>
                <TableCell className={cn("whitespace-nowrap text-muted-foreground", mutedCellClassName(lead.status))}>
                  {lead.lastCalledAt ? formatDateTime(lead.lastCalledAt) : "—"}
                </TableCell>
                <TableCell className={cn("whitespace-nowrap", mutedCellClassName(lead.status))}>
                  {lead.nextCallDate ? formatDate(lead.nextCallDate) : "—"}
                </TableCell>
                <TableCell className={cn("max-w-[200px]", mutedCellClassName(lead.status))}>
                  <CallLeadNoteCell
                    callLeadId={lead.id}
                    notes={lead.notes}
                    noteCount={lead._count.notes}
                    status={lead.status}
                  />
                </TableCell>
                <TableCell>
                  <CallLeadConvertButton
                    callLeadId={lead.id}
                    convertedCandidateId={lead.convertedCandidateId}
                    compact
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="space-y-3 lg:hidden">
        {callLeads.map((lead) => (
          <div
            key={lead.id}
            className="rounded-lg border bg-card p-4 shadow-sm"
          >
            <div className={cn("flex items-start justify-between gap-2", mutedCellClassName(lead.status))}>
              <Link href={`/call-leads/${lead.id}`} className="min-w-0 flex-1">
                <p className="font-medium">{lead.name}</p>
                <p className="text-sm text-muted-foreground">
                  {lead.appliedAt ? formatDateTime(lead.appliedAt) : "応募日未設定"}
                </p>
              </Link>
              <CallLeadStatusSelector callLeadId={lead.id} status={lead.status} />
            </div>

            <div className={cn("mt-3 space-y-2 text-sm", mutedCellClassName(lead.status))}>
              <CallLeadPhoneActions
                callLeadId={lead.id}
                phone={lead.phone}
                status={lead.status}
                compact
              />
              <div className="flex flex-wrap gap-x-3 gap-y-1 text-muted-foreground">
                {lead.email && <span>{lead.email}</span>}
                {lead.age != null && <span>{lead.age}歳</span>}
                {lead.applicationArea && <span>{lead.applicationArea}</span>}
              </div>
              <CallLeadNoteCell
                callLeadId={lead.id}
                notes={lead.notes}
                noteCount={lead._count.notes}
                status={lead.status}
              />
              <div className="flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                <span>発信 {lead.callCount} 回</span>
                {lead.nextCallDate && (
                  <span>次回 {formatDate(lead.nextCallDate)}</span>
                )}
              </div>
              <CallLeadAssigneeSelector
                callLeadId={lead.id}
                assignedUserId={lead.assignedUserId}
                status={lead.status}
                assignableUsers={assignableUsers}
              />
            </div>
            <div className="mt-3 border-t pt-3">
              <CallLeadConvertButton
                callLeadId={lead.id}
                convertedCandidateId={lead.convertedCandidateId}
                compact
              />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
