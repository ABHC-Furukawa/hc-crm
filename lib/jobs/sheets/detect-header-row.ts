import { COLUMN_ALIASES } from "@/lib/jobs/sheet-columns";

const HEADER_SIGNALS = [
  ...COLUMN_ALIASES.clientCompany,
  ...COLUMN_ALIASES.referralFee,
  ...COLUMN_ALIASES.location,
  ...COLUMN_ALIASES.salary,
  ...COLUMN_ALIASES.gender,
  ...COLUMN_ALIASES.maxAge,
  "仕事No",
  "求人",
  "仕事内容",
  "赴任日",
  "入社日",
  "備考",
  "入社枠",
  "ジョブパル",
  "お仕事No",
  "Fee",
];

/** 列名として確実なラベル（完全一致で加点） */
const HEADER_EXACT = new Set([
  "事業所",
  "赴任日",
  "入社日",
  "年齢",
  "性別",
  "仕事内容",
  "備考",
  "入社枠",
  "Fee",
  "紹介料",
  "企業名 / 工場名",
  "cf / fc / 事業所",
  "日給・時給",
  "派遣先企業名",
  "勤務地",
  "給与",
  "雇用形態",
  "勤務形態",
]);

function normalizeHeaderCell(value: unknown): string {
  return String(value ?? "")
    .replace(/\r?\n/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function scoreHeaderRow(row: unknown[]): number {
  let score = 0;
  let shortLabels = 0;

  for (const cell of row) {
    const text = normalizeHeaderCell(cell);
    if (!text) continue;

    // データ行はセルが長文になりやすい — ヘッダー候補から除外
    if (text.length > 80) continue;

    if (text.length <= 24) shortLabels++;

    if (HEADER_EXACT.has(text)) {
      score += 3;
      continue;
    }

    if (HEADER_SIGNALS.some((signal) => text === signal || text.includes(signal))) {
      score++;
    }
  }

  if (shortLabels < 3) return 0;

  return score;
}

/** 先頭20行からヘッダー行（1始まり）を推定 */
export function detectHeaderRow(grid: string[][]): number {
  let bestIndex = 0;
  let bestScore = 0;

  for (let i = 0; i < Math.min(20, grid.length); i++) {
    const score = scoreHeaderRow(grid[i] ?? []);
    if (score > bestScore) {
      bestScore = score;
      bestIndex = i;
    }
  }

  return bestScore >= 3 ? bestIndex + 1 : 1;
}

export function resolveSheetLayout(
  grid: string[][],
  config: { headerRow: number; dataStartRow: number }
): { headerRow: number; dataStartRow: number } {
  const headerRow =
    config.headerRow > 0 ? config.headerRow : detectHeaderRow(grid);
  const dataStartRow =
    config.dataStartRow > 0 ? config.dataStartRow : headerRow + 1;

  return { headerRow, dataStartRow };
}

export { normalizeHeaderCell };
