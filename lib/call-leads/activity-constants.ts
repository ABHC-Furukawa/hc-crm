import type { Prisma } from "@prisma/client";
import { callLeadActivityInclude } from "@/lib/call-leads/queries";

export const CALL_LEAD_ACTIVITY_PAGE_SIZE = 20;

export type CallLeadActivityListResult = {
  items: Prisma.CallLeadActivityGetPayload<{
    include: typeof callLeadActivityInclude;
  }>[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};
