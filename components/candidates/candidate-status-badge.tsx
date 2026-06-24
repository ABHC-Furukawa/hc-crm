import type { CandidateStatus } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import {
  CANDIDATE_STATUS_LABELS,
  CANDIDATE_STATUS_STYLES,
} from "@/lib/validators/candidate";
import { cn } from "@/lib/utils";

export function CandidateStatusBadge({ status }: { status: CandidateStatus }) {
  return (
    <Badge variant="outline" className={cn("font-normal", CANDIDATE_STATUS_STYLES[status])}>
      {CANDIDATE_STATUS_LABELS[status]}
    </Badge>
  );
}
