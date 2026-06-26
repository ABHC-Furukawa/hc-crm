import type {
  CompanyImporter,
  ImportRowContext,
  NormalizedJobInput,
} from "@/lib/jobs/importers/types";
import {
  COLUMN_ALIASES,
  HEADER_LABEL_VALUES,
  REFERRAL_FEE_MIN_YEN,
} from "@/lib/jobs/sheet-columns";
import { buildShiftTypeDetail } from "@/lib/jobs/normalize/shift-type-detail";
import {
  formatReferralFeeDisplay,
  formatSalary,
  normalizeCellText,
  normalizeShiftType,
  normalizeSalaryDisplay,
  parseEmploymentType,
  parseJobGender,
  parseMaxAge,
  parseReferralFeeYen,
  pickExactFirstValue,
  pickFirstValue,
} from "@/lib/jobs/normalize/utils";

function pickClientCompany(rawData: Record<string, string>): string | null {
  return normalizeCellText(pickFirstValue(rawData, [...COLUMN_ALIASES.clientCompany]));
}

function pickLocation(rawData: Record<string, string>): string | null {
  const direct = normalizeCellText(
    pickFirstValue(rawData, [...COLUMN_ALIASES.location])
  );
  if (direct) return direct;

  const prefecture =
    rawData["所在地 （都道府県）"]?.trim() ??
    rawData["所在地（都道府県）"]?.trim();
  const city =
    rawData["所在地 （市区町村以降）"]?.trim() ??
    rawData["所在地（市区町村以降）"]?.trim();

  if (prefecture && city) return `${prefecture}${city}`;
  if (prefecture) return prefecture;
  if (city) return city;

  const client = pickClientCompany(rawData);
  const areaMatch = client?.match(/[（(]([^）)]+)[）)]/);
  if (areaMatch?.[1]) return areaMatch[1];

  return null;
}

export function pickReferralFeeRaw(rawData: Record<string, string>): string | null {
  const direct = pickFirstValue(rawData, [...COLUMN_ALIASES.referralFee]);
  if (direct) return direct;

  let bestRaw: string | null = null;
  let bestYen = -1;

  for (const [header, value] of Object.entries(rawData)) {
    const trimmed = value?.trim();
    if (!trimmed) continue;

    if (/メール|締切|アライ|赴任|備考|最終紹介日|返戻/.test(header)) continue;
    if (!(/紹介料|Fee|fee|手数料/.test(header))) continue;

    const yen = parseReferralFeeYen(trimmed);
    if (yen == null) continue;
    if (yen > bestYen) {
      bestYen = yen;
      bestRaw = trimmed;
    }
  }

  return bestRaw;
}

export class GenericCompanyImporter implements CompanyImporter {
  constructor(
    readonly companyKey: string,
    readonly displayName: string
  ) {}

  shouldSkip(rawData: Record<string, string>): boolean {
    const client = pickClientCompany(rawData);
    if (!client) return true;
    if (HEADER_LABEL_VALUES.has(client)) return true;

    const referralRaw = pickReferralFeeRaw(rawData);
    const referralYen = parseReferralFeeYen(referralRaw);
    if (referralYen == null || referralYen < REFERRAL_FEE_MIN_YEN) {
      return true;
    }

    return false;
  }

  normalize(
    rawData: Record<string, string>,
    ctx: ImportRowContext
  ): NormalizedJobInput | null {
    const clientCompany = pickClientCompany(rawData);
    if (!clientCompany) return null;

    const referralRaw = pickReferralFeeRaw(rawData);
    const referralYen = parseReferralFeeYen(referralRaw);
    if (referralYen == null || referralYen < REFERRAL_FEE_MIN_YEN) {
      return null;
    }

    const dispatchCompany =
      normalizeCellText(
        pickFirstValue(rawData, [...COLUMN_ALIASES.dispatchCompany])
      ) ?? ctx.displayName;

    const salaryData = { ...rawData };
    for (const key of COLUMN_ALIASES.salary) {
      const value = pickFirstValue(rawData, [key]);
      if (value) {
        salaryData["給与"] = value;
        break;
      }
    }

    const shiftRaw =
      pickExactFirstValue(rawData, [...COLUMN_ALIASES.shiftType]) ??
      pickFirstValue(rawData, [...COLUMN_ALIASES.shiftType]);

    return {
      companyName: dispatchCompany,
      jobTitle: clientCompany,
      location: pickLocation(rawData),
      salary: formatSalary(salaryData),
      employmentType: parseEmploymentType(
        pickFirstValue(rawData, [...COLUMN_ALIASES.employmentType])
      ),
      shiftType: normalizeShiftType(shiftRaw),
      shiftTypeDetail: buildShiftTypeDetail(rawData),
      gender: parseJobGender(
        pickFirstValue(rawData, [...COLUMN_ALIASES.gender])
      ),
      maxAge: parseMaxAge(pickFirstValue(rawData, [...COLUMN_ALIASES.maxAge])),
      referralFee:
        normalizeCellText(referralRaw) ?? formatReferralFeeDisplay(referralYen),
      sourceCompany: ctx.companyKey,
      sourceSheet: ctx.sheetName,
    };
  }
}

export function createGenericImporter(
  companyKey: string,
  displayName: string
): CompanyImporter {
  return new GenericCompanyImporter(companyKey, displayName);
}
