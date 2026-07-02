import type { CallLeadFilters } from "@/lib/call-leads/filters";
import { CALL_LEAD_DEFAULT_PAGE_SIZE } from "@/lib/call-leads/import/constants";

export function buildCallLeadListHref(
  filters: CallLeadFilters,
  page?: number,
  pageSize?: number
): string {
  const params = new URLSearchParams();

  if (filters.q) params.set("q", filters.q);
  if (filters.status) params.set("status", filters.status);
  if (filters.sourceType) params.set("sourceType", filters.sourceType);
  if (filters.assignedUserId) params.set("assignedUserId", filters.assignedUserId);
  if (filters.ageMin != null) params.set("ageMin", String(filters.ageMin));
  if (filters.ageMax != null) params.set("ageMax", String(filters.ageMax));
  if (filters.region) params.set("region", filters.region);
  if (filters.prefecture) params.set("prefecture", filters.prefecture);
  if (filters.applicationArea) params.set("applicationArea", filters.applicationArea);
  if (filters.nextCallFrom) params.set("nextCallFrom", filters.nextCallFrom);
  if (filters.nextCallTo) params.set("nextCallTo", filters.nextCallTo);
  if (filters.hasNote === true) params.set("hasNote", "true");
  if (filters.hasNote === false) params.set("hasNote", "false");

  const pageNum = page ?? filters.page ?? 1;
  const size = pageSize ?? filters.pageSize ?? CALL_LEAD_DEFAULT_PAGE_SIZE;

  if (pageNum > 1) params.set("page", String(pageNum));
  if (size !== CALL_LEAD_DEFAULT_PAGE_SIZE) params.set("pageSize", String(size));

  const query = params.toString();
  return query ? `/call-leads?${query}` : "/call-leads";
}
