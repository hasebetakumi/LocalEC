import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { bookingKeys } from '@/features/bookings/hooks';
import { listingKeys } from '@/features/listings/hooks';

import {
  fetchListingBookings,
  fetchStaffBooking,
  fetchStaffListing,
  fetchStore,
  fetchStoreBookings,
  fetchStoreListings,
  fetchStoreSummaries,
  searchBookings,
} from './api';
import type { Period } from './types';

export const staffKeys = {
  all: ['staff'] as const,
  summaries: ['staff', 'summaries'] as const,
  store: (id: string) => ['staff', 'store', id] as const,
  listings: (storeId: string) => ['staff', 'listings', storeId] as const,
  listing: (id: string) => ['staff', 'listing', id] as const,
  listingBookings: (id: string) => ['staff', 'listing-bookings', id] as const,
  storeBookings: (storeId: string, period: Period) =>
    ['staff', 'bookings', storeId, period] as const,
  booking: (id: string) => ['staff', 'booking', id] as const,
  search: (prefix: string, storeId?: string, listingId?: string) =>
    ['staff', 'search', prefix, storeId ?? '', listingId ?? ''] as const,
};

export function useStoreSummaries() {
  return useQuery({ queryKey: staffKeys.summaries, queryFn: fetchStoreSummaries });
}

export function useStore(storeId: string | undefined) {
  return useQuery({
    queryKey: staffKeys.store(storeId ?? ''),
    queryFn: () => fetchStore(storeId ?? ''),
    enabled: !!storeId,
  });
}

export function useStoreListings(storeId: string | undefined) {
  return useQuery({
    queryKey: staffKeys.listings(storeId ?? ''),
    queryFn: () => fetchStoreListings(storeId ?? ''),
    enabled: !!storeId,
  });
}

export function useStaffListing(id: string | undefined) {
  return useQuery({
    queryKey: staffKeys.listing(id ?? ''),
    queryFn: () => fetchStaffListing(id ?? ''),
    enabled: !!id,
    staleTime: 0,
  });
}

export function useListingBookings(id: string | undefined) {
  return useQuery({
    queryKey: staffKeys.listingBookings(id ?? ''),
    queryFn: () => fetchListingBookings(id ?? ''),
    enabled: !!id,
  });
}

export function useStoreBookings(storeId: string | undefined, period: Period, now: Date) {
  return useQuery({
    queryKey: staffKeys.storeBookings(storeId ?? '', period),
    queryFn: () => fetchStoreBookings(storeId ?? '', period, now),
    enabled: !!storeId,
  });
}

export function useStaffBooking(id: string | undefined) {
  return useQuery({
    queryKey: staffKeys.booking(id ?? ''),
    queryFn: () => fetchStaffBooking(id ?? ''),
    enabled: !!id,
    staleTime: 0,
  });
}

/** 番号の前方一致（1 桁以上で検索する） */
export function useBookingSearch(
  prefix: string,
  scope: { storeId?: string; listingId?: string } = {},
) {
  return useQuery({
    queryKey: staffKeys.search(prefix, scope.storeId, scope.listingId),
    queryFn: () => searchBookings(prefix, scope),
    enabled: prefix.length > 0,
  });
}

/** 運営側の更新。成功・失敗にかかわらず、運営側と利用者側のキャッシュを取り直す */
export function useStaffMutation<TArgs, TResult>(fn: (args: TArgs) => Promise<TResult>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: staffKeys.all });
      void queryClient.invalidateQueries({ queryKey: listingKeys.all });
      void queryClient.invalidateQueries({ queryKey: bookingKeys.all });
    },
  });
}
