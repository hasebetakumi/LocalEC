import { jstDate, makeProduct, NOW, store2 } from '@/test/fixtures';

import {
  availability,
  badge,
  discountLabel,
  discountPercent,
  filterProducts,
  groupHome,
  remainLabel,
} from './derive';

describe('availability', () => {
  it('受付中', () => {
    expect(availability(makeProduct(), NOW)).toBe('open');
  });
  it('残り 0 なら売り切れ', () => {
    expect(availability(makeProduct({ remaining: 0 }), NOW)).toBe('sold_out');
  });
  it('締切ちょうどは締切後', () => {
    expect(availability(makeProduct(), jstDate('2026-10-05 10:00'))).toBe('deadline_passed');
  });
  it('締切 1 分前は受付中', () => {
    expect(availability(makeProduct(), jstDate('2026-10-05 09:59'))).toBe('open');
  });
  it('締切後かつ売り切れは締切後を優先', () => {
    expect(availability(makeProduct({ remaining: 0 }), jstDate('2026-10-05 11:00'))).toBe(
      'deadline_passed',
    );
  });
  it('公開終了', () => {
    expect(availability(makeProduct({ displayStatus: 'ended' }), NOW)).toBe('ended');
  });
});

describe('割引', () => {
  it('割引率', () => {
    expect(discountPercent(600, 800)).toBe(25);
    expect(discountPercent(900, 1800)).toBe(50);
    expect(discountPercent(650, 750)).toBe(13);
    expect(discountPercent(600, null)).toBeNull();
  });
  it('50% 以上は半額', () => {
    expect(discountLabel(makeProduct({ price: 900, originalPrice: 1800 }))).toBe('半額');
    expect(discountLabel(makeProduct({ price: 400, originalPrice: 1000 }))).toBe('半額');
    expect(discountLabel(makeProduct({ price: 600, originalPrice: 800 }))).toBe('25%OFF');
  });
});

describe('badge', () => {
  const notToday = {
    pickupStart: jstDate('2026-10-06 11:30'),
    pickupEnd: jstDate('2026-10-06 13:30'),
  };

  it('割引が最優先', () => {
    expect(badge(makeProduct({ remaining: 2 }), NOW)).toEqual({ label: '25%OFF', tone: 'off' });
  });
  it('割引なしで残り 3 以下なら残りわずか', () => {
    expect(badge(makeProduct({ originalPrice: null, remaining: 3 }), NOW)).toEqual({
      label: '残りわずか',
      tone: 'few',
    });
  });
  it('残り 4 は残りわずかにならない', () => {
    expect(badge(makeProduct({ originalPrice: null, remaining: 4, ...notToday }), NOW)).toBeNull();
  });
  it('受け取りが今日だけなら本日限定', () => {
    expect(badge(makeProduct({ originalPrice: null }), NOW)).toEqual({
      label: '本日限定',
      tone: 'today',
    });
  });
  it('詳細では割引を外す', () => {
    expect(badge(makeProduct(), NOW, { excludeDiscount: true })).toEqual({
      label: '本日限定',
      tone: 'today',
    });
  });
  it('公開から 72 時間以内なら新着', () => {
    const p = makeProduct({
      originalPrice: null,
      ...notToday,
      publishStart: jstDate('2026-10-02 09:00'),
    });
    expect(badge(p, NOW)).toEqual({ label: '新着', tone: 'new' });
  });
  it('72 時間を過ぎたら新着ではない', () => {
    const p = makeProduct({
      originalPrice: null,
      ...notToday,
      publishStart: jstDate('2026-10-02 08:59'),
    });
    expect(badge(p, NOW)).toBeNull();
  });
  it('新着の帯では新着を優先', () => {
    const p = makeProduct({ publishStart: jstDate('2026-10-05 08:00') });
    expect(badge(p, NOW, { prefer: 'new' })).toEqual({ label: '新着', tone: 'new' });
  });
  it('売り切れでは灰色', () => {
    expect(badge(makeProduct({ remaining: 0 }), NOW)).toEqual({ label: '25%OFF', tone: 'gray' });
  });
});

describe('remainLabel', () => {
  it('単位つき', () => {
    expect(remainLabel(makeProduct({ remaining: 12 }))).toBe('残り12食');
    expect(remainLabel(makeProduct({ remaining: -1, unit: '本' }))).toBe('残り0本');
  });
});

describe('groupHome', () => {
  const products = [
    makeProduct({ id: 'bento-late', bookingDeadline: jstDate('2026-10-05 20:00') }),
    makeProduct({ id: 'bento-early', bookingDeadline: jstDate('2026-10-05 10:00') }),
    makeProduct({
      id: 'rice-new',
      category: 'rice',
      publishStart: jstDate('2026-10-05 08:00'),
      bookingDeadline: jstDate('2026-10-08 17:00'),
    }),
    makeProduct({ id: 'sold-out', category: 'sweets', remaining: 0 }),
    makeProduct({ id: 'ended', category: 'laundry', displayStatus: 'ended' }),
  ];
  const groups = groupHome(products, NOW);

  it('もうすぐ終了は 24 時間以内・受付中だけを締切順に', () => {
    expect(groups.soon.map((p) => p.id)).toEqual(['bento-early', 'bento-late']);
  });
  it('新着は公開日の新しい順', () => {
    expect(groups.fresh.map((p) => p.id)).toEqual(['rice-new']);
  });
  it('カテゴリ別はマスタ順で、掲載のないカテゴリと公開終了を含まない', () => {
    expect(groups.byCategory.map((g) => g.category)).toEqual(['bento', 'rice', 'sweets']);
  });
});

describe('filterProducts', () => {
  const products = [
    makeProduct({ id: 'a', publishStart: jstDate('2026-10-01 00:00') }),
    makeProduct({ id: 'b', publishStart: jstDate('2026-10-03 00:00'), store: store2 }),
    makeProduct({ id: 'c', category: 'rice', publishStart: jstDate('2026-10-02 00:00') }),
  ];

  it('条件なしは新着順', () => {
    expect(filterProducts(products, {}, NOW).map((p) => p.id)).toEqual(['b', 'c', 'a']);
  });
  it('カテゴリで絞る', () => {
    expect(filterProducts(products, { category: 'rice' }, NOW).map((p) => p.id)).toEqual(['c']);
  });
  it('店舗で絞る', () => {
    expect(filterProducts(products, { storeId: 'store-2' }, NOW).map((p) => p.id)).toEqual(['b']);
  });
});
