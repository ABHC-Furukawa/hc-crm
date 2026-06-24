import type { CommutingArrangement, CommuteMeans } from "@prisma/client";

export const COMMUTING_ARRANGEMENT_LABELS: Record<CommutingArrangement, string> = {
  HOME_COMMUTE: "自宅通い",
  DORMITORY: "入寮",
};

export const COMMUTE_MEANS_LABELS: Record<CommuteMeans, string> = {
  CAR: "自動車",
  MOTORBIKE: "二輪車",
  BICYCLE: "自転車",
  BIKE: "バイク",
  PUBLIC_TRANSIT: "公共交通機関",
};

/** 手取り（万円）から月収目安（額面・万円）を概算 */
export function estimateGrossMonthlySalary(netManYen: number): number {
  if (netManYen <= 0) return 0;
  return Math.round(netManYen / 0.78);
}

/** 生年月日文字列 (YYYY-MM-DD) から年齢を計算 */
export function calculateAgeFromBirthDate(birthDate: string): number | null {
  if (!birthDate) return null;
  const birth = new Date(birthDate);
  if (Number.isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age -= 1;
  }
  return age >= 0 ? age : null;
}

export type ZipCloudResult = {
  address1: string;
  address2: string;
  address3: string;
};

/** 郵便番号から住所を検索（zipcloud API） */
export async function lookupAddressByPostalCode(
  postalCode: string
): Promise<ZipCloudResult | null> {
  const digits = postalCode.replace(/\D/g, "");
  if (digits.length !== 7) return null;

  const res = await fetch(
    `https://zipcloud.ibsnet.co.jp/api/search?zipcode=${digits}`,
    { cache: "no-store" }
  );
  if (!res.ok) return null;

  const json = (await res.json()) as {
    status: number;
    results?: ZipCloudResult[];
  };
  return json.results?.[0] ?? null;
}

export function formatPostalCode(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 7);
  if (digits.length <= 3) return digits;
  return `${digits.slice(0, 3)}-${digits.slice(3)}`;
}

export function formatYesNo(value: boolean | null | undefined): string {
  if (value === true) return "あり";
  if (value === false) return "なし";
  return "—";
}

export function formatHasExperience(value: boolean | null | undefined): string {
  if (value === true) return "有り";
  if (value === false) return "無し";
  return "—";
}
