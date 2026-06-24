import { CallLeadStatus } from "@prisma/client";
import {
  getPrefecturesForRegion,
  isJapanPrefecture,
  isJapanRegionId,
} from "@/lib/constants/japan-areas";

export type CallLeadFilters = {
  q?: string;
  status?: CallLeadStatus;
  assignedUserId?: string;
  ageMin?: number;
  ageMax?: number;
  region?: string;
  prefecture?: string;
  applicationArea?: string;
  nextCallFrom?: string;
  nextCallTo?: string;
  hasNote?: boolean;
};

const VALID_STATUSES = new Set<string>(Object.values(CallLeadStatus));

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

  const status = get("status");
  const region = get("region");
  const prefecture = get("prefecture");

  return {
    q: get("q"),
    status:
      status && VALID_STATUSES.has(status) ? (status as CallLeadStatus) : undefined,
    assignedUserId: get("assignedUserId"),
    ageMin: parseIntParam(get("ageMin")),
    ageMax: parseIntParam(get("ageMax")),
    region: region && isJapanRegionId(region) ? region : undefined,
    prefecture: prefecture && isJapanPrefecture(prefecture) ? prefecture : undefined,
    applicationArea: get("applicationArea"),
    nextCallFrom: get("nextCallFrom"),
    nextCallTo: get("nextCallTo"),
    hasNote: parseBoolParam(get("hasNote")),
  };
}

export function hasActiveCallLeadFilters(filters: CallLeadFilters): boolean {
  return Boolean(
    filters.q ||
      filters.status ||
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
