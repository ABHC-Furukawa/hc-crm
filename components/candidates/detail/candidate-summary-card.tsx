import Link from "next/link";
import {
  Mail,
  Phone,
  MessageSquare,
  ListTodo,
  StickyNote,
  Activity,
} from "lucide-react";
import type { CandidateDetail } from "@/types/candidate";
import { CandidateStatusSelector } from "@/components/candidates/candidate-status-selector";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getCandidateSourceLabel } from "@/lib/constants/candidate-sources";
import { displayFurigana } from "@/lib/validators/candidate";
import { formatDateTime, fullName } from "@/lib/utils";

export function CandidateSummaryCard({ candidate }: { candidate: CandidateDetail }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <CardTitle className="text-xl">
              {fullName(candidate.lastName, candidate.firstName)}
            </CardTitle>
            {(displayFurigana(candidate)) && (
              <p className="text-sm text-muted-foreground">
                {displayFurigana(candidate)}
              </p>
            )}
          </div>
          <CandidateStatusSelector candidateId={candidate.id} status={candidate.status} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span>{candidate.phone}</span>
          </div>
          {candidate.phoneSecondary && (
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span>{candidate.phoneSecondary}</span>
            </div>
          )}
          {candidate.email && (
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="break-all">{candidate.email}</span>
            </div>
          )}
        </div>

        <Separator />

        <dl className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <dt className="text-muted-foreground">流入</dt>
            <dd className="font-medium">{getCandidateSourceLabel(candidate.source)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">登録者</dt>
            <dd className="font-medium">{candidate.createdBy?.name ?? "—"}</dd>
          </div>
        </dl>

        <div>
          <p className="mb-2 text-sm font-medium">担当CA</p>
          <ul className="space-y-1 text-sm">
            {candidate.assignments.map((a) => (
              <li key={a.id}>
                {a.user.name}
                <span className="ml-1 text-xs text-muted-foreground">
                  ({a.role === "PRIMARY" ? "主担当" : "副担当"})
                </span>
              </li>
            ))}
          </ul>
        </div>

        {candidate.tags.length > 0 && (
          <>
            <Separator />
            <div className="flex flex-wrap gap-1.5">
              {candidate.tags.map(({ tag }) => (
                <span
                  key={tag.id}
                  className="rounded-full px-2 py-0.5 text-xs font-medium text-white"
                  style={{ backgroundColor: tag.color }}
                >
                  {tag.name}
                </span>
              ))}
            </div>
          </>
        )}

        <Separator />

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Stat icon={MessageSquare} label="連絡" value={candidate._count.communications} />
          <Stat icon={ListTodo} label="タスク" value={candidate._count.tasks} />
          <Stat icon={StickyNote} label="メモ" value={candidate._count.notes} />
          <Stat icon={Activity} label="Activity" value={candidate._count.activities} />
        </div>
      </CardContent>
    </Card>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-lg bg-muted p-2 text-center">
      <Icon className="mx-auto h-4 w-4 text-muted-foreground" />
      <p className="mt-1 text-lg font-semibold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
