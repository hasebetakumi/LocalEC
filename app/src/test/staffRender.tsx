import type { ReactElement } from 'react';

import { StaffStoreContext } from '@/features/staff/StaffStoreContext';
import type { StoreSummary } from '@/features/staff/types';

import { renderScreen } from './render';

export const summary: StoreSummary = {
  id: 'store-1',
  name: 'カフェ あけぼの 駅前店',
  address: '埼玉県久喜市栗橋東1-2-8',
  phone: '0480000001',
  hoursText: null,
  paymentMethods: ['cash', 'paypay'],
  publishedCount: 7,
  scheduledCount: 1,
  draftCount: 1,
  todayCount: 5,
};

/** 店舗モードの画面を描く（StaffStoreContext つき） */
export function renderStaff(ui: ReactElement) {
  return renderScreen(
    <StaffStoreContext.Provider value={summary}>{ui}</StaffStoreContext.Provider>,
  );
}

export const mockAuthValue = {
  session: { user: { id: 'staff-1' } } as never,
  profile: {
    id: 'staff-1',
    name: '山田 太郎',
    phone: '09011112222',
    email: 'staff@example.com',
    pending_email: null,
    notifications_enabled: true,
    is_staff: true,
  },
  isRegistered: true,
  loading: false,
  refreshProfile: jest.fn(),
  signOut: jest.fn(),
};
