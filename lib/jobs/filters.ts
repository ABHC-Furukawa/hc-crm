import { EmploymentType, type Prisma } from "@prisma/client";
import { JOB_PAGE_SIZE } from "@/lib/jobs/constants";

export type JobFilters = {
  companyName?: string;
  jobTitle?: string;
  location?: string;
  employmentType?: EmploymentType;
  shiftType?: string;
  salary?: string;
  referralFee?: string;
  page?: number;
  sort?: JobSortField;
  order?: "asc" | "desc";
};

export type JobSortField =
  | "updatedAt"
  | "companyName"
  | "jobTitle"
  | "location"
  | "salary"
  | "referralFee"
  | "maxAge";

const VALID_SORT_FIELDS = new Set<string>([
  "updatedAt",
  "companyName",
  "jobTitle",
  "location",
  "salary",
  "referralFee",
  "maxAge",
]);

const VALID_EMPLOYMENT_TYPES = new Set<string>(Object.values(EmploymentType));

function parsePageParam(value: string | undefined): number {
  if (!value) return 1;
  const page = Number.parseInt(value, 10);
  return Number.isFinite(page) && page > 0 ? page : 1;
}

export function parseJobFilters(
  params: Record<string, string | string[] | undefined>
): JobFilters {
  const get = (key: string) => {
    const value = params[key];
    return typeof value === "string" && value.length > 0 ? value : undefined;
  };

  const employmentType = get("employmentType");
  const sort = get("sort");
  const order = get("order");

  return {
    companyName: get("companyName"),
    jobTitle: get("jobTitle"),
    location: get("location"),
    employmentType:
      employmentType && VALID_EMPLOYMENT_TYPES.has(employmentType)
        ? (employmentType as EmploymentType)
        : undefined,
    shiftType: get("shiftType"),
    salary: get("salary"),
    referralFee: get("referralFee"),
    page: parsePageParam(get("page")),
    sort:
      sort && VALID_SORT_FIELDS.has(sort) ? (sort as JobSortField) : "updatedAt",
    order: order === "asc" ? "asc" : "desc",
  };
}

export function hasActiveJobFilters(filters: JobFilters): boolean {
  return Boolean(
    filters.companyName ||
      filters.jobTitle ||
      filters.location ||
      filters.employmentType ||
      filters.shiftType ||
      filters.salary ||
      filters.referralFee
  );
}

export function buildJobListWhere(
  tenantId: string,
  filters: JobFilters
): Prisma.JobWhereInput {
  const where: Prisma.JobWhereInput = { tenantId };

  if (filters.companyName) {
    where.companyName = { contains: filters.companyName, mode: "insensitive" };
  }
  if (filters.jobTitle) {
    where.jobTitle = { contains: filters.jobTitle, mode: "insensitive" };
  }
  if (filters.location) {
    where.location = { contains: filters.location, mode: "insensitive" };
  }
  if (filters.employmentType) {
    where.employmentType = filters.employmentType;
  }
  if (filters.shiftType) {
    where.shiftType = { contains: filters.shiftType, mode: "insensitive" };
  }
  if (filters.salary) {
    where.salary = { contains: filters.salary, mode: "insensitive" };
  }
  if (filters.referralFee) {
    where.referralFee = { contains: filters.referralFee, mode: "insensitive" };
  }

  return where;
}

export function buildJobListOrderBy(
  filters: JobFilters
): Prisma.JobOrderByWithRelationInput {
  const field = filters.sort ?? "updatedAt";
  const direction = filters.order ?? "desc";
  return { [field]: direction };
}

export { JOB_PAGE_SIZE };
