import { CallLeadStatus } from "@prisma/client";

const OUT_OF_SCOPE_MAX_AGE = 17;
const OUT_OF_SCOPE_MIN_AGE = 55;

/** 17歳以下 or 55歳以上 → 対象外 */
export function isOutOfScopeAge(age: number | null | undefined): boolean {
  if (age == null) return false;
  return age <= OUT_OF_SCOPE_MAX_AGE || age >= OUT_OF_SCOPE_MIN_AGE;
}

/** 取込時の最終ステータス（重複が最優先） */
export function resolveImportStatus(
  age: number | null | undefined,
  isDuplicate: boolean
): CallLeadStatus {
  if (isDuplicate) return CallLeadStatus.DUPLICATE;
  if (isOutOfScopeAge(age)) return CallLeadStatus.OUT_OF_SCOPE;
  return CallLeadStatus.BLANK;
}
