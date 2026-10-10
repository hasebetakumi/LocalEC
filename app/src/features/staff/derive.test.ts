import { jstDate, NOW } from '@/test/fixtures';
import { makeRow, makeStaffListing } from '@/test/staffFixtures';

import {
  amountText,
  bookingItemText,
  bookingSummaryLine,
  listingBookingTotalLine,
  productTotal,
  customerLabel,
  doneActionLabel,
  initialOf,
  listingMetric,
  listingScheduleLine,
  matchesPeriod,
  matchesStatus,
  revertActionLabel,
  rowTimeText,
  sortBookings,
  staffStatus,
} from './derive';

describe('予約の状態（運営側）', () => {
  it('種類で名前が変わり、色は 3 つ', () => {
    expect(staffStatus(makeRow(), NOW)).toEqual({ label: '未受け取り', tone: 'open' });
    expect(staffStatus(makeRow({ kind: 'event' }), NOW)).toEqual({ label: '未参加', tone: 'open' });
    expect(staffStatus(makeRow({ kind: 'job', status: 'completed' }), NOW)).toEqual({
      label: '勤務済み',
      tone: 'done',
    });
    expect(staffStatus(makeRow({ status: 'cancelled' }), NOW)).toEqual({
      label: 'キャンセル',
      tone: 'closed',
    });
  });
  it('期限を過ぎた予約中は期限切れ', () => {
    expect(staffStatus(makeRow(), jstDate('2026-10-05 13:30'))).toEqual({
      label: '期限切れ',
      tone: 'closed',
    });
  });
  it('ボタンの文言', () => {
    expect(doneActionLabel('product')).toBe('受け取り済みにする');
    expect(doneActionLabel('event')).toBe('参加済みにする');
    expect(revertActionLabel('job')).toBe('未勤務に戻す');
  });
  it('状態の絞り込み', () => {
    const late = jstDate('2026-10-05 14:00');
    expect(matchesStatus(makeRow(), 'open', NOW)).toBe(true);
    expect(matchesStatus(makeRow(), 'open', late)).toBe(false);
    expect(matchesStatus(makeRow(), 'closed', late)).toBe(true);
    expect(matchesStatus(makeRow({ status: 'completed' }), 'done', NOW)).toBe(true);
  });
});

describe('期間（日本時間の今日 0:00・明日 0:00 が境界）', () => {
  it('本日は今日と重なるもの', () => {
    expect(matchesPeriod(makeRow(), 'today', NOW)).toBe(true);
    // 受け取り期間中の複数日
    const multi = makeRow({
      scheduleStart: jstDate('2026-10-03 09:00'),
      scheduleEnd: jstDate('2026-10-12 17:00'),
    });
    expect(matchesPeriod(multi, 'today', NOW)).toBe(true);
    // 明日 0:00 ちょうどに始まるものは今後
    const tomorrow = makeRow({
      scheduleStart: jstDate('2026-10-06 00:00'),
      scheduleEnd: jstDate('2026-10-06 02:00'),
    });
    expect(matchesPeriod(tomorrow, 'today', NOW)).toBe(false);
    expect(matchesPeriod(tomorrow, 'future', NOW)).toBe(true);
  });
  it('過去は今日 0:00 より前に終わったもの', () => {
    const yesterday = makeRow({
      scheduleStart: jstDate('2026-10-04 11:30'),
      scheduleEnd: jstDate('2026-10-04 23:59'),
    });
    expect(matchesPeriod(yesterday, 'past', NOW)).toBe(true);
    expect(matchesPeriod(yesterday, 'today', NOW)).toBe(false);
  });
});

describe('行の表示', () => {
  it('削除済みユーザー', () => {
    expect(customerLabel(makeRow())).toBe('栗橋 花子');
    expect(customerLabel(makeRow({ customerDeleted: true, customerName: null }))).toBe(
      '削除済みユーザー',
    );
  });
  it('内容・金額・時間', () => {
    expect(bookingItemText(makeRow())).toBe('日替わり弁当　2食');
    expect(bookingItemText(makeRow({ kind: 'event', quantity: 1, listingTitle: '講座' }))).toBe(
      '講座　1名',
    );
    expect(amountText(makeRow())).toBe('1,200円');
    expect(amountText(makeRow({ kind: 'event', amount: 0 }))).toBe('無料');
    expect(amountText(makeRow({ kind: 'job', amount: null, listingPayText: '日給 9,000円' }))).toBe(
      '日給 9,000円',
    );
    expect(rowTimeText(makeRow())).toBe('11:30〜13:30');
    expect(
      rowTimeText(
        makeRow({
          scheduleStart: jstDate('2026-10-05 09:00'),
          scheduleEnd: jstDate('2026-10-12 17:00'),
        }),
      ),
    ).toBe('〜10/12');
  });
  it('件数行の補足', () => {
    const rows = [
      makeRow(),
      makeRow({ id: 'b2' }),
      makeRow({ id: 'b3', kind: 'event', quantity: 2 }),
    ];
    expect(bookingSummaryLine(rows, 'today', NOW)).toBe(
      '10/5(月)　受け取り 2件（合計 2,400円）・イベント 2名　時間の早い順',
    );
    expect(bookingSummaryLine([], 'past', NOW)).toBe('新しい順');
  });
  it('お得の合計金額はキャンセル・期限切れを除く', () => {
    const rows = [
      makeRow(),
      makeRow({ id: 'b2', amount: 600, status: 'completed' }),
      makeRow({ id: 'b3', amount: 5000, status: 'cancelled' }),
      makeRow({ id: 'b4', amount: 5000, expiresAt: jstDate('2026-10-05 08:00') }),
      makeRow({ id: 'b5', kind: 'event', amount: 3000 }),
    ];
    expect(productTotal(rows, NOW)).toBe(1800);
    expect(bookingSummaryLine(rows, 'all', NOW)).toBe(
      '受け取り 4件（合計 1,800円）・イベント 2名　時間の早い順',
    );
    expect(listingBookingTotalLine(rows, NOW)).toBe('予約 2件　合計 1,800円');
    expect(listingBookingTotalLine([makeRow({ status: 'cancelled' })], NOW)).toBeNull();
  });
  it('並び：開始の早い順、過去は新しい順', () => {
    const a = makeRow({ id: 'a', number: '0002', scheduleStart: jstDate('2026-10-05 14:00') });
    const b = makeRow({ id: 'b', number: '0001', scheduleStart: jstDate('2026-10-05 11:30') });
    expect(sortBookings([a, b], 'today').map((r) => r.id)).toEqual(['b', 'a']);
    expect(sortBookings([a, b], 'past').map((r) => r.id)).toEqual(['a', 'b']);
  });
});

describe('掲載の表示', () => {
  it('予約数／上限', () => {
    expect(listingMetric(makeStaffListing())).toBe('8 / 20食');
    expect(
      listingMetric(makeStaffListing({ kind: 'event', quantity: 8, reservedQuantity: 2 })),
    ).toBe('2 / 8名');
    expect(listingMetric(makeStaffListing({ kind: 'job', quantity: 2, reservedQuantity: 3 }))).toBe(
      '3件 / 2名',
    );
    expect(listingMetric(makeStaffListing({ kind: 'notice' }))).toBeNull();
  });
  it('一覧の 2 行目', () => {
    expect(listingScheduleLine(makeStaffListing())).toBe('受け取り 10/5 11:30〜13:30');
    expect(
      listingScheduleLine(
        makeStaffListing({
          kind: 'event',
          start: jstDate('2026-10-05 14:00'),
          end: jstDate('2026-10-05 15:30'),
        }),
      ),
    ).toBe('10/5 14:00〜15:30');
    expect(
      listingScheduleLine(
        makeStaffListing({
          kind: 'notice',
          publishStart: jstDate('2026-10-03 09:00'),
          publishEnd: jstDate('2026-10-31 23:59'),
        }),
      ),
    ).toBe('10/3〜10/31 掲載');
    expect(listingScheduleLine(makeStaffListing({ start: null }))).toBe('日時未設定');
  });
  it('アバターの 1 文字', () => {
    expect(initialOf('山田 太郎')).toBe('山');
    expect(initialOf('')).toBe('？');
  });
});
