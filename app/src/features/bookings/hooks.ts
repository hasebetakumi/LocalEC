import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { listingKeys } from '@/features/listings/hooks';

import { cancelBooking, createBooking, fetchBooking, fetchMyBookings } from './api';

export const bookingKeys = {
  all: ['bookings'] as const,
  mine: (userId: string) => ['bookings', 'mine', userId] as const,
  one: (id: string) => ['bookings', 'one', id] as const,
};

export function useCreateBooking(listingId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (quantity: number) => createBooking(listingId, quantity),
    // 成功・失敗どちらでも残数が変わっている可能性があるので取り直す
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: listingKeys.listing(listingId) });
      void queryClient.invalidateQueries({ queryKey: listingKeys.all });
      void queryClient.invalidateQueries({ queryKey: bookingKeys.all });
    },
  });
}

export function useCancelBooking(bookingId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => cancelBooking(bookingId),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: bookingKeys.all });
      void queryClient.invalidateQueries({ queryKey: listingKeys.all });
    },
  });
}

export function useMyBookings(userId: string | undefined) {
  return useQuery({
    queryKey: bookingKeys.mine(userId ?? ''),
    queryFn: () => fetchMyBookings(userId ?? ''),
    enabled: !!userId,
  });
}

export function useBooking(id: string | undefined) {
  return useQuery({
    queryKey: bookingKeys.one(id ?? ''),
    queryFn: () => fetchBooking(id ?? ''),
    enabled: !!id,
  });
}
