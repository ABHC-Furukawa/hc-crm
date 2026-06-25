import { cookies } from "next/headers";
import { AlertTriangle } from "lucide-react";
import { CANDIDATE_DUPLICATE_NOTICE_COOKIE } from "@/lib/candidates/registration-notice";

export async function CandidateDuplicateNoticeBanner() {
  const cookieStore = await cookies();
  const notice = cookieStore.get(CANDIDATE_DUPLICATE_NOTICE_COOKIE)?.value;

  if (!notice) return null;

  cookieStore.delete(CANDIDATE_DUPLICATE_NOTICE_COOKIE);

  return (
    <div
      role="status"
      className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100"
    >
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <p>{notice}</p>
    </div>
  );
}
