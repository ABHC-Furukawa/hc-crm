/** 会社（タブ）ごとの Google Sheets 同期設定 */
export type CompanySheetConfig = {
  companyKey: string;
  displayName: string;
  spreadsheetId: string;
  sheetName: string;
  /** 1始まり。0 = 先頭20行から自動検出 */
  headerRow: number;
  /** 1始まり。0 = headerRow の次の行 */
  dataStartRow: number;
};

export type CompanySheetConfigEntry = Omit<CompanySheetConfig, "spreadsheetId">;

/**
 * 1 Spreadsheet（JOB_SPREADSHEET_ID）内の各タブを直接同期。
 * sheetName はスプレッドシートのタブ名と完全一致させること。
 */
export const COMPANY_SHEET_CONFIG_ENTRIES: CompanySheetConfigEntry[] = [
  {
    companyKey: "sogo-career",
    displayName: "綜合キャリア",
    sheetName: "綜合キャリア",
    headerRow: 0,
    dataStartRow: 0,
  },
  {
    companyKey: "ns-haken",
    displayName: "ns派遣",
    sheetName: "ns派遣",
    headerRow: 0,
    dataStartRow: 0,
  },
  {
    companyKey: "ns-seishain",
    displayName: "ns正社員",
    sheetName: "ns正社員",
    headerRow: 0,
    dataStartRow: 0,
  },
  {
    companyKey: "wt",
    displayName: "WT",
    sheetName: "WT",
    headerRow: 3,
    dataStartRow: 4,
  },
  {
    companyKey: "hirayama",
    displayName: "平山",
    sheetName: "平山",
    headerRow: 0,
    dataStartRow: 0,
  },
  {
    companyKey: "shinnihon",
    displayName: "新日本",
    sheetName: "新日本",
    headerRow: 3,
    dataStartRow: 4,
  },
  {
    companyKey: "yokota-enterprise",
    displayName: "ヨコタエンタープライズ",
    sheetName: "ヨコタエンタープライズ",
    headerRow: 0,
    dataStartRow: 0,
  },
  {
    companyKey: "ut-aim",
    displayName: "UTエイム",
    sheetName: "UTエイム",
    headerRow: 5,
    dataStartRow: 6,
  },
  {
    companyKey: "wic",
    displayName: "WIC",
    sheetName: "WIC",
    headerRow: 0,
    dataStartRow: 0,
  },
  {
    companyKey: "takagi-kogyo",
    displayName: "高木工業",
    sheetName: "高木工業",
    headerRow: 0,
    dataStartRow: 0,
  },
  {
    companyKey: "nikken",
    displayName: "日研",
    sheetName: "日研",
    headerRow: 0,
    dataStartRow: 0,
  },
  {
    companyKey: "brexa-next",
    displayName: "BREXA Next",
    sheetName: "BREXA Next",
    headerRow: 0,
    dataStartRow: 0,
  },
  {
    companyKey: "jisha-haken",
    displayName: "自社派遣",
    sheetName: "自社派遣",
    headerRow: 0,
    dataStartRow: 0,
  },
];

function parseEnvSheetConfigs(spreadsheetId: string): CompanySheetConfig[] | null {
  const raw = process.env.JOB_SHEET_TABS;
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as CompanySheetConfigEntry[];
    if (!Array.isArray(parsed)) return null;
    return parsed.map((entry) => ({ ...entry, spreadsheetId }));
  } catch {
    return null;
  }
}

export function getJobSpreadsheetId(): string | null {
  const id = process.env.JOB_SPREADSHEET_ID?.trim();
  return id && id.length > 0 ? id : null;
}

export function isJobSyncConfigured(): boolean {
  return getJobSpreadsheetId() != null && Boolean(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
}

export function getCompanySheetConfigs(): CompanySheetConfig[] {
  const spreadsheetId = getJobSpreadsheetId();
  if (!spreadsheetId) return [];

  const fromEnv = parseEnvSheetConfigs(spreadsheetId);
  if (fromEnv && fromEnv.length > 0) return fromEnv;

  return COMPANY_SHEET_CONFIG_ENTRIES.map((entry) => ({
    ...entry,
    spreadsheetId,
  }));
}

export function getCompanySheetConfig(companyKey: string): CompanySheetConfig | null {
  return getCompanySheetConfigs().find((c) => c.companyKey === companyKey) ?? null;
}
