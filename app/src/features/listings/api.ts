import type { Database } from '@/lib/database.types';
import { supabase } from '@/lib/supabase';

import { isProductCategory } from './master';
import type {
  DisplayStatus,
  EventListing,
  EventOrJob,
  JobListing,
  Listing,
  Notice,
  Product,
  Store,
} from './types';

type AvailabilityRow = Database['public']['Views']['listing_availability']['Row'];
type StoreRow = Pick<
  Database['public']['Tables']['stores']['Row'],
  'id' | 'name' | 'address' | 'phone' | 'payment_methods'
>;
type Row = AvailabilityRow & { store: StoreRow | null };

const STORE_COLUMNS = 'id, name, address, phone, payment_methods';
const LISTING_SELECT = `*, store:stores(${STORE_COLUMNS})`;

export function toStore(row: StoreRow): Store {
  return {
    id: row.id,
    name: row.name,
    address: row.address,
    phone: row.phone,
    paymentMethods: row.payment_methods,
  };
}

const DISPLAY_STATUSES: readonly DisplayStatus[] = ['draft', 'scheduled', 'published', 'ended'];

function date(value: string | null, column: string, id: string): Date {
  if (!value) throw new Error(`listing ${id} の ${column} がありません`);
  return new Date(value);
}

function num(value: number | null, column: string, id: string): number {
  if (value == null) throw new Error(`listing ${id} の ${column} がありません`);
  return value;
}

function str(value: string | null, column: string, id: string): string {
  if (value == null) throw new Error(`listing ${id} の ${column} がありません`);
  return value;
}

const optDate = (value: string | null) => (value ? new Date(value) : null);

function base(row: Row) {
  const id = row.id ?? '';
  if (!row.store) throw new Error(`listing ${id} の店舗がありません`);
  const status = row.display_status as DisplayStatus;
  return {
    id,
    title: row.title ?? '',
    body: row.body,
    photoUrl: row.photo_url,
    publishStart: date(row.publish_start, 'publish_start', id),
    publishEnd: date(row.publish_end, 'publish_end', id),
    displayStatus: DISPLAY_STATUSES.includes(status) ? status : 'ended',
    store: toStore(row.store),
  };
}

/** ビューの行（列はすべて nullable）を、種類ごとに必須項目がそろった形にする */
export function toListing(row: Row): Listing {
  const b = base(row);
  const id = b.id;
  switch (row.kind) {
    case 'product': {
      if (!isProductCategory(row.category)) throw new Error(`listing ${id} のカテゴリが不正です`);
      return {
        ...b,
        kind: 'product',
        category: row.category,
        price: num(row.price, 'price', id),
        originalPrice: row.original_price,
        quantityTotal: num(row.quantity_total, 'quantity_total', id),
        unit: row.unit ?? '食',
        remaining: num(row.remaining, 'remaining', id),
        pickupStart: date(row.pickup_start, 'pickup_start', id),
        pickupEnd: date(row.pickup_end, 'pickup_end', id),
        bookingDeadline: date(row.booking_deadline, 'booking_deadline', id),
        cancelDeadline: optDate(row.cancel_deadline),
        foodLabel: row.food_label,
      } satisfies Product;
    }
    case 'event':
      return {
        ...b,
        kind: 'event',
        pricePerPerson: row.price_per_person,
        capacity: num(row.capacity, 'capacity', id),
        maxPerBooking: num(row.max_per_booking, 'max_per_booking', id),
        remaining: num(row.remaining, 'remaining', id),
        eventStart: date(row.event_start, 'event_start', id),
        eventEnd: date(row.event_end, 'event_end', id),
        placeName: str(row.place_name, 'place_name', id),
        placeAddress: str(row.place_address, 'place_address', id),
        applicationDeadline: date(row.application_deadline, 'application_deadline', id),
        cancelDeadline: optDate(row.cancel_deadline),
        conditions: row.conditions,
      } satisfies EventListing;
    case 'job':
      return {
        ...b,
        kind: 'job',
        payText: str(row.pay_text, 'pay_text', id),
        payAmount: row.pay_amount,
        payUnit: row.pay_unit,
        headcount: num(row.headcount, 'headcount', id),
        reservedQuantity: row.reserved_quantity ?? 0,
        workStart: date(row.work_start, 'work_start', id),
        workEnd: date(row.work_end, 'work_end', id),
        workText: row.work_text,
        placeName: str(row.place_name, 'place_name', id),
        placeAddress: str(row.place_address, 'place_address', id),
        applicationDeadline: date(row.application_deadline, 'application_deadline', id),
        cancelDeadline: optDate(row.cancel_deadline),
        conditions: row.conditions,
      } satisfies JobListing;
    case 'notice':
      return { ...b, kind: 'notice', body: str(row.body, 'body', id) } satisfies Notice;
    default:
      throw new Error(`listing ${id} の種類が不正です`);
  }
}

/** 一覧用：公開中の掲載を種類で絞って新着順に取る */
async function fetchPublished(kinds: readonly Listing['kind'][]): Promise<Listing[]> {
  const { data, error } = await supabase
    .from('listing_availability')
    .select(LISTING_SELECT)
    .in('kind', kinds)
    .eq('display_status', 'published')
    .order('publish_start', { ascending: false })
    .limit(1000);
  if (error) throw error;
  return data.map(toListing);
}

/** 公開中の商品（U-10 ホーム・一覧） */
export async function fetchProducts(): Promise<Product[]> {
  return (await fetchPublished(['product'])).filter((l): l is Product => l.kind === 'product');
}

/** 公開中のイベント・求人（U-11） */
export async function fetchEventsAndJobs(): Promise<EventOrJob[]> {
  return (await fetchPublished(['event', 'job'])).filter(
    (l): l is EventOrJob => l.kind === 'event' || l.kind === 'job',
  );
}

/** 公開中のお知らせ（U-11 お知らせ・ベル） */
export async function fetchNotices(): Promise<Notice[]> {
  return (await fetchPublished(['notice'])).filter((l): l is Notice => l.kind === 'notice');
}

/** 掲載 1 件（U-12・U-20・お知らせ詳細）。見つからなければ null */
export async function fetchListing(id: string): Promise<Listing | null> {
  const { data, error } = await supabase
    .from('listing_availability')
    .select(LISTING_SELECT)
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data ? toListing(data) : null;
}

/** 店舗一覧（U-13 の店舗の選択肢） */
export async function fetchStores(): Promise<Store[]> {
  const { data, error } = await supabase.from('stores').select(STORE_COLUMNS).order('name');
  if (error) throw error;
  return data.map(toStore);
}
