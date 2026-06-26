import { Badge } from "@/components/ui/badge";
import { formatShiftTypeSummary } from "@/lib/jobs/labels";
import { cn } from "@/lib/utils";

const SHIFT_TYPE_BADGE_STYLES: Record<string, string> = {
  日勤: "border-sky-200 bg-sky-50 text-sky-800 dark:border-sky-800 dark:bg-sky-950 dark:text-sky-200",
  夜勤:
    "border-indigo-200 bg-indigo-50 text-indigo-800 dark:border-indigo-800 dark:bg-indigo-950 dark:text-indigo-200",
  交替:
    "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200",
};

export function JobShiftTypeBadge({
  shiftType,
}: {
  shiftType: string | null | undefined;
}) {
  const label = formatShiftTypeSummary(shiftType);
  if (label === "—") {
    return <span className="text-sm text-muted-foreground">—</span>;
  }

  return (
    <Badge
      variant="outline"
      className={cn(
        "min-w-[3.5rem] justify-center px-2.5 py-0.5 text-xs font-semibold",
        SHIFT_TYPE_BADGE_STYLES[label]
      )}
    >
      {label}
    </Badge>
  );
}
