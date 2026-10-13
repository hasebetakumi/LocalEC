import type { Product, Store } from '@/features/listings/types';

export const store1: Store = {
  id: 'store-1',
  name: 'カフェ あけぼの 駅前店',
  address: '埼玉県久喜市栗橋東1-2-8',
  phone: '0480000001',
  paymentMethods: ['cash', 'paypay'],
};

export const store2: Store = {
  id: 'store-2',
  name: 'あけぼの農園 直売所',
  address: '埼玉県久喜市栗橋北3-10',
  phone: '0480000002',
  paymentMethods: ['cash'],
};

/** 日本時間の日時を Date にする（例：jstDate('2026-10-05 11:30')） */
export function jstDate(text: string): Date {
  return new Date(`${text.replace(' ', 'T')}:00+09:00`);
}

/** 2026-10-05(月) 9:00 JST */
export const NOW = jstDate('2026-10-05 09:00');

export function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    kind: 'product',
    id: 'p-1',
    title: '日替わり弁当',
    body: '今日のメインは鶏の照り焼き。',
    photoUrl: null,
    category: 'bento',
    price: 600,
    originalPrice: 800,
    quantityTotal: 20,
    unit: '食',
    remaining: 12,
    pickupStart: jstDate('2026-10-05 11:30'),
    pickupEnd: jstDate('2026-10-05 13:30'),
    bookingDeadline: jstDate('2026-10-05 10:00'),
    cancelDeadline: jstDate('2026-10-05 10:00'),
    foodLabel: '店舗にお問い合わせください',
    publishStart: jstDate('2026-10-01 00:00'),
    publishEnd: jstDate('2026-10-06 00:00'),
    displayStatus: 'published',
    store: store1,
    ...overrides,
  };
}
