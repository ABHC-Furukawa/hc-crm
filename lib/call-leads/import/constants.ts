export const CALL_LEAD_IMPORT_CHUNK_SIZE = 500;

export const CALL_LEAD_PAGE_SIZES = [50, 100] as const;
export const CALL_LEAD_DEFAULT_PAGE_SIZE = 100;

export function chunkArray<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}
