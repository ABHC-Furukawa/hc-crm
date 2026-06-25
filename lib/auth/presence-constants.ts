/** この時間以内に操作があればオンライン */
export const CA_PRESENCE_ONLINE_WINDOW_MS = 10 * 60 * 1000;

/** lastSeenAt 更新の最小間隔（DB 書き込み抑制） */
export const LAST_SEEN_TOUCH_INTERVAL_MS = 2 * 60 * 1000;

export type CaPresenceStatus = "online" | "offline" | "unknown";

export function resolveCaPresenceStatus(
  lastSeenAt: Date | null,
  now: Date = new Date()
): CaPresenceStatus {
  if (!lastSeenAt) return "unknown";
  return now.getTime() - lastSeenAt.getTime() <= CA_PRESENCE_ONLINE_WINDOW_MS
    ? "online"
    : "offline";
}
