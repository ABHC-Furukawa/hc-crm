import Link from "next/link";
import { Mail, Phone, CalendarClock } from "lucide-react";
import type { CallLeadDetail } from "@/lib/call-leads/queries";
import { CallLeadPhoneActions } from "@/components/call-leads/call-lead-phone-actions";
import { CallLeadStatusSelector } from "@/components/call-leads/call-lead-status-selector";
import { CallLeadConvertButton } from "@/components/call-leads/detail/call-lead-convert-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatUserSurname } from "@/lib/users/display";
import {
  formatCallLeadSource,
  isCallLeadGrayedOut,
} from "@/lib/constants/call-lead-labels";
import { CANDIDATE_DISPLAY } from "@/lib/constants/candidate-display";
import { formatDate, formatDateTime, cn } from "@/lib/utils";

export function CallLeadSummaryCard({ callLead }: { callLead: CallLeadDetail }) {
  const grayed = isCallLeadGrayedOut(callLead.status);

  return (
    <Card className={cn(grayed && "opacity-40 grayscale")}>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <CardTitle className="text-xl">{callLead.name}</CardTitle>
          <CallLeadStatusSelector
            callLeadId={callLead.id}
            status={callLead.status}
            disabled={callLead.status === "CONVERTED"}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2 text-sm">
          <CallLeadPhoneActions
            callLeadId={callLead.id}
            phone={callLead.phone}
            status={callLead.status}
          />
          {callLead.email && (
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="break-all">{callLead.email}</span>
            </div>
          )}
        </div>

        <Separator />

        <dl className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <dt className="text-muted-foreground">年齢</dt>
            <dd className="font-medium">{callLead.age ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">応募地</dt>
            <dd className="font-medium">{callLead.applicationArea ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">応募日時</dt>
            <dd className="font-medium">
              {callLead.appliedAt ? formatDateTime(callLead.appliedAt) : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">取込元</dt>
            <dd className="font-medium">
              {formatCallLeadSource(callLead.sourceType, callLead.sourceName)}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">担当</dt>
            <dd className="font-medium">
              {callLead.assignedUser
                ? formatUserSurname(callLead.assignedUser)
                : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">発信回数</dt>
            <dd className="font-medium">{callLead.callCount} 回</dd>
          </div>
        </dl>

        {(callLead.nextCallDate || callLead.lastCalledAt) && (
          <>
            <Separator />
            <div className="space-y-2 text-sm">
              {callLead.lastCalledAt && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  最終架電 {formatDateTime(callLead.lastCalledAt)}
                </div>
              )}
              {callLead.nextCallDate && (
                <div className="flex items-center gap-2">
                  <CalendarClock className="h-4 w-4 text-muted-foreground" />
                  次回架電 {formatDate(callLead.nextCallDate)}
                </div>
              )}
            </div>
          </>
        )}

        {callLead.convertedCandidate ? (
          <>
            <Separator />
            <p className="text-sm">
              {CANDIDATE_DISPLAY.convertDone}:
              <Link
                href={`/candidates/${callLead.convertedCandidate.id}`}
                className="font-medium text-primary hover:underline"
              >
                {callLead.convertedCandidate.lastName}{" "}
                {callLead.convertedCandidate.firstName}
              </Link>
            </p>
          </>
        ) : (
          <>
            <Separator />
            <CallLeadConvertButton
              callLeadId={callLead.id}
              convertedCandidateId={callLead.convertedCandidateId}
            />
          </>
        )}
      </CardContent>
    </Card>
  );
}
