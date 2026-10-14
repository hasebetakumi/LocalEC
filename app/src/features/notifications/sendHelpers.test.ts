// 送る処理（Edge Function）の純粋な部分。Deno に依存しないのでアプリの Jest で確かめる
import {
  chunk,
  classifyReceipts,
  deepLink,
  EMAIL_KINDS,
  emailContent,
  emailLink,
  escapeHtml,
  retryAt,
} from '../../../supabase/functions/send-notifications/helpers';

import { notificationUrl } from './links';

const ID = '00000000-0000-4000-8000-000000000101';
const BASE = {
  kind: 'booking_confirmed',
  title: '予約が完了しました',
  body: '「日替わり弁当」の予約番号は 1024 です。',
  to: 'user@example.com',
};

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
  it('メールの件名と本文（テキスト版は HTML 化の前と同じ形）', () => {
    const mail = emailContent({ ...BASE, title: '予約が完了しました', body: '番号は 0427 です。' });
    expect(mail.subject).toBe('【LocalEC】予約が完了しました');
    expect(mail.text).toBe(
      '番号は 0427 です。\n\nアプリの「予約・申込」からも確認できます。\n\n※このメールは送信専用です。',
    );
  });
  it('HTML のエスケープ', () => {
    expect(escapeHtml(`<b>&"'`)).toBe('&lt;b&gt;&amp;&quot;&#39;');
  });
  it('ボタンの先：APP_WEB_URL がなければ null、末尾の / はあってもなくてもよい', () => {
    const n = { kind: 'booking_confirmed', booking_id: ID, listing_id: ID };
    expect(emailLink(undefined, n)).toBeNull();
    expect(emailLink('', n)).toBeNull();
    expect(emailLink('https://x.expo.app', n)).toBe(`https://x.expo.app/bookings/${ID}`);
    expect(emailLink('https://x.expo.app/', n)).toBe(`https://x.expo.app/bookings/${ID}`);
  });
  it('番号の箱：確定とリマインドで、種類ごとのラベル', () => {
    const html = (kind: string, bookingKind: string) =>
      emailContent({ ...BASE, kind, booking: { number: '1024', kind: bookingKind } }).html;
    expect(html('booking_confirmed', 'product')).toContain('予約番号');
    expect(html('booking_confirmed', 'product')).toContain('>1024</div>');
    expect(html('reminder', 'event')).toContain('申し込み番号');
    expect(html('reminder', 'job')).toContain('受付番号');
  });
  it('番号の箱：キャンセル・変更では出さない。予約が引けないときも出さない', () => {
    const booking = { number: '1024', kind: 'product' };
    for (const kind of ['cancelled_by_staff', 'cancelled_by_user', 'listing_changed']) {
      expect(emailContent({ ...BASE, kind, booking }).html).not.toContain('>1024</div>');
    }
    expect(emailContent({ ...BASE, booking: null }).html).not.toContain('font-size:32px');
  });
  it('ボタン：URL がなければ出さず、あればその URL へ 1 つ', () => {
    expect(emailContent(BASE).html).not.toContain('<a href');
    const url = `https://x.expo.app/bookings/${ID}`;
    const mail = emailContent({ ...BASE, url });
    expect(mail.html.match(/<a href=/g)).toHaveLength(1);
    expect(mail.html).toContain(`href="${url}"`);
    expect(mail.html).toContain('予約・申込を見る');
    expect(mail.text).toContain(`詳細：${url}`);
  });
  it('補足とフッター：ボタンの有無にかかわらず出し、宛先を入れる', () => {
    const html = emailContent(BASE).html;
    expect(html).toContain('アプリの「予約・申込」からも確認できます。');
    expect(html).toContain('（user@example.com）宛て');
  });
  it('掲載名に入った記号はエスケープされ、改行は <br /> になる', () => {
    const html = emailContent({
      ...BASE,
      title: '<script>alert(1)</script>',
      body: '「A&B」の予約\n2 行目',
    }).html;
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
    expect(html).toContain('「A&amp;B」の予約<br />2 行目');
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
