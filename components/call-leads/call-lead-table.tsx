"use client";

import Link from "next/link";
import type { CallLeadListItem } from "@/lib/call-leads/queries";
import type { AssignableUser } from "@/lib/users/queries";
import { isCallLeadGrayedOut } from "@/lib/constants/call-lead-labels";
import { formatCompactDateTime, formatDate, cn } from "@/lib/utils";
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
      <div className="hidden max-h-[calc(100vh-13rem)] overflow-auto rounded-lg border md:block">
        <Table className="text-xs">
          <TableHeader className="sticky top-0 z-10 bg-background shadow-sm">
            <TableRow className="hover:bg-transparent">
              <TableHead className="h-8 whitespace-nowrap px-1.5 text-[11px]">応募</TableHead>
              <TableHead className="h-8 whitespace-nowrap px-1.5 text-[11px]">氏名</TableHead>
              <TableHead className="hidden h-8 whitespace-nowrap px-1.5 text-[11px] xl:table-cell">
                メール
              </TableHead>
              <TableHead className="h-8 whitespace-nowrap px-1.5 text-[11px]">電話</TableHead>
              <TableHead className="h-8 whitespace-nowrap px-1.5 text-[11px]">年齢</TableHead>
              <TableHead className="hidden h-8 whitespace-nowrap px-1.5 text-[11px] lg:table-cell">
                応募地
              </TableHead>
              <TableHead className="h-8 whitespace-nowrap px-1.5 text-[11px]">状態</TableHead>
              <TableHead className="h-8 whitespace-nowrap px-1.5 text-[11px]">担当</TableHead>
              <TableHead className="hidden h-8 whitespace-nowrap px-1.5 text-right text-[11px] lg:table-cell">
                発信
              </TableHead>
              <TableHead className="hidden h-8 whitespace-nowrap px-1.5 text-[11px] 2xl:table-cell">
                最終架電
              </TableHead>
              <TableHead className="hidden h-8 whitespace-nowrap px-1.5 text-[11px] xl:table-cell">
                次回
              </TableHead>
              <TableHead className="h-8 min-w-[88px] px-1.5 text-[11px]">Note</TableHead>
              <TableHead className="h-8 w-[72px] px-1.5 text-[11px]">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {callLeads.map((lead) => (
              <TableRow key={lead.id} className="hover:bg-muted/40">
                <TableCell
                  className={cn(
                    "whitespace-nowrap px-1.5 py-1 text-muted-foreground",
                    mutedCellClassName(lead.status)
                  )}
                >
                  {lead.appliedAt ? formatCompactDateTime(lead.appliedAt) : "—"}
                </TableCell>
                <TableCell className={cn("max-w-[7rem] px-1.5 py-1", mutedCellClassName(lead.status))}>
                  <Link
                    href={`/call-leads/${lead.id}`}
                    className="block truncate font-medium text-primary hover:underline"
                    title={lead.name}
                  >
                    {lead.name}
                  </Link>
                </TableCell>
                <TableCell
                  className={cn(
                    "hidden max-w-[120px] truncate px-1.5 py-1 xl:table-cell",
                    mutedCellClassName(lead.status)
                  )}
                  title={lead.email ?? undefined}
                >
                  {lead.email ?? "—"}
                </TableCell>
                <TableCell className={cn("px-1.5 py-1", mutedCellClassName(lead.status))}>
                  <CallLeadPhoneActions
                    callLeadId={lead.id}
                    phone={lead.phone}
                    status={lead.status}
                    compact
                  />
                </TableCell>
                <TableCell className={cn("px-1.5 py-1", mutedCellClassName(lead.status))}>
                  {lead.age ?? "—"}
                </TableCell>
                <TableCell
                  className={cn(
                    "hidden max-w-[4.5rem] truncate px-1.5 py-1 lg:table-cell",
                    mutedCellClassName(lead.status)
                  )}
                  title={lead.applicationArea ?? undefined}
                >
                  {lead.applicationArea ?? "—"}
                </TableCell>
                <TableCell className={cn("px-1 py-1", mutedCellClassName(lead.status))}>
                  <CallLeadStatusSelector
                    callLeadId={lead.id}
                    status={lead.status}
                    compact
                  />
                </TableCell>
                <TableCell className={cn("px-1 py-1", mutedCellClassName(lead.status))}>
                  <CallLeadAssigneeSelector
                    callLeadId={lead.id}
                    assignedUserId={lead.assignedUserId}
                    status={lead.status}
                    assignableUsers={assignableUsers}
                    compact
                  />
                </TableCell>
                <TableCell
                  className={cn(
                    "hidden px-1.5 py-1 text-right lg:table-cell",
                    mutedCellClassName(lead.status)
                  )}
                >
                  {lead.callCount}
                </TableCell>
                <TableCell
                  className={cn(
                    "hidden whitespace-nowrap px-1.5 py-1 text-muted-foreground 2xl:table-cell",
                    mutedCellClassName(lead.status)
                  )}
                >
                  {lead.lastCalledAt ? formatCompactDateTime(lead.lastCalledAt) : "—"}
                </TableCell>
                <TableCell
                  className={cn(
                    "hidden whitespace-nowrap px-1.5 py-1 xl:table-cell",
                    mutedCellClassName(lead.status)
                  )}
                >
                  {lead.nextCallDate ? formatDate(lead.nextCallDate) : "—"}
                </TableCell>
                <TableCell className={cn("max-w-[88px] px-1 py-1", mutedCellClassName(lead.status))}>
                  <CallLeadNoteCell
                    callLeadId={lead.id}
                    notes={lead.notes}
                    noteCount={lead._count.notes}
                    status={lead.status}
                    compact
                  />
                </TableCell>
                <TableCell className="px-1 py-1">
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

      <div className="space-y-3 md:hidden">
        {callLeads.map((lead) => (
          <div
            key={lead.id}
            className="rounded-lg border bg-card p-4 shadow-sm"
          >
            <div className={cn("flex items-start justify-between gap-2", mutedCellClassName(lead.status))}>
              <Link href={`/call-leads/${lead.id}`} className="min-w-0 flex-1">
                <p className="font-medium">{lead.name}</p>
                <p className="text-sm text-muted-foreground">
                  {lead.appliedAt ? formatCompactDateTime(lead.appliedAt) : "応募日未設定"}
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
