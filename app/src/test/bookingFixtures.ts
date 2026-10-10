import type { MyBooking } from '@/features/bookings/types';

import { store1 } from './fixtures';

const HOUR = 60 * 60 * 1000;

/** 実行時刻を基準にした予約（画面テストは本物の時計で動くため） */
export function liveBooking(
  o: Omit<Partial<MyBooking>, 'listing'> & { listing?: Partial<MyBooking['listing']> } = {},
): MyBooking {
  const now = Date.now();
  const { listing, ...rest } = o;
  return {
    id: 'b-1',
    number: '0427',
    kind: 'product',
    quantity: 2,
    amount: 1200,
    status: 'reserved',
    createdAt: new Date(now - HOUR),
    completedAt: null,
    cancelledAt: null,
    expiredAt: null,
    store: store1,
    ...rest,
    listing: {
      id: 'l-1',
      title: '日替わり弁当',
      unit: '食',
      start: new Date(now + 2 * HOUR),
      end: new Date(now + 4 * HOUR),
      workText: null,
      placeName: null,
      placeAddress: null,
      cancelDeadline: new Date(now + HOUR),
      payText: null,
      ...listing,
    },
  };
}
