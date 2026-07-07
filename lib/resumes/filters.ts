import { ResumeStatus } from "@prisma/client";
import type { Prisma } from "@prisma/client";

export type ResumeFilters = {
  q?: string;
  status?: ResumeStatus;
};

const VALID_STATUSES = new Set<string>(Object.values(ResumeStatus));

export function parseResumeFilters(
  params: Record<string, string | string[] | undefined>
): ResumeFilters {
  const get = (key: string) => {
    const value = params[key];
    return typeof value === "string" && value.length > 0 ? value : undefined;
  };

  const status = get("status");

  return {
    q: get("q"),
    status:
      status && VALID_STATUSES.has(status) ? (status as ResumeStatus) : undefined,
  };
}

export function hasActiveResumeFilters(filters: ResumeFilters): boolean {
  return Boolean(filters.q || filters.status);
}

export function applyResumeFilters(
  base: Prisma.ResumeWhereInput,
  filters: ResumeFilters
): Prisma.ResumeWhereInput {
  const and: Prisma.ResumeWhereInput[] = [base];

  if (filters.status) {
    and.push({ status: filters.status });
  }

  if (filters.q?.trim()) {
    const q = filters.q.trim();
    and.push({
      OR: [
        { fullName: { contains: q, mode: "insensitive" } },
        { furigana: { contains: q, mode: "insensitive" } },
        { candidate: { lastName: { contains: q, mode: "insensitive" } } },
        { candidate: { firstName: { contains: q, mode: "insensitive" } } },
      ],
    });
  }

  return and.length === 1 ? base : { AND: and };
}
