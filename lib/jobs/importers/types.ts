import type { EmploymentType, JobGender } from "@prisma/client";

export type ImportRowContext = {
  companyKey: string;
  displayName: string;
  sheetName: string;
  rowNumber: number;
};

/** マスターシート標準項目 + 取込メタデータ */
export type NormalizedJobInput = {
  companyName: string;
  jobTitle: string;
  location: string | null;
  salary: string | null;
  employmentType: EmploymentType;
  shiftType: string | null;
  shiftTypeDetail: string | null;
  gender: JobGender;
  maxAge: number | null;
  referralFee: string | null;
  otherNotes: string | null;
  sourceUrl: string | null;
  sourceCompany: string;
  sourceSheet: string;
};

export type NormalizationError = {
  rowNumber: number;
  message: string;
  /** true の場合は失敗件数に含めない（紹介料不足・空行など） */
  skip?: boolean;
};

export interface CompanyImporter {
  readonly companyKey: string;
  readonly displayName: string;
  shouldSkip(rawData: Record<string, string>): boolean;
  normalize(
    rawData: Record<string, string>,
    ctx: ImportRowContext
  ): NormalizedJobInput | null;
}
