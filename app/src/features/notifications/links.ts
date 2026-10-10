/**
 * 通知をタップしたときに開く画面の決め方（送る側の deepLink と対になる）。
 * 外部の URL や想定外のパスは開かない
 */
const ALLOWED = [
  /^\/bookings\/[0-9a-f-]{36}$/,
  /^\/notices\/[0-9a-f-]{36}$/,
  /^\/listings\/[0-9a-f-]{36}$/,
  /^\/$/,
];

export function notificationUrl(data: unknown): string | null {
  if (!data || typeof data !== 'object') return null;
  const url = (data as { url?: unknown }).url;
  if (typeof url !== 'string') return null;
  return ALLOWED.some((re) => re.test(url)) ? url : null;
}
