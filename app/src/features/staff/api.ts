import type { BookingKind } from '@/features/bookings/types';
import { isProductCategory, type PaymentMethod } from '@/features/listings/master';
import type { DisplayStatus } from '@/features/listings/types';
import type { Database } from '@/lib/database.types';
import { startOfJstDay, startOfNextJstDay } from '@/lib/format';
import { supabase } from '@/lib/supabase';

import type { Period, StaffBookingRow, StaffListing, StoreInfo, StoreSummary } from './types';

type ListingRow = Database['public']['Views']['listing_availability']['Row'];
type BookingViewRow = Database['public']['Views']['staff_booking_rows']['Row'];
export type ListingInsert = Database['public']['Tables']['listings']['Insert'];
export type ListingUpdate = Database['public']['Tables']['listings']['Update'];

const d = (v: string | null) => (v ? new Date(v) : null);

/** 運営側のエラー（RPC の raise exception の message） */
export const STAFF_ERROR_CODES = [
  'not_authenticated',
  'not_staff',
  'not_found',
  'not_completable',
  'not_revertable',
  'not_cancellable',
  'not_endable',
  'listing_ended',
  'locked_fields',
  'quantity_increase_not_allowed',
  'quantity_below_reserved',
] as const;
export type StaffErrorCode = (typeof STAFF_ERROR_CODES)[number] | 'unknown';

export class StaffError extends Error {
  constructor(readonly code: StaffErrorCode) {
    super(code);
    this.name = 'StaffError';
  }
}

function toStaffError(message: string | undefined): StaffError {
  return new StaffError(STAFF_ERROR_CODES.find((c) => c === message) ?? 'unknown');
}

// ---------------------------------------------------------------- 店舗

/** A-01：所属店舗と件数 */
export async function fetchStoreSummaries(): Promise<StoreSummary[]> {
  const { data, error } = await supabase.rpc('staff_store_summaries');
  if (error) throw error;
  return data.map((r) => ({
    id: r.store_id,
    name: r.name,
    address: r.address,
    phone: r.phone,
    hoursText: r.hours_text,
    paymentMethods: r.payment_methods,
    publishedCount: r.published_count,
    scheduledCount: r.scheduled_count,
    draftCount: r.draft_count,
    todayCount: r.today_count,
  }));
}

export async function fetchStore(storeId: string): Promise<StoreInfo | null> {
  const { data, error } = await supabase
    .from('stores')
    .select('id, name, address, phone, hours_text, payment_methods')
    .eq('id', storeId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    id: data.id,
    name: data.name,
    address: data.address,
    phone: data.phone,
    hoursText: data.hours_text,
    paymentMethods: data.payment_methods,
  };
}

export type StoreInput = {
  name: string;
  address: string;
  phone: string;
  hoursText: string;
  paymentMethods: PaymentMethod[];
};

/** 店舗を追加し、作成者を所属にする */
export async function createStore(input: StoreInput): Promise<string> {
  const { data, error } = await supabase.rpc('create_store', {
    p_name: input.name,
    p_address: input.address,
    p_phone: input.phone,
    p_hours_text: input.hoursText,
    p_payment_methods: input.paymentMethods,
  });
  if (error) throw toStaffError(error.message);
  return data.id;
}

export async function updateStore(storeId: string, input: StoreInput): Promise<void> {
  const { error } = await supabase
    .from('stores')
    .update({
      name: input.name,
      address: input.address,
      phone: input.phone,
      hours_text: input.hoursText || null,
      payment_methods: input.paymentMethods,
    })
    .eq('id', storeId);
  if (error) throw error;
}

/** 公開中の商品の件数（A-02 で支払い方法を変えるときの確認に使う） */
export async function countPublishedProducts(storeId: string): Promise<number> {
  const { count, error } = await supabase
    .from('listing_availability')
    .select('id', { count: 'exact', head: true })
    .eq('store_id', storeId)
    .eq('kind', 'product')
    .eq('display_status', 'published');
  if (error) throw error;
  return count ?? 0;
}

// ---------------------------------------------------------------- 掲載

export function toStaffListing(r: ListingRow): StaffListing {
  const kind = r.kind ?? 'notice';
  const [start, end, deadline, quantity] =
    kind === 'product'
      ? [r.pickup_start, r.pickup_end, r.booking_deadline, r.quantity_total]
      : kind === 'event'
        ? [r.event_start, r.event_end, r.application_deadline, r.capacity]
        : kind === 'job'
          ? [r.work_start, r.work_end, r.application_deadline, r.headcount]
          : [null, null, null, null];
  return {
    id: r.id ?? '',
    storeId: r.store_id ?? '',
    kind,
    status: r.status ?? 'draft',
    displayStatus: (r.display_status ?? 'draft') as DisplayStatus,
    title: r.title ?? '',
    body: r.body,
    photoUrl: r.photo_url,
    publishStart: new Date(r.publish_start ?? 0),
    publishEnd: new Date(r.publish_end ?? 0),
    notifyOnPublish: r.notify_on_publish ?? true,
    category: isProductCategory(r.category) ? r.category : null,
    price: r.price,
    originalPrice: r.original_price,
    unit: r.unit ?? '食',
    foodLabel: r.food_label,
    pricePerPerson: r.price_per_person,
    maxPerBooking: r.max_per_booking,
    payText: r.pay_text,
    payAmount: r.pay_amount,
    payUnit: r.pay_unit,
    workText: r.work_text,
    placeName: r.place_name,
    placeAddress: r.place_address,
    conditions: r.conditions,
    cancelDeadline: d(r.cancel_deadline),
    quantity,
    start: d(start),
    end: d(end),
    deadline: d(deadline),
    reservedQuantity: r.reserved_quantity ?? 0,
  };
}

/** A-11：この店舗の掲載（下書き・公開予定・終了も含む） */
export async function fetchStoreListings(storeId: string): Promise<StaffListing[]> {
  const { data, error } = await supabase
    .from('listing_availability')
    .select('*')
    .eq('store_id', storeId)
    .order('publish_start', { ascending: false })
    .limit(1000);
  if (error) throw error;
  return data.map(toStaffListing);
}

export async function fetchStaffListing(id: string): Promise<StaffListing | null> {
  const { data, error } = await supabase
    .from('listing_availability')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data ? toStaffListing(data) : null;
}

export async function insertListing(row: ListingInsert): Promise<string> {
  const { data, error } = await supabase.from('listings').insert(row).select('id').single();
  if (error) throw toStaffError(error.message);
  return data.id;
}

export async function updateListing(id: string, row: ListingUpdate): Promise<void> {
  const { error } = await supabase.from('listings').update(row).eq('id', id);
  if (error) throw toStaffError(error.message);
}

/** 掲載を終了する（新規の予約だけ止まる） */
export async function endListing(id: string): Promise<void> {
  const { error } = await supabase.rpc('end_listing', { p_listing_id: id });
  if (error) throw toStaffError(error.message);
}

/** 予約が 1 件もない掲載だけ削除できる（予約があれば外部キーで拒否される） */
export async function deleteListing(id: string): Promise<void> {
  const { error } = await supabase.from('listings').delete().eq('id', id);
  if (error) throw toStaffError(error.message);
}

// ---------------------------------------------------------------- 予約

function isBookingKind(v: string | null): v is BookingKind {
  return v === 'product' || v === 'event' || v === 'job';
}

export function toStaffBookingRow(r: BookingViewRow): StaffBookingRow {
  return {
    id: r.id ?? '',
    number: r.number ?? '',
    listingId: r.listing_id ?? '',
    storeId: r.store_id ?? '',
    kind: isBookingKind(r.kind) ? r.kind : 'product',
    quantity: r.quantity ?? 0,
    amount: r.amount,
    status: r.status ?? 'reserved',
    cancelledBy: r.cancelled_by,
    completedAt: d(r.completed_at),
    cancelledAt: d(r.cancelled_at),
    expiredAt: d(r.expired_at),
    createdAt: new Date(r.created_at ?? 0),
    listingTitle: r.listing_title ?? '',
    listingUnit: r.listing_unit ?? '',
    listingPayText: r.listing_pay_text,
    listingPlaceName: r.listing_place_name,
    listingWorkText: r.listing_work_text,
    scheduleStart: new Date(r.schedule_start ?? 0),
    scheduleEnd: new Date(r.schedule_end ?? 0),
    expiresAt: new Date(r.expires_at ?? 0),
    storeName: r.store_name ?? '',
    storePaymentMethods: r.store_payment_methods ?? [],
    customerName: r.customer_name,
    customerPhone: r.customer_phone,
    customerDeleted: r.customer_deleted ?? false,
  };
}

/** A-20：この店舗の予約。期間は SQL で絞る（境界は日本時間の今日 0:00・明日 0:00） */
export async function fetchStoreBookings(
  storeId: string,
  period: Period,
  now: Date,
): Promise<StaffBookingRow[]> {
  const today = startOfJstDay(now).toISOString();
  const tomorrow = startOfNextJstDay(now).toISOString();
  let q = supabase.from('staff_booking_rows').select('*').eq('store_id', storeId);
  if (period === 'today') q = q.lt('schedule_start', tomorrow).gte('schedule_end', today);
  if (period === 'future') q = q.gte('schedule_start', tomorrow);
  if (period === 'past') q = q.lt('schedule_end', today);
  const { data, error } = await q
    .order('schedule_start', { ascending: period !== 'past' })
    .limit(500);
  if (error) throw error;
  return data.map(toStaffBookingRow);
}

/** 番号の前方一致。storeId がなければ所属店舗すべて（A-01）、listingId があればその掲載だけ（A-11 詳細） */
export async function searchBookings(
  prefix: string,
  scope: { storeId?: string; listingId?: string } = {},
): Promise<StaffBookingRow[]> {
  let q = supabase.from('staff_booking_rows').select('*').like('number', `${prefix}%`);
  if (scope.storeId) q = q.eq('store_id', scope.storeId);
  if (scope.listingId) q = q.eq('listing_id', scope.listingId);
  const { data, error } = await q.order('created_at', { ascending: false }).limit(50);
  if (error) throw error;
  return data.map(toStaffBookingRow);
}

/** A-11 詳細：この掲載の予約（新しい順） */
export async function fetchListingBookings(listingId: string): Promise<StaffBookingRow[]> {
  const { data, error } = await supabase
    .from('staff_booking_rows')
    .select('*')
    .eq('listing_id', listingId)
    .order('created_at', { ascending: false })
    .limit(1000);
  if (error) throw error;
  return data.map(toStaffBookingRow);
}

export async function fetchStaffBooking(id: string): Promise<StaffBookingRow | null> {
  const { data, error } = await supabase
    .from('staff_booking_rows')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data ? toStaffBookingRow(data) : null;
}

async function bookingRpc(
  fn: 'complete_booking' | 'revert_booking' | 'staff_cancel_booking',
  id: string,
): Promise<void> {
  const { error } = await supabase.rpc(fn, { p_booking_id: id });
  if (error) throw toStaffError(error.message);
}

/** A-21：受け取り済み（参加済み・勤務済み）にする。期限切れからもできる */
export const completeBooking = (id: string) => bookingRpc('complete_booking', id);
/** A-21：未受け取りに戻す（期限を過ぎていれば期限切れに戻る） */
export const revertBooking = (id: string) => bookingRpc('revert_booking', id);
/** A-21：店舗によるキャンセル（利用者への通知を記録する） */
export const staffCancelBooking = (id: string) => bookingRpc('staff_cancel_booking', id);
