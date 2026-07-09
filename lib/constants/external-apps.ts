/**
 * TOP ページ「アプリケーション」ブロック用の外部リンク。
 * 追加時はこの配列に足すだけでよい。
 */
export const EXTERNAL_APPS = [
  {
    id: "notion",
    name: "Notion",
    description: "業務ナレッジ・マニュアル",
    href: "https://chatter-belief-e38.notion.site/AssetBusinessHumanCapital-2ddaff0286f681228b87c34098bad95c",
  },
  {
    id: "google-maps",
    name: "Google マップ",
    description: "地図・ルート検索",
    href: "https://www.google.com/maps",
  },
  {
    id: "google-calendar",
    name: "Google カレンダー",
    description: "予定・スケジュール",
    href: "https://calendar.google.com",
  },
  {
    id: "racone",
    name: "RACONE",
    description: "業務システム",
    href: "https://business.raconne.app",
  },
  {
    id: "sonar",
    name: "SONAR",
    description: "採用管理",
    href: "https://manager.snar.jp",
  },
  {
    id: "jobuddy",
    name: "JOBUDDY",
    description: "求人・マッチング",
    href: "https://jobuddy.jp/admin/login",
  },
] as const;

export type ExternalApp = (typeof EXTERNAL_APPS)[number];
