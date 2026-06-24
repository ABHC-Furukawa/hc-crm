/** 組織名から slug 候補を生成（衝突時は呼び出し側で suffix を付与） */
export function slugifyTenantName(name: string): string {
  const normalized = name
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  if (normalized.length >= 2) return normalized.slice(0, 50);
  return "tenant";
}
