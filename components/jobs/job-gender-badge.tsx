import type { JobGender } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { formatJobGender } from "@/lib/jobs/labels";
import { cn } from "@/lib/utils";

const GENDER_BADGE_STYLES: Record<JobGender, string> = {
  MALE: "border-blue-200 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-200",
  FEMALE:
    "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-200",
  ANY: "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
  UNKNOWN: "",
};

export function JobGenderBadge({ gender }: { gender: JobGender }) {
  if (gender === "UNKNOWN") {
    return <span className="text-sm text-muted-foreground">—</span>;
  }

  return (
    <Badge
      variant="outline"
      className={cn(
        "min-w-[3.5rem] justify-center px-2.5 py-0.5 text-xs font-semibold",
        GENDER_BADGE_STYLES[gender]
      )}
    >
      {formatJobGender(gender)}
    </Badge>
  );
}
