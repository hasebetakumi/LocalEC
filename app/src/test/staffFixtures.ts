import type { StaffBookingRow, StaffListing, StoreInfo } from '@/features/staff/types';

import { jstDate } from './fixtures';

export const staffStore: StoreInfo = {
  id: 'store-1',
  name: 'カフェ あけぼの 駅前店',
  address: '埼玉県久喜市栗橋東1-2-8',
  phone: '0480000001',
  hoursText: null,
  paymentMethods: ['cash', 'paypay'],
};

export function makeRow(o: Partial<StaffBookingRow> = {}): StaffBookingRow {
  return {
    id: 'b-1',
    number: '0427',
    listingId: 'l-1',
    storeId: 'store-1',
    kind: 'product',
    quantity: 2,
    amount: 1200,
    status: 'reserved',
    cancelledBy: null,
    completedAt: null,
    cancelledAt: null,
    expiredAt: null,
    createdAt: jstDate('2026-10-04 20:12'),
    listingTitle: '日替わり弁当',
    listingUnit: '食',
    listingPayText: null,
    listingPlaceName: null,
    listingWorkText: null,
    scheduleStart: jstDate('2026-10-05 11:30'),
    scheduleEnd: jstDate('2026-10-05 13:30'),
    expiresAt: jstDate('2026-10-05 13:30'),
    storeName: 'カフェ あけぼの 駅前店',
    storePaymentMethods: ['cash', 'paypay'],
    customerName: '栗橋 花子',
    customerPhone: '09012345678',
    customerDeleted: false,
    ...o,
  };
}

export function makeStaffListing(o: Partial<StaffListing> = {}): StaffListing {
  return {
    id: 'l-1',
    storeId: 'store-1',
    kind: 'product',
    status: 'published',
    displayStatus: 'published',
    title: '日替わり弁当（10/5）',
    body: null,
    photoUrl: null,
    publishStart: jstDate('2026-10-04 18:00'),
    publishEnd: jstDate('2026-10-05 13:30'),
    notifyOnPublish: true,
    category: 'bento',
    price: 600,
    originalPrice: 800,
    unit: '食',
    foodLabel: '店舗にお問い合わせください',
    pricePerPerson: null,
    maxPerBooking: null,
    payText: null,
    payAmount: null,
    payUnit: null,
    workText: null,
    placeName: null,
    placeAddress: null,
    conditions: null,
    cancelDeadline: jstDate('2026-10-05 10:00'),
    quantity: 20,
    start: jstDate('2026-10-05 11:30'),
    end: jstDate('2026-10-05 13:30'),
    deadline: jstDate('2026-10-05 10:00'),
    reservedQuantity: 8,
    ...o,
  };
}
