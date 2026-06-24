/** RFC4180 風の簡易 CSV パーサー（引用符・改行対応） */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  const content = text.replace(/^\uFEFF/, "");

  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    const next = content[i + 1];

    if (inQuotes) {
      if (char === '"') {
        if (next === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
      continue;
    }

    if (char === ",") {
      row.push(field);
      field = "";
      continue;
    }

    if (char === "\r") {
      continue;
    }

    if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      continue;
    }

    field += char;
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows;
}

export function rowsToObjects(
  rows: string[][],
  headerMap: Record<string, string>
): { objects: Record<string, string>[]; headers: string[]; errors: string[] } {
  if (rows.length === 0) {
    return { objects: [], headers: [], errors: ["CSV が空です"] };
  }

  const rawHeaders = rows[0].map((h) => h.trim());
  const fieldKeys: (string | null)[] = rawHeaders.map((header) => headerMap[header] ?? null);

  const unknownHeaders = rawHeaders.filter((header, index) => !fieldKeys[index]);
  const errors: string[] = [];
  if (unknownHeaders.length > 0) {
    errors.push(`未対応の列: ${unknownHeaders.join(", ")}`);
  }

  if (!fieldKeys.includes("name")) {
    errors.push("「氏名」列が必要です");
  }

  const objects: Record<string, string>[] = [];
  for (let i = 1; i < rows.length; i++) {
    const cells = rows[i];
    if (cells.every((cell) => cell.trim() === "")) continue;

    const obj: Record<string, string> = {};
    for (let col = 0; col < fieldKeys.length; col++) {
      const key = fieldKeys[col];
      if (!key) continue;
      obj[key] = (cells[col] ?? "").trim();
    }
    objects.push(obj);
  }

  return { objects, headers: rawHeaders, errors };
}
