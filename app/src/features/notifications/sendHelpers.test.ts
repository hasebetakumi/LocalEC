// 送る処理（Edge Function）の純粋な部分。Deno に依存しないのでアプリの Jest で確かめる
import {
  chunk,
  classifyReceipts,
  deepLink,
  EMAIL_KINDS,
  emailContent,
  retryAt,
} from '../../../supabase/functions/send-notifications/helpers';

import { notificationUrl } from './links';

const ID = '00000000-0000-4000-8000-000000000101';

describe('送る処理の補助', () => {
  it('タップ先：予約 → 予約詳細、お知らせ → お知らせ詳細、新着 → 掲載詳細', () => {
    expect(deepLink({ kind: 'booking_confirmed', booking_id: ID, listing_id: ID })).toBe(
      `/bookings/${ID}`,
    );
    expect(deepLink({ kind: 'notice_published', booking_id: null, listing_id: ID })).toBe(
      `/notices/${ID}`,
    );
    expect(deepLink({ kind: 'listing_published', booking_id: null, listing_id: ID })).toBe(
      `/listings/${ID}`,
    );
  });
  it('送る側のタップ先は、アプリ側で開ける形になっている', () => {
    for (const kind of ['booking_confirmed', 'notice_published', 'listing_published']) {
      const url = deepLink({
        kind,
        booking_id: kind === 'booking_confirmed' ? ID : null,
        listing_id: ID,
      });
      expect(notificationUrl({ url })).toBe(url);
    }
  });
  it('メールを送るのは取引通知だけ', () => {
    expect(EMAIL_KINDS.has('reminder')).toBe(true);
    expect(EMAIL_KINDS.has('listing_published')).toBe(false);
    expect(EMAIL_KINDS.has('notice_published')).toBe(false);
  });
  it('再送は 5 分 × 回数', () => {
    const now = new Date('2026-10-10T00:00:00Z');
    expect(retryAt(1, now)).toBe('2026-10-10T00:05:00.000Z');
    expect(retryAt(3, now)).toBe('2026-10-10T00:15:00.000Z');
  });
  it('Expo へは 100 件ずつ', () => {
    expect(chunk(Array.from({ length: 250 }, (_, i) => i)).map((c) => c.length)).toEqual([
      100, 100, 50,
    ]);
  });
  it('メールの件名と本文', () => {
    expect(emailContent({ title: '予約が完了しました', body: '番号は 0427 です。' })).toEqual({
      subject: '【LocalEC】予約が完了しました',
      text: '番号は 0427 です。\n\nアプリの「予約・申込」からも確認できます。\n\n※このメールは送信専用です。',
    });
  });
  it('受領：端末から外れたトークンを無効化し、確認済みと期限切れのチケットを消す', () => {
    const now = new Date('2026-10-10T12:00:00Z');
    const tickets = [
      { ticket_id: 't1', token: 'tok-a', created_at: '2026-10-10T11:30:00Z' },
      { ticket_id: 't2', token: 'tok-b', created_at: '2026-10-10T11:30:00Z' },
      { ticket_id: 't3', token: 'tok-c', created_at: '2026-10-10T11:30:00Z' },
      { ticket_id: 't4', token: 'tok-d', created_at: '2026-10-09T11:00:00Z' },
    ];
    const result = classifyReceipts(
      tickets,
      {
        t1: { status: 'ok' },
        t2: { status: 'error', message: 'x', details: { error: 'DeviceNotRegistered' } },
      },
      now,
    );
    expect(result.unregistered).toEqual(['tok-b']);
    // t3 はまだ受領がないので残す。t4 は 24 時間を過ぎたので諦める
    expect(result.finished).toEqual(['t1', 't2', 't4']);
  });
});
