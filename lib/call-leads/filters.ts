import { CallLeadStatus, ImportSourceType } from "@prisma/client";
import {
  getPrefecturesForRegion,
  isJapanPrefecture,
  isJapanRegionId,
} from "@/lib/constants/japan-areas";
import {
  CALL_LEAD_DEFAULT_PAGE_SIZE,
  CALL_LEAD_PAGE_SIZES,
} from "@/lib/call-leads/import/constants";

export type CallLeadFilters = {
  q?: string;
  statuses?: CallLeadStatus[];
  assignedUserId?: string;
  sourceType?: ImportSourceType;
  ageMin?: number;
  ageMax?: number;
  region?: string;
  prefecture?: string;
  applicationArea?: string;
  nextCallFrom?: string;
  nextCallTo?: string;
  hasNote?: boolean;
  page?: number;
  pageSize?: number;
};

const VALID_STATUSES = new Set<string>(Object.values(CallLeadStatus));
const VALID_SOURCE_TYPES = new Set<string>(Object.values(ImportSourceType));

function parsePageParam(value: string | undefined): number {
  if (!value) return 1;
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) && n > 0 ? n : 1;
}

function parsePageSizeParam(value: string | undefined): number {
  if (!value) return CALL_LEAD_DEFAULT_PAGE_SIZE;
  const n = Number.parseInt(value, 10);
  return (CALL_LEAD_PAGE_SIZES as readonly number[]).includes(n)
    ? n
    : CALL_LEAD_DEFAULT_PAGE_SIZE;
}

function parseIntParam(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) ? n : undefined;
}

function parseBoolParam(value: string | undefined): boolean | undefined {
  if (value === "true") return true;
  if (value === "false") return false;
  return undefined;
}

export function parseCallLeadFilters(
  params: Record<string, string | string[] | undefined>
): CallLeadFilters {
  const get = (key: string) => {
    const value = params[key];
    return typeof value === "string" && value.length > 0 ? value : undefined;
  };

  const sourceType = get("sourceType");
  const region = get("region");
  const prefecture = get("prefecture");
  const statusParam = params.status;
  const statusValues = (
    Array.isArray(statusParam)
      ? statusParam
      : typeof statusParam === "string"
        ? [statusParam]
        : []
  ).filter((value) => VALID_STATUSES.has(value));
  const statuses = [...new Set(statusValues)] as CallLeadStatus[];

  return {
    q: get("q"),
    statuses: statuses.length > 0 ? statuses : undefined,
    sourceType:
      sourceType && VALID_SOURCE_TYPES.has(sourceType)
        ? (sourceType as ImportSourceType)
        : undefined,
    assignedUserId: get("assignedUserId"),
    ageMin: parseIntParam(get("ageMin")),
    ageMax: parseIntParam(get("ageMax")),
    region: region && isJapanRegionId(region) ? region : undefined,
    prefecture: prefecture && isJapanPrefecture(prefecture) ? prefecture : undefined,
    applicationArea: get("applicationArea"),
    nextCallFrom: get("nextCallFrom"),
    nextCallTo: get("nextCallTo"),
    hasNote: parseBoolParam(get("hasNote")),
    page: parsePageParam(get("page")),
    pageSize: parsePageSizeParam(get("pageSize")),
  };
}

export function hasActiveCallLeadFilters(filters: CallLeadFilters): boolean {
  return Boolean(
    filters.q ||
      (filters.statuses?.length ?? 0) > 0 ||
      filters.sourceType ||
      filters.assignedUserId ||
      filters.ageMin != null ||
      filters.ageMax != null ||
      filters.region ||
      filters.prefecture ||
      filters.applicationArea ||
      filters.nextCallFrom ||
      filters.nextCallTo ||
      filters.hasNote != null
  );
}
