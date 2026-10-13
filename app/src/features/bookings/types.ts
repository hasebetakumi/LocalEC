import type { Store } from '@/features/listings/types';
import type { Database } from '@/lib/database.types';

export type BookingKind = 'product' | 'event' | 'job';
export type BookingStatus = Database['public']['Enums']['booking_status'];

/** 予約に紐づく掲載のうち、利用者の画面で使う項目。start/end は商品＝受け取り、イベント＝開催、求人＝勤務 */
export type BookingListing = {
  id: string;
  title: string;
  unit: string;
  start: Date;
  end: Date;
  workText: string | null;
  placeName: string | null;
  placeAddress: string | null;
  cancelDeadline: Date | null;
  payText: string | null;
};

export type MyBooking = {
  id: string;
  number: string;
  kind: BookingKind;
  quantity: number;
  amount: number | null;
  status: BookingStatus;
  createdAt: Date;
  completedAt: Date | null;
  cancelledAt: Date | null;
  expiredAt: Date | null;
  listing: BookingListing;
  store: Store;
};
