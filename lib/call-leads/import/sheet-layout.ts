import { CSV_HEADER_MAP } from "@/lib/validators/call-lead-import";

const HEADER_SIGNALS = [
  ...Object.keys(CSV_HEADER_MAP),
  "氏名",
  "名前",
  "求職者",
  "応募",
  "メール",
  "電話",
  "年齢",
];

const HEADER_EXACT = new Set(Object.keys(CSV_HEADER_MAP));

export function normalizeHeaderCell(value: unknown): string {
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
    if (!text || text.length > 80) continue;
    if (text.length <= 24) shortLabels++;
    if (HEADER_EXACT.has(text)) {
      score += 3;
      continue;
    }
    if (HEADER_SIGNALS.some((signal) => text === signal || text.includes(signal))) {
      score++;
    }
  }

  return shortLabels >= 3 ? score : 0;
}

export function detectCallLeadHeaderRow(grid: string[][]): number {
  const limit = Math.min(grid.length, 20);
  let bestRow = 1;
  let bestScore = 0;

  for (let i = 0; i < limit; i++) {
    const score = scoreHeaderRow(grid[i] ?? []);
    if (score > bestScore) {
      bestScore = score;
      bestRow = i + 1;
    }
  }

  return bestScore > 0 ? bestRow : 1;
}

export function resolveCallLeadSheetLayout(
  grid: string[][],
  config: { headerRow: number; dataStartRow: number }
): { headerRow: number; dataStartRow: number } {
  const headerRow =
    config.headerRow > 0 ? config.headerRow : detectCallLeadHeaderRow(grid);
  const dataStartRow =
    config.dataStartRow > 0 ? config.dataStartRow : headerRow + 1;

  return { headerRow, dataStartRow };
}
