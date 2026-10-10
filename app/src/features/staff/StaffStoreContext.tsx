import { createContext, useContext } from 'react';

import type { StoreSummary } from './types';

/** 店舗モードの店舗（[storeId]/_layout が所属を確認してから渡す） */
export const StaffStoreContext = createContext<StoreSummary | null>(null);

export function useStaffStore(): StoreSummary {
  const store = useContext(StaffStoreContext);
  if (!store) throw new Error('useStaffStore は店舗モードの中で使う');
  return store;
}
