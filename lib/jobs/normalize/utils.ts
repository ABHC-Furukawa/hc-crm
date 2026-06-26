import { EmploymentType, JobGender } from "@prisma/client";

export function normalizeCellText(value: string | null): string | null {
  if (!value) return null;
  const normalized = value.replace(/\r?\n/g, " ").replace(/\s+/g, " ").trim();
  return normalized.length > 0 ? normalized : null;
}

export function formatSalary(rawData: Record<string, string>): string | null {
  const direct = pickFirstValue(rawData, [
    "給与",
    "月収",
    "月給",
    "salary",
    "賃金",
    "想定月収　下限",
    "想定総支給",
    "日給・時給",
    "総支給額",
  ]);
  if (direct) return normalizeSalaryDisplay(direct);

  const type = pickFirstValue(rawData, ["給与区分"]);
  const base = pickFirstValue(rawData, ["基本給"]);
  if (type && base) return normalizeSalaryDisplay(`${type}${base}円`);
  if (base) return normalizeSalaryDisplay(`${base}円`);
  return null;
}

/** 勤務形態を 日勤 / 2交替 / 3交替 / 4交替 / 夜勤 に統一 */
export function normalizeShiftType(value: string | null): string | null {
  if (!value) return null;

  const v = value.trim().replace(/\s+/g, "");
  if (!v) return null;

  if (/4交替|四交替|４交替|4勤3休|4勤2休/.test(v)) return "4交替";
  if (/3交替|三交替|３交替|3勤2休|3勤1休/.test(v)) return "3交替";
  if (/2交替|二交替|２交替|2勤2休|2勤1休/.test(v)) return "2交替";
  if (/夜勤|深夜|夜シフト|夜番|夜間/.test(v)) return "夜勤";
  if (/日勤|常昼|デイ|日勤のみ|日勤専|長日/.test(v)) return "日勤";

  return null;
}

/** 給与を ○○万円 形式に統一（月収ベース） */
export function normalizeSalaryDisplay(value: string | null): string | null {
  if (!value) return null;

  const v = value.trim();
  if (!v) return null;

  if (/時給|時間給|\/h/i.test(v) && !/万|月収|月給|月/.test(v)) {
    return null;
  }

  const manRange = v.match(
    /(\d+(?:\.\d+)?)\s*万?\s*[〜～\-－—]\s*(\d+(?:\.\d+)?)\s*万/
  );
  if (manRange) {
    return `${formatManAmount(Number.parseFloat(manRange[1]!))}万円`;
  }

  const manMatch = v.match(/(\d+(?:\.\d+)?)\s*万/);
  if (manMatch) {
    return `${formatManAmount(Number.parseFloat(manMatch[1]!))}万円`;
  }

  const yenMatch = v.replace(/[,，\s¥￥\\]/g, "").match(/(\d{4,})/);
  if (yenMatch) {
    const yen = Number.parseInt(yenMatch[1]!, 10);
    if (Number.isFinite(yen) && yen >= 10_000) {
      return `${formatManAmount(yen / 10_000)}万円`;
    }
  }

  const compact = v.replace(/[,，\s]/g, "");
  if (/^\d+(?:\.\d+)?$/.test(compact)) {
    const n = Number.parseFloat(compact);
    if (n >= 10 && n <= 999) {
      return `${formatManAmount(n)}万円`;
    }
  }

  return null;
}

function formatManAmount(n: number): string {
  const rounded = Math.round(n * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}

export function pickFirstValue(
  rawData: Record<string, string>,
  keys: string[]
): string | null {
  for (const key of keys) {
    const exact = rawData[key];
    if (exact && exact.trim().length > 0) return exact.trim();
  }

  const normalized = Object.entries(rawData).find(([header, value]) => {
    if (!value || value.trim().length === 0) return false;
    const h = header.trim();
    return keys.some((k) => h.includes(k) || k.includes(h));
  });

  return normalized ? normalized[1].trim() : null;
}

/** 列名の完全一致のみ（短いエイリアスによる誤マッチ防止） */
export function pickExactFirstValue(
  rawData: Record<string, string>,
  keys: string[]
): string | null {
  for (const key of keys) {
    const exact = rawData[key];
    if (exact && exact.trim().length > 0) return exact.trim();
  }
  return null;
}

export function parseBooleanLabel(value: string | null): boolean | null {
  if (!value) return null;
  const v = value.trim();
  if (/^(あり|有|○|◯|yes|true|1|可|有り)$/i.test(v)) return true;
  if (/^(なし|無|×|✕|no|false|0|不可|無し|なし)$/i.test(v)) return false;
  if (/寮|社宅|入寮/.test(v)) return true;
  return null;
}

export function parseNightShift(value: string | null): boolean | null {
  if (!value) return null;
  const v = value.trim();
  if (/夜勤|交替|2交替|3交替|シフト制/.test(v)) return true;
  if (/日勤のみ|常昼|日勤専/.test(v)) return false;
  return parseBooleanLabel(v);
}

export function parseEmploymentType(value: string | null): EmploymentType {
  if (!value) return EmploymentType.UNKNOWN;
  const v = value.trim();
  if (/正社員|正職員|常勤/.test(v)) return EmploymentType.FULL_TIME;
  if (/パート|アルバイト|非常勤/.test(v)) return EmploymentType.PART_TIME;
  if (/派遣/.test(v)) return EmploymentType.DISPATCH;
  if (/契約|有期/.test(v)) return EmploymentType.CONTRACT;
  if (/臨時|短期/.test(v)) return EmploymentType.TEMPORARY;
  return EmploymentType.OTHER;
}

export function parseJobGender(value: string | null): JobGender {
  if (!value) return JobGender.UNKNOWN;

  const v = value.trim();
  if (!v) return JobGender.UNKNOWN;

  if (/^[×x✕X]$/.test(v)) {
    return JobGender.MALE;
  }
  if (/^[△▲]$/.test(v)) {
    return JobGender.ANY;
  }
  if (/^[○◯〇]$/.test(v)) {
    return JobGender.ANY;
  }

  if (/不問|問わず|問わない|性別不問|無問|どちらでも|男女OK|男女可/.test(v)) {
    return JobGender.ANY;
  }
  if (/^男女$|男女両方|男女問わず|男女活躍/.test(v)) {
    return JobGender.ANY;
  }
  if (/女性活躍|女性|女子|♀|女性歓迎|女性のみ|女のみ|女限定/.test(v)) {
    return JobGender.FEMALE;
  }
  if (/男性活躍|男性|男子|♂|男性のみ|男のみ|男限定/.test(v)) {
    return JobGender.MALE;
  }
  if (/男/.test(v) && /女/.test(v)) {
    return JobGender.ANY;
  }
  if (/男/.test(v)) {
    return JobGender.MALE;
  }
  if (/女/.test(v)) {
    return JobGender.FEMALE;
  }

  return JobGender.UNKNOWN;
}

export function parseMaxAge(value: string | null): number | null {
  if (!value) return null;

  const v = value.trim();
  if (!v) return null;

  const range = v.match(/(\d{1,3})\s*[〜～\-－—]\s*(\d{1,3})/);
  if (range) {
    const upper = Number.parseInt(range[2]!, 10);
    return Number.isFinite(upper) ? upper : null;
  }

  const until = v.match(/(\d{1,3})\s*(?:歳)?\s*(?:まで|迄|以下|以内)/);
  if (until) {
    const age = Number.parseInt(until[1]!, 10);
    return Number.isFinite(age) ? age : null;
  }

  const numbers = v.match(/\d{1,3}/g);
  if (!numbers || numbers.length === 0) return null;

  const parsed = numbers.map((n) => Number.parseInt(n, 10)).filter(Number.isFinite);
  if (parsed.length === 0) return null;

  return parsed.length >= 2 ? parsed[parsed.length - 1]! : parsed[0]!;
}

export function parseIntLabel(value: string | null): number | null {
  if (!value) return null;
  const match = value.replace(/[,，]/g, "").match(/\d+/);
  if (!match) return null;
  const n = Number.parseInt(match[0], 10);
  return Number.isFinite(n) ? n : null;
}

/** 紹介料セルを円単位の数値に変換（40 = 40万円、400000 = 40万円） */
export function parseReferralFeeYen(value: string | null): number | null {
  if (!value) return null;

  const raw = value.trim();
  if (!raw) return null;

  const normalized = raw.replace(/[,，\s\\¥￥]/g, "");

  const manMatch = normalized.match(/(\d+(?:\.\d+)?)\s*万/);
  if (manMatch) {
    return Math.round(Number.parseFloat(manMatch[1]!) * 10_000);
  }

  const numMatch = normalized.match(/(\d+(?:\.\d+)?)/);
  if (!numMatch) return null;

  const amount = Number.parseFloat(numMatch[1]!);
  if (!Number.isFinite(amount)) return null;

  if (/円/.test(raw) || amount >= 1_000) {
    return Math.round(amount);
  }

  return Math.round(amount * 10_000);
}

export function formatReferralFeeDisplay(yen: number): string {
  if (yen >= 10_000 && yen % 10_000 === 0) {
    return `${yen / 10_000}万円`;
  }
  return `${yen.toLocaleString("ja-JP")}円`;
}

export function meetsReferralFeeMinimum(
  value: string | null,
  minimumYen = 400_000
): boolean {
  const yen = parseReferralFeeYen(value);
  return yen != null && yen >= minimumYen;
}
