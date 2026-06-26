/** Excel 列記号（A, B, …, BO）を 0 始まりのインデックスに変換 */
export function columnLetterToIndex(column: string): number {
  const normalized = column.trim().toUpperCase();
  if (!/^[A-Z]+$/.test(normalized)) {
    throw new Error(`Invalid column letter: ${column}`);
  }

  let index = 0;
  for (let i = 0; i < normalized.length; i++) {
    index = index * 26 + (normalized.charCodeAt(i) - 64);
  }

  return index - 1;
}

export function pickCellByColumn(
  row: string[] | undefined,
  column: string | undefined
): string | null {
  if (!column || !row) return null;
  const index = columnLetterToIndex(column);
  const value = row[index];
  if (value == null) return null;
  const trimmed = value.replace(/\r\n/g, "\n").trim();
  return trimmed.length > 0 ? trimmed : null;
}
