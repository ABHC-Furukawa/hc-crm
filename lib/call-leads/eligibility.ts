import { CallLeadStatus } from "@prisma/client";
import { parseSheetStatusLabel } from "@/lib/call-leads/import/resolve-sheet-fields";

const OUT_OF_SCOPE_MAX_AGE = 17;
const OUT_OF_SCOPE_MIN_AGE = 55;

/** 17歳以下 or 55歳以上 → 対象外 */
export function isOutOfScopeAge(age: number | null | undefined): boolean {
  if (age == null) return false;
  return age <= OUT_OF_SCOPE_MAX_AGE || age >= OUT_OF_SCOPE_MIN_AGE;
}

/** 取込時の最終ステータス（重複 > シート対応履歴 > 年齢対象外） */
export function resolveImportStatus(
  age: number | null | undefined,
  isDuplicate: boolean,
  sheetStatusLabel?: string | null
): CallLeadStatus {
  if (isDuplicate) return CallLeadStatus.DUPLICATE;
  const fromSheet = parseSheetStatusLabel(sheetStatusLabel);
  if (fromSheet) return fromSheet;
  if (isOutOfScopeAge(age)) return CallLeadStatus.OUT_OF_SCOPE;
  return CallLeadStatus.BLANK;
}
