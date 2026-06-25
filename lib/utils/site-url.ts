const LOCAL_DEV_URL = "http://localhost:3003";

function normalizeSiteUrl(url: string): string {
  return url.replace(/\/$/, "");
}

function isLocalhostUrl(url: string): boolean {
  try {
    const { hostname } = new URL(url);
    return hostname === "localhost" || hostname === "127.0.0.1";
  } catch {
    return false;
  }
}

/** パスワードリセット・招待メール等の redirectTo 用 */
export function getSiteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL
    ? normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL)
    : undefined;

  // Vercel 上では localhost のビルド時 env を無視し、デプロイ URL を優先する
  if (process.env.VERCEL) {
    if (configured && !isLocalhostUrl(configured)) {
      return configured;
    }
    if (process.env.VERCEL_URL) {
      return `https://${process.env.VERCEL_URL}`;
    }
  }

  if (configured) {
    return configured;
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return LOCAL_DEV_URL;
}
