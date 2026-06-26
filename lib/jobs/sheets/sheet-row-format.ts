import type { sheets_v4 } from "googleapis";

type GridCell = sheets_v4.Schema$CellData | null | undefined;

/** シート上のグレー背景（クローズ案件）を検出 */
export function isGrayBackgroundColor(
  color: sheets_v4.Schema$Color | null | undefined
): boolean {
  if (!color) return false;

  const r = color.red ?? 1;
  const g = color.green ?? 1;
  const b = color.blue ?? 1;

  // 白・未設定はアクティブ行
  if (r > 0.97 && g > 0.97 && b > 0.97) return false;

  const maxDiff = Math.max(Math.abs(r - g), Math.abs(g - b), Math.abs(r - b));
  if (maxDiff > 0.1) return false;

  const avg = (r + g + b) / 3;
  // 典型: #999999, #cccccc, #d9d9d9, #efefef, #f3f3f3
  return avg >= 0.5 && avg <= 0.96;
}

export function isRowClosedByFormatting(cells: GridCell[] | null | undefined): boolean {
  if (!cells || cells.length === 0) return false;

  let contentCells = 0;
  let grayCells = 0;
  let struckCells = 0;

  for (const cell of cells) {
    const value = cell?.formattedValue?.trim();
    if (!value) continue;

    contentCells++;
    const bg = cell?.effectiveFormat?.backgroundColor;
    if (isGrayBackgroundColor(bg)) grayCells++;

    if (cell?.effectiveFormat?.textFormat?.strikethrough) struckCells++;
  }

  if (contentCells === 0) return false;

  if (struckCells >= Math.max(1, Math.ceil(contentCells * 0.5))) return true;

  const firstBg = cells.find((c) => c?.formattedValue?.trim())?.effectiveFormat
    ?.backgroundColor;
  if (isGrayBackgroundColor(firstBg)) return true;

  return grayCells >= Math.max(1, Math.ceil(contentCells * 0.5));
}
