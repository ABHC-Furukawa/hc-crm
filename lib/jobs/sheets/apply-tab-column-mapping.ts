import type { EmploymentType } from "@prisma/client";
import { COLUMN_ALIASES } from "@/lib/jobs/sheet-columns";
import { pickCellByColumn } from "@/lib/jobs/sheets/column-letter";
import type {
  GenderColumnRule,
  TabColumnMapping,
} from "@/lib/jobs/sheets/tab-column-mapping";
import { normalizeCellText, pickFirstValue } from "@/lib/jobs/normalize/utils";

const EMPLOYMENT_TYPE_LABELS: Record<EmploymentType, string> = {
  FULL_TIME: "正社員",
  PART_TIME: "パート・アルバイト",
  DISPATCH: "派遣",
  CONTRACT: "契約",
  TEMPORARY: "臨時",
  OTHER: "その他",
  UNKNOWN: "",
};

/** 列マッピング結果を Importer が読める標準キーに変換 */
const MAPPED_STANDARD_KEYS = {
  clientCompany: "派遣先企業名",
  referralFee: "紹介料",
  gender: "性別",
  maxAge: "上限年齢",
  salary: "給与",
  location: "勤務地",
  shiftType: "勤務形態",
  employmentType: "雇用形態",
  otherNotes: "その他",
  url: "URL",
} as const;

type MappedField = keyof typeof MAPPED_STANDARD_KEYS;

const STANDARD_KEY_ALIASES: Record<string, readonly string[]> = {
  派遣先企業名: COLUMN_ALIASES.clientCompany,
  紹介料: COLUMN_ALIASES.referralFee,
  性別: COLUMN_ALIASES.gender,
  上限年齢: COLUMN_ALIASES.maxAge,
  給与: COLUMN_ALIASES.salary,
  勤務地: COLUMN_ALIASES.location,
  勤務形態: COLUMN_ALIASES.shiftType,
  雇用形態: COLUMN_ALIASES.employmentType,
};

function pickHeaderValue(
  headerRaw: Record<string, string>,
  standardKey: string
): string | null {
  const aliases = STANDARD_KEY_ALIASES[standardKey];
  if (!aliases) return headerRaw[standardKey]?.trim() || null;
  return pickFirstValue(headerRaw, [...aliases]);
}

function mappingDefinesField(
  mapping: TabColumnMapping,
  field: MappedField
): boolean {
  if (field === "gender" && mapping.genderColumns) return true;
  if (
    field === "employmentType" &&
    (mapping.employmentTypeTransform ||
      mapping.defaultEmploymentType ||
      mapping.employmentType)
  ) {
    return true;
  }

  const column = mapping[field as keyof TabColumnMapping];
  return typeof column === "string";
}

function cellHasNumber(row: string[], column: string | undefined): boolean {
  const value = pickCellByColumn(row, column);
  return value != null && /\d/.test(value);
}

/** 高木工業: D/E/F 列の数字有無で性別判定（F 優先、D+E 両方も不問） */
export function parseGenderFromColumnRule(
  row: string[],
  rule: GenderColumnRule
): string | null {
  const male = cellHasNumber(row, rule.male);
  const female = cellHasNumber(row, rule.female);
  const any = cellHasNumber(row, rule.any);

  if (any || (male && female)) return "不問";
  if (male) return "男性";
  if (female) return "女性";
  return null;
}

/** WIC BW列: 無期G〇→正社員、有→派遣 */
export function transformWicEmploymentType(value: string): string {
  const v = value.trim();
  if (!v) return v;

  if (/無期/.test(v) && /G/.test(v) && /[〇○◯]/.test(v)) {
    return "正社員";
  }
  if (/^有$|有/.test(v)) {
    return "派遣";
  }

  return v;
}

export function applyTabColumnMapping(
  row: string[],
  mapping: TabColumnMapping
): Record<string, string> {
  const result: Record<string, string> = {};

  for (const [field, standardKey] of Object.entries(MAPPED_STANDARD_KEYS)) {
    if (field === "gender" && mapping.genderColumns) continue;

    const column = mapping[field as keyof TabColumnMapping];
    if (typeof column !== "string") continue;

    const value = pickCellByColumn(row, column);
    if (value) {
      result[standardKey] = value;
    }
  }

  if (mapping.genderColumns) {
    const gender = parseGenderFromColumnRule(row, mapping.genderColumns);
    if (gender) {
      result["性別"] = gender;
    }
  }

  if (result["雇用形態"] && mapping.employmentTypeTransform === "wic-bw") {
    result["雇用形態"] = transformWicEmploymentType(result["雇用形態"]);
  }

  if (mapping.defaultEmploymentType && !result["雇用形態"]) {
    const label = EMPLOYMENT_TYPE_LABELS[mapping.defaultEmploymentType];
    if (label) result["雇用形態"] = label;
  }

  return result;
}

/** マッピングに無い項目をヘッダー行ベースの rawData から補完 */
export function supplementRawDataFromHeaders(
  merged: Record<string, string>,
  headerRaw: Record<string, string>
): Record<string, string> {
  const output = { ...merged };

  const supplement = (
    standardKey: string,
    aliases: readonly string[],
    headerPattern?: RegExp
  ) => {
    if (output[standardKey]?.trim()) return;

    const fromAlias = pickFirstValue(headerRaw, [...aliases]);
    if (fromAlias) {
      output[standardKey] = fromAlias;
      return;
    }

    if (!headerPattern) return;

    for (const [header, value] of Object.entries(headerRaw)) {
      const v = value?.trim();
      if (!v || output[standardKey]?.trim()) continue;
      if (headerPattern.test(header)) {
        output[standardKey] = v;
      }
    }
  };

  supplement("派遣先企業名", COLUMN_ALIASES.clientCompany, /派遣先|就業先|企業|作業所|現場|事業所|クライアント/);
  supplement("紹介料", COLUMN_ALIASES.referralFee, /紹介料|Fee|fee|手数料/);
  supplement("性別", COLUMN_ALIASES.gender, /性別|男女/);
  supplement("上限年齢", COLUMN_ALIASES.maxAge, /年齢|上限/);
  supplement("給与", COLUMN_ALIASES.salary, /給与|給料|月収|月給|総支給/);
  supplement("勤務地", COLUMN_ALIASES.location, /勤務地|住所|所在地|就業地/);
  supplement("勤務形態", COLUMN_ALIASES.shiftType, /勤務形態|シフト/);
  supplement("雇用形態", COLUMN_ALIASES.employmentType, /雇用形態|契約/);
  supplement("その他", COLUMN_ALIASES.otherNotes, /その他|備考|メモ|補足|特記/);
  supplement(
    "URL",
    COLUMN_ALIASES.sourceUrl,
    /URL|url|ジョブパル|オウンド|リンク|http/i
  );

  for (const [header, value] of Object.entries(headerRaw)) {
    const v = value?.trim();
    if (!v) continue;

    if (!output["URL"]?.trim() && /^https?:\/\//i.test(v)) {
      output["URL"] = v;
    }

    if (
      !output["URL"]?.trim() &&
      /URL|ジョブパル|オウンド|リンク/i.test(header) &&
      /https?:\/\//i.test(v)
    ) {
      output["URL"] = v;
    }
  }

  return output;
}

/**
 * ヘッダー名ベースを優先し、タブ列マッピングは
 * - 明示設定された列 → マッピング値を優先
 * - 未設定・ヘッダーに無い項目 → マッピングで補完
 * - その他・URL → 追加項目として常に反映
 */
export function mergeRowRawData(
  headerRaw: Record<string, string>,
  row: string[],
  mapping: TabColumnMapping | null
): Record<string, string> {
  const result = { ...headerRaw };

  if (!mapping) {
    return supplementRawDataFromHeaders(result, headerRaw);
  }

  const mapped = applyTabColumnMapping(row, mapping);

  for (const [field, standardKey] of Object.entries(MAPPED_STANDARD_KEYS)) {
    const mappedValue = mapped[standardKey]?.trim();
    if (!mappedValue) continue;

    const headerValue = pickHeaderValue(headerRaw, standardKey)?.trim();
    const isAddonField = standardKey === "その他" || standardKey === "URL";
    const explicitMapping = mappingDefinesField(
      mapping,
      field as MappedField
    );

    if (isAddonField || explicitMapping || !headerValue) {
      result[standardKey] = mappedValue;
    }
  }

  return supplementRawDataFromHeaders(result, headerRaw);
}

export function pickOtherNotes(rawData: Record<string, string>): string | null {
  return normalizeCellText(
    pickFirstValue(rawData, [...COLUMN_ALIASES.otherNotes])
  );
}

export function pickSourceUrl(rawData: Record<string, string>): string | null {
  const direct = pickFirstValue(rawData, [...COLUMN_ALIASES.sourceUrl]);
  if (!direct) return null;

  const trimmed = direct.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;

  const urlInText = trimmed.match(/https?:\/\/[^\s]+/i)?.[0];
  return urlInText ?? null;
}
