import type { JobFilters } from "@/lib/jobs/filters";

export function buildJobListHref(
  filters: JobFilters,
  page?: number
): string {
  const params = new URLSearchParams();

  if (filters.companyName) params.set("companyName", filters.companyName);
  if (filters.jobTitle) params.set("jobTitle", filters.jobTitle);
  if (filters.location) params.set("location", filters.location);
  if (filters.employmentType) params.set("employmentType", filters.employmentType);
  if (filters.shiftType) params.set("shiftType", filters.shiftType);
  if (filters.salary) params.set("salary", filters.salary);
  if (filters.referralFee) params.set("referralFee", filters.referralFee);
  if (filters.sort && filters.sort !== "updatedAt") params.set("sort", filters.sort);
  if (filters.order && filters.order !== "desc") params.set("order", filters.order);

  const pageNum = page ?? filters.page ?? 1;
  if (pageNum > 1) params.set("page", String(pageNum));

  const query = params.toString();
  return query ? `/jobs?${query}` : "/jobs";
}
