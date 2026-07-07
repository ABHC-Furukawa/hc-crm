import type { ResumeFilters } from "@/lib/resumes/filters";

export function buildResumeListHref(filters: ResumeFilters = {}): string {
  const params = new URLSearchParams();

  if (filters.q) params.set("q", filters.q);
  if (filters.status) params.set("status", filters.status);

  const query = params.toString();
  return query ? `/resumes?${query}` : "/resumes";
}
