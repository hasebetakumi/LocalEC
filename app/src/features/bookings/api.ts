import { toStore } from '@/features/listings/api';
import { supabase } from '@/lib/supabase';

import type { BookingKind, MyBooking } from './types';

/** create_booking・cancel_booking・delete_my_account が返すエラーコード（DB の raise exception の message） */
export const BOOKING_ERROR_CODES = [
  'not_authenticated',
  'profile_incomplete',
  'invalid_quantity',
  'not_found',
  'not_published',
  'deadline_passed',
  'sold_out',
  'over_max_per_booking',
  'no_number_available',
  'not_cancellable',
  'cancel_not_allowed',
  'cancel_deadline_passed',
  'has_active_bookings',
] as const;
export type BookingErrorCode = (typeof BOOKING_ERROR_CODES)[number] | 'unknown';

export class BookingError extends Error {
  constructor(readonly code: BookingErrorCode) {
    super(code);
    this.name = 'BookingError';
  }
}

export function toBookingErrorCode(message: string | undefined): BookingErrorCode {
  return BOOKING_ERROR_CODES.find((c) => c === message) ?? 'unknown';
}

export type CreatedBooking = { id: string; number: string };

/** 予約・申し込み・応募を確定する（残数・締切の最終判定はサーバー側） */
export async function createBooking(listingId: string, quantity: number): Promise<CreatedBooking> {
  const { data, error } = await supabase.rpc('create_booking', {
    p_listing_id: listingId,
    p_quantity: quantity,
  });
  if (error) throw new BookingError(toBookingErrorCode(error.message));
  return { id: data.id, number: data.number };
}

/** 利用者のキャンセル（U-21） */
export async function cancelBooking(bookingId: string): Promise<void> {
  const { error } = await supabase.rpc('cancel_booking', { p_booking_id: bookingId });
  if (error) throw new BookingError(toBookingErrorCode(error.message));
}

const BOOKING_SELECT = `
  id, number, kind, quantity, amount, status, created_at, completed_at, cancelled_at, expired_at,
  listing:listings(id, title, unit, pickup_start, pickup_end, event_start, event_end, work_start, work_end,
    work_text, place_name, place_address, cancel_deadline, pay_text),
  store:stores(id, name, address, phone, payment_methods)
`;

type Row = {
  id: string;
  number: string;
  kind: string;
  quantity: number;
  amount: number | null;
  status: MyBooking['status'];
  created_at: string;
  completed_at: string | null;
  cancelled_at: string | null;
  expired_at: string | null;
  listing: {
    id: string;
    title: string;
    unit: string;
    pickup_start: string | null;
    pickup_end: string | null;
    event_start: string | null;
    event_end: string | null;
    work_start: string | null;
    work_end: string | null;
    work_text: string | null;
    place_name: string | null;
    place_address: string | null;
    cancel_deadline: string | null;
    pay_text: string | null;
  } | null;
  store: Parameters<typeof toStore>[0] | null;
};

const d = (v: string | null) => (v ? new Date(v) : null);

function isBookingKind(v: string): v is BookingKind {
  return v === 'product' || v === 'event' || v === 'job';
}

export function toMyBooking(row: Row): MyBooking {
  const l = row.listing;
  if (!l || !row.store || !isBookingKind(row.kind))
    throw new Error(`booking ${row.id} を表示できません`);
  const [start, end] =
    row.kind === 'product'
      ? [l.pickup_start, l.pickup_end]
      : row.kind === 'event'
        ? [l.event_start, l.event_end]
        : [l.work_start, l.work_end];
  if (!start || !end) throw new Error(`booking ${row.id} の日時がありません`);
  return {
    id: row.id,
    number: row.number,
    kind: row.kind,
    quantity: row.quantity,
    amount: row.amount,
    status: row.status,
    createdAt: new Date(row.created_at),
    completedAt: d(row.completed_at),
    cancelledAt: d(row.cancelled_at),
    expiredAt: d(row.expired_at),
    listing: {
      id: l.id,
      title: l.title,
      unit: l.unit,
      start: new Date(start),
      end: new Date(end),
      workText: l.work_text,
      placeName: l.place_name,
      placeAddress: l.place_address,
      cancelDeadline: d(l.cancel_deadline),
      payText: l.pay_text,
    },
    store: toStore(row.store),
  };
}

/**
 * 自分の予約（U-22・U-02）。スタッフは RLS で店舗の予約も見えるため、必ず自分の user_id で絞る
 */
export async function fetchMyBookings(userId: string): Promise<MyBooking[]> {
  const { data, error } = await supabase
    .from('bookings')
    .select(BOOKING_SELECT)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(500);
  if (error) throw error;
  return (data as Row[]).map(toMyBooking);
}

/** 予約 1 件（予約詳細・完了画面）。RLS で自分の予約（スタッフは自店舗の予約）だけ読める */
export async function fetchBooking(id: string): Promise<MyBooking | null> {
  const { data, error } = await supabase
    .from('bookings')
    .select(BOOKING_SELECT)
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data ? toMyBooking(data as Row) : null;
}

/** アカウント削除（U-02） */
export async function deleteMyAccount(): Promise<void> {
  const { error } = await supabase.rpc('delete_my_account');
  if (error) throw new BookingError(toBookingErrorCode(error.message));
}
