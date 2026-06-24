"use client";

import Link from "next/link";
import type { Candidate, CandidateAssignment, User } from "@prisma/client";
import { CandidateStatusSelector } from "@/components/candidates/candidate-status-selector";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CANDIDATE_DISPLAY } from "@/lib/constants/candidate-display";
import { getCandidateSourceLabel } from "@/lib/constants/candidate-sources";
import { formatDate, fullName } from "@/lib/utils";

type CandidateRow = Candidate & {
  assignments: (CandidateAssignment & {
    user: Pick<User, "id" | "name">;
  })[];
  _count: {
    communications: number;
    tasks: number;
    applications: number;
  };
};

export function CandidateTable({ candidates }: { candidates: CandidateRow[] }) {
  if (candidates.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-12 text-center text-muted-foreground">
        {CANDIDATE_DISPLAY.emptyList}
      </div>
    );
  }

  return (
    <>
      {/* Desktop table */}
      <div className="hidden md:block rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>氏名</TableHead>
              <TableHead>電話番号</TableHead>
              <TableHead>ステータス</TableHead>
              <TableHead>流入</TableHead>
              <TableHead>担当</TableHead>
              <TableHead>更新日</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {candidates.map((candidate) => (
              <TableRow key={candidate.id}>
                <TableCell>
                  <Link
                    href={`/candidates/${candidate.id}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {fullName(candidate.lastName, candidate.firstName)}
                  </Link>
                </TableCell>
                <TableCell>{candidate.phone}</TableCell>
                <TableCell>
                  <CandidateStatusSelector
                    candidateId={candidate.id}
                    status={candidate.status}
                  />
                </TableCell>
                <TableCell>{getCandidateSourceLabel(candidate.source)}</TableCell>
                <TableCell>
                  {candidate.assignments
                    .map((a) => a.user.name)
                    .join(", ") || "—"}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {formatDate(candidate.updatedAt)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile cards */}
      <div className="space-y-3 md:hidden">
        {candidates.map((candidate) => (
          <div
            key={candidate.id}
            className="rounded-lg border bg-card p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-2">
              <Link
                href={`/candidates/${candidate.id}`}
                className="min-w-0 flex-1 transition-colors hover:text-primary"
              >
                <p className="font-medium">
                  {fullName(candidate.lastName, candidate.firstName)}
                </p>
                <p className="text-sm text-muted-foreground">{candidate.phone}</p>
              </Link>
              <CandidateStatusSelector
                candidateId={candidate.id}
                status={candidate.status}
              />
            </div>
            <Link
              href={`/candidates/${candidate.id}`}
              className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground hover:text-foreground"
            >
              <span>{getCandidateSourceLabel(candidate.source)}</span>
              <span>·</span>
              <span>{formatDate(candidate.updatedAt)}</span>
            </Link>
          </div>
        ))}
      </div>
    </>
  );
}
