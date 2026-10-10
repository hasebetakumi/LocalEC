// 送る処理の純粋な部分（Deno に依存しない。アプリの Jest から単体テストする）

export type NotificationLike = {
  kind: string;
  booking_id: string | null;
  listing_id: string | null;
};

/** 取引通知（プッシュ＋メール）。新着はプッシュだけ */
export const EMAIL_KINDS: ReadonlySet<string> = new Set([
  'booking_confirmed',
  'reminder',
  'cancelled_by_staff',
  'listing_changed',
]);

/** 通知をタップしたときに開く画面（アプリ内のパス） */
export function deepLink(n: NotificationLike): string {
  if (n.booking_id) return `/bookings/${n.booking_id}`;
  if (n.listing_id)
    return n.kind === 'notice_published' ? `/notices/${n.listing_id}` : `/listings/${n.listing_id}`;
  return '/';
}

/** 次に送り直す時刻（5 分 × 回数） */
export function retryAt(attempts: number, now: Date = new Date()): string {
  return new Date(now.getTime() + Math.max(attempts, 1) * 5 * 60_000).toISOString();
}

/** Expo Push API は 1 回 100 件まで */
export function chunk<T>(items: readonly T[], size = 100): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

/** メールの件名と本文 */
export function emailContent(n: { title: string; body: string }): {
  subject: string;
  text: string;
} {
  return {
    subject: `【LocalEC】${n.title}`,
    text: `${n.body}\n\nアプリの「予約・申込」からも確認できます。\n\n※このメールは送信専用です。`,
  };
}

export type PushReceipt = { status: string; message?: string; details?: { error?: string } };

/** 受領が届くのは送ってから 15 分ほど後。Expo に残るのは 24 時間 */
export const RECEIPT_DELAY_MS = 15 * 60_000;
export const RECEIPT_TTL_MS = 24 * 60 * 60_000;

/**
 * 受領の結果を振り分ける。
 * - unregistered：端末から外れたトークン（無効化する）
 * - finished：確認が済んだ（または期限を過ぎて確認できない）チケット（消す）
 * まだ受領がないチケットは、どちらにも入れず次の実行で見直す
 */
export function classifyReceipts(
  tickets: readonly { ticket_id: string; token: string; created_at: string }[],
  receipts: Readonly<Record<string, PushReceipt>>,
  now: Date = new Date(),
): { unregistered: string[]; finished: string[] } {
  const unregistered = new Set<string>();
  const finished: string[] = [];
  for (const t of tickets) {
    const r = receipts[t.ticket_id];
    if (r) {
      if (r.status === 'error' && r.details?.error === 'DeviceNotRegistered') {
        unregistered.add(t.token);
      }
      finished.push(t.ticket_id);
    } else if (now.getTime() - new Date(t.created_at).getTime() > RECEIPT_TTL_MS) {
      finished.push(t.ticket_id);
    }
  }
  return { unregistered: [...unregistered], finished };
}
