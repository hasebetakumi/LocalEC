import { useQuery } from '@tanstack/react-query';

import { fetchEventsAndJobs, fetchListing, fetchNotices, fetchProducts, fetchStores } from './api';

export const listingKeys = {
  all: ['listings'] as const,
  products: ['listings', 'product'] as const,
  eventsAndJobs: ['listings', 'event-job'] as const,
  notices: ['listings', 'notice'] as const,
  listing: (id: string) => ['listings', 'one', id] as const,
  stores: ['stores'] as const,
};

export function useProducts() {
  return useQuery({ queryKey: listingKeys.products, queryFn: fetchProducts });
}

export function useEventsAndJobs() {
  return useQuery({ queryKey: listingKeys.eventsAndJobs, queryFn: fetchEventsAndJobs });
}

export function useNotices() {
  return useQuery({ queryKey: listingKeys.notices, queryFn: fetchNotices });
}

/** 詳細・申し込み画面は残数が変わるので、開くたびに取り直す */
export function useListing(id: string | undefined) {
  return useQuery({
    queryKey: listingKeys.listing(id ?? ''),
    queryFn: () => fetchListing(id ?? ''),
    enabled: !!id,
    staleTime: 0,
  });
}

export function useStores() {
  return useQuery({ queryKey: listingKeys.stores, queryFn: fetchStores, staleTime: 5 * 60_000 });
}
