import { COLUMN_ALIASES } from "@/lib/jobs/sheet-columns";
import { pickExactFirstValue, pickFirstValue } from "@/lib/jobs/normalize/utils";

const SKIP_SHIFT_DETAIL_HEADERS =
  /配属先企業|派遣先|就業先|取引先企業|クライアント|紹介料|給与|性別|年齢|URL|MAP|^ATS$|手数料|Fee|住所|就業先名|企業名|作業所|現場名/;

const SKIP_NOTE_HEADERS =
  /紹介|給与|手数料|Fee|年齢|性別|男女|URL|MAP|ATS|住所|就業先|派遣先|企業|取引先|クライアント|応募|資格|寮/;

function isShiftRelatedHeader(header: string, value: string): boolean {
  const text = `${header}${value}`;
  if (/勤務形態|勤務シフト|シフト|交替|夜勤|勤務時間|就業時間|時間帯|勤務帯/.test(header)) {
    return true;
  }
  if (/配属/.test(header) && !/配属先|配属先企業/.test(header)) {
    return true;
  }
  if (/※/.test(header) && !SKIP_NOTE_HEADERS.test(header)) {
    return true;
  }
  if ((/※/.test(header) || /※/.test(value)) && /勤務|シフト|配属|交替|夜|休/.test(text)) {
    return true;
  }
  if (/備考|補足|メモ|特記/.test(header) && /勤務|シフト|交替|夜|休|配属/.test(text)) {
    return true;
  }
  return false;
}

/** シート上の勤務形態原文（※・備考・改行を保持） */
export function buildShiftTypeDetail(
  rawData: Record<string, string> | null | undefined
): string | null {
  if (!rawData) return null;

  const parts: string[] = [];
  const seen = new Set<string>();

  const append = (text: string, label?: string) => {
    const v = text.replace(/\r\n/g, "\n").trim();
    if (!v || seen.has(v)) return;
    seen.add(v);
    if (label && label !== v && !v.startsWith(`${label}\n`)) {
      parts.push(`${label}\n${v}`);
    } else {
      parts.push(v);
    }
  };

  const primary =
    pickExactFirstValue(rawData, [...COLUMN_ALIASES.shiftType]) ??
    pickFirstValue(rawData, [...COLUMN_ALIASES.shiftType]);
  if (primary) {
    const primaryKey =
      COLUMN_ALIASES.shiftType.find((k) => rawData[k]?.trim()) ??
      Object.keys(rawData).find((k) =>
        COLUMN_ALIASES.shiftType.some((alias) => k.includes(alias))
      ) ??
      "勤務形態";
    append(primary, primaryKey);
  }

  for (const [header, value] of Object.entries(rawData)) {
    const v = value?.replace(/\r\n/g, "\n").trim();
    if (!v || seen.has(v)) continue;
    if (SKIP_SHIFT_DETAIL_HEADERS.test(header)) continue;

    const isShiftColumn = COLUMN_ALIASES.shiftType.some(
      (k) => header === k || header.includes(k)
    );
    if (isShiftColumn) continue;

    if (!isShiftRelatedHeader(header, v)) continue;
    append(v, header);
  }

  return parts.length > 0 ? parts.join("\n\n") : null;
}