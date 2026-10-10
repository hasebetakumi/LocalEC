import { jstDate, NOW, store1, store2 } from '@/test/fixtures';

import {
  activeRowText,
  cancelState,
  effectiveStatus,
  expiresAt,
  groupActive,
  historyLine,
  historyList,
  statusPill,
  titleWithQuantity,
} from './derive';
import type { MyBooking } from './types';

function makeBooking(
  o: Omit<Partial<MyBooking>, 'listing'> & { listing?: Partial<MyBooking['listing']> } = {},
): MyBooking {
  const { listing, ...rest } = o;
  return {
    id: 'b-1',
    number: '0427',
    kind: 'product',
    quantity: 2,
    amount: 1200,
    status: 'reserved',
    createdAt: jstDate('2026-10-04 20:00'),
    completedAt: null,
    cancelledAt: null,
    expiredAt: null,
    store: store1,
    ...rest,
    listing: {
      id: 'l-1',
      title: '日替わり弁当',
      unit: '食',
      start: jstDate('2026-10-05 11:30'),
      end: jstDate('2026-10-05 13:30'),
      workText: null,
      placeName: null,
      placeAddress: null,
      cancelDeadline: jstDate('2026-10-05 10:00'),
      payText: null,
      ...listing,
    },
  };
}

const event = makeBooking({
  id: 'e',
  number: '0102',
  kind: 'event',
  listing: {
    title: '親子でさつまいも掘り体験',
    start: jstDate('2026-10-18 10:00'),
    end: jstDate('2026-10-18 12:00'),
    placeName: 'あけぼの農園',
  },
});
const job = makeBooking({
  id: 'j',
  number: '0057',
  kind: 'job',
  quantity: 1,
  amount: null,
  store: store2,
  listing: {
    title: '稲の脱穀作業（日払い）',
    start: jstDate('2026-10-10 08:00'),
    end: jstDate('2026-10-10 15:00'),
  },
});
const rice = makeBooking({
  id: 'r',
  number: '0431',
  store: store2,
  listing: {
    title: '新米コシヒカリ 5kg',
    unit: '袋',
    start: jstDate('2026-10-05 09:00'),
    end: jstDate('2026-10-12 17:00'),
  },
});

describe('期限切れ', () => {
  it('商品は受け取り終了で期限切れ', () => {
    const b = makeBooking();
    expect(expiresAt(b)).toEqual(jstDate('2026-10-05 13:30'));
    expect(effectiveStatus(b, jstDate('2026-10-05 13:29'))).toBe('reserved');
    expect(effectiveStatus(b, jstDate('2026-10-05 13:30'))).toBe('expired');
  });
  it('イベントは終了日の翌日 0:00（日本時間）', () => {
    expect(expiresAt(event)).toEqual(jstDate('2026-10-19 00:00'));
    expect(effectiveStatus(event, jstDate('2026-10-18 23:59'))).toBe('reserved');
    expect(effectiveStatus(event, jstDate('2026-10-19 00:00'))).toBe('expired');
  });
  it('イベントの期限切れは「申し込み済み」のまま灰', () => {
    expect(statusPill(event, jstDate('2026-10-19 00:00'))).toEqual({
      label: '申し込み済み',
      tone: 'gray',
    });
    expect(statusPill(makeBooking(), jstDate('2026-10-06 00:00'))).toEqual({
      label: '期限切れ',
      tone: 'gray',
    });
  });
});

describe('状態名', () => {
  it('色＝種類、キャンセルは灰', () => {
    expect(statusPill(makeBooking(), NOW)).toEqual({ label: '予約済み', tone: 'product' });
    expect(statusPill(job, NOW)).toEqual({ label: '応募済み', tone: 'job' });
    expect(statusPill(makeBooking({ status: 'completed' }), NOW)).toEqual({
      label: '受け取り済み',
      tone: 'product',
    });
    expect(statusPill(makeBooking({ status: 'cancelled' }), NOW)).toEqual({
      label: 'キャンセル',
      tone: 'gray',
    });
  });
  it('数量つきのタイトル', () => {
    expect(titleWithQuantity(makeBooking())).toBe('日替わり弁当　2食');
    expect(titleWithQuantity(event)).toBe('親子でさつまいも掘り体験　2名');
    expect(titleWithQuantity(job)).toBe('稲の脱穀作業（日払い）');
  });
});

describe('groupActive', () => {
  const groups = groupActive([event, job, rice, makeBooking()], NOW);
  it('日付で束ねる。受け取り期間中の複数日は今日に入る', () => {
    expect(groups.map((g) => g.key)).toEqual(['2026-10-05', '2026-10-10', '2026-10-18']);
    expect(groups[0].isToday).toBe(true);
    expect(groups[0].items.map((b) => b.id)).toEqual(['r', 'b-1']);
  });
  it('行の文言', () => {
    expect(activeRowText(makeBooking())).toEqual({
      time: '11:30〜13:30',
      where: 'カフェ あけぼの 駅前店',
    });
    expect(activeRowText(rice)).toEqual({ time: '〜10/12(月)', where: 'あけぼの農園 直売所' });
    expect(activeRowText(job)).toEqual({ time: '8:00〜15:00', where: '連絡をお待ちください' });
  });
});

describe('履歴', () => {
  it('3 行目の文言', () => {
    expect(
      historyLine(
        makeBooking({ status: 'completed', completedAt: jstDate('2026-09-27 12:00') }),
        NOW,
      ),
    ).toBe('9/27(日) 受け取り');
    expect(
      historyLine(
        makeBooking({ status: 'cancelled', cancelledAt: jstDate('2026-09-24 09:00') }),
        NOW,
      ),
    ).toBe('9/24(木) キャンセル');
    expect(historyLine(makeBooking({ status: 'expired' }), NOW)).toBe('受け取り期間 10/5(月) まで');
  });
  it('予約中でないものを新しい順に', () => {
    const list = historyList(
      [
        makeBooking({ id: 'old', status: 'completed', completedAt: jstDate('2026-09-10 12:00') }),
        makeBooking({ id: 'new', status: 'cancelled', cancelledAt: jstDate('2026-09-24 12:00') }),
        makeBooking({ id: 'active' }),
      ],
      NOW,
    );
    expect(list.map((b) => b.id)).toEqual(['new', 'old']);
  });
});

describe('cancelState', () => {
  it('期限内・期限後・不可・予約中でない', () => {
    expect(cancelState(makeBooking(), NOW)).toBe('can');
    expect(cancelState(makeBooking(), jstDate('2026-10-05 10:00'))).toBe('deadline_passed');
    expect(cancelState(makeBooking({ listing: { cancelDeadline: null } }), NOW)).toBe(
      'not_allowed',
    );
    expect(cancelState(makeBooking({ status: 'cancelled' }), NOW)).toBe('none');
  });
});
