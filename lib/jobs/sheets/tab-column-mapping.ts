import type { EmploymentType } from "@prisma/client";

/** D/E/F 列など、数字の有無で性別を判定するルール */
export type GenderColumnRule = {
  /** 数字が入っていれば男性 */
  male?: string;
  /** 数字が入っていれば女性 */
  female?: string;
  /** 数字が入っていれば不問（最優先） */
  any?: string;
};

/** タブ固有の列位置（Excel 列記号）。未指定項目はヘッダー名マッチで補完 */
export type TabColumnMapping = {
  clientCompany?: string;
  referralFee?: string;
  gender?: string;
  /** 複数列から性別を判定（高木工業など） */
  genderColumns?: GenderColumnRule;
  maxAge?: string;
  salary?: string;
  location?: string;
  shiftType?: string;
  employmentType?: string;
  /** 雇用形態列の値をタブ固有ルールで変換 */
  employmentTypeTransform?: "wic-bw";
  otherNotes?: string;
  url?: string;
  /** 列がなく固定値のとき（例: 派遣） */
  defaultEmploymentType?: EmploymentType;
};

/**
 * タブごとの列マッピング。
 * 列追加・並び替え時はここだけ更新すればよい。
 */
export const TAB_COLUMN_MAPPINGS: Record<string, TabColumnMapping> = {
  /** 綜合キャリアオプション */
  "sogo-career": {
    clientCompany: "B",
    referralFee: "F",
    gender: "G",
    maxAge: "I",
    salary: "R",
    otherNotes: "V",
    defaultEmploymentType: "DISPATCH",
  },
  /** ns派遣 */
  "ns-haken": {
    clientCompany: "C",
    referralFee: "B",
    location: "E",
    shiftType: "I",
    maxAge: "K",
    gender: "L",
    salary: "O",
    otherNotes: "H",
    url: "R",
    defaultEmploymentType: "DISPATCH",
  },
  /** WT */
  wt: {
    clientCompany: "B",
    referralFee: "E",
    location: "G",
    employmentType: "I",
    gender: "O",
    maxAge: "P",
    salary: "U",
    url: "BO",
  },
  /** ヨコタエンタープライズ */
  "yokota-enterprise": {
    clientCompany: "C",
    location: "D",
    otherNotes: "F",
    gender: "H",
    url: "I",
    maxAge: "G",
    referralFee: "O",
    salary: "P",
  },
  /** UTエイム */
  "ut-aim": {
    url: "A",
    clientCompany: "G",
    location: "I",
    shiftType: "AE",
    salary: "AC",
    gender: "AI",
    maxAge: "AK",
  },
  /** WIC */
  wic: {
    clientCompany: "K",
    location: "L",
    salary: "AG",
    employmentType: "BW",
    employmentTypeTransform: "wic-bw",
    shiftType: "AJ",
    referralFee: "C",
    url: "N",
    maxAge: "Q",
    gender: "P",
  },
  /** 高木工業 */
  "takagi-kogyo": {
    clientCompany: "I",
    location: "P",
    salary: "AW",
    defaultEmploymentType: "DISPATCH",
    shiftType: "AZ",
    referralFee: "B",
    otherNotes: "BS",
    maxAge: "AB",
    genderColumns: { male: "D", female: "E", any: "F" },
  },
  /** 日研 */
  nikken: {
    clientCompany: "B",
    location: "J",
    salary: "H",
    employmentType: "D",
    shiftType: "N",
    referralFee: "C",
    otherNotes: "Q",
    maxAge: "AD",
    gender: "S",
  },
  /** BREXA Next */
  "brexa-next": {
    clientCompany: "F",
    location: "J",
    salary: "O",
    employmentType: "G",
    shiftType: "R",
    referralFee: "AF",
    otherNotes: "AE",
    maxAge: "X",
    gender: "Y",
  },
};

export function getTabColumnMapping(companyKey: string): TabColumnMapping | null {
  return TAB_COLUMN_MAPPINGS[companyKey] ?? null;
}
