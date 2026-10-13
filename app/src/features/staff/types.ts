import type { BookingKind, BookingStatus } from '@/features/bookings/types';
import type { PaymentMethod, ProductCategory } from '@/features/listings/master';
import type { DisplayStatus, PayUnit } from '@/features/listings/types';
import type { Database } from '@/lib/database.types';

export type ListingKind = Database['public']['Enums']['listing_kind'];
export type ListingStatus = Database['public']['Enums']['listing_status'];

/** A-01 の店舗カード */
export type StoreSummary = {
  id: string;
  name: string;
  address: string;
  phone: string;
  hoursText: string | null;
  paymentMethods: PaymentMethod[];
  publishedCount: number;
  scheduledCount: number;
  draftCount: number;
  todayCount: number;
};

export type StoreInfo = {
  id: string;
  name: string;
  address: string;
  phone: string;
  hoursText: string | null;
  paymentMethods: PaymentMethod[];
};

/**
 * 運営側の掲載（下書きを含むので、種類別の項目はすべて nullable のまま持つ）
 * start/end/deadline/quantity は種類に応じた列を共通名にしたもの
 */
export type StaffListing = {
  id: string;
  storeId: string;
  kind: ListingKind;
  status: ListingStatus;
  displayStatus: DisplayStatus;
  title: string;
  body: string | null;
  photoUrl: string | null;
  publishStart: Date;
  publishEnd: Date;
  notifyOnPublish: boolean;
  category: ProductCategory | null;
  price: number | null;
  originalPrice: number | null;
  unit: string;
  foodLabel: string | null;
  pricePerPerson: number | null;
  maxPerBooking: number | null;
  payText: string | null;
  payAmount: number | null;
  payUnit: PayUnit | null;
  workText: string | null;
  placeName: string | null;
  placeAddress: string | null;
  conditions: string | null;
  cancelDeadline: Date | null;
  /** 商品＝数量、イベント＝定員、求人＝募集人数 */
  quantity: number | null;
  /** 商品＝受け取り、イベント＝開催、求人＝勤務 */
  start: Date | null;
  end: Date | null;
  /** 商品＝予約締切、イベント・求人＝申し込み・応募締切 */
  deadline: Date | null;
  /** 予約中＋完了の数量の合計 */
  reservedQuantity: number;
};

/** 運営側の予約の行（staff_booking_rows） */
export type StaffBookingRow = {
  id: string;
  number: string;
  listingId: string;
  storeId: string;
  kind: BookingKind;
  quantity: number;
  amount: number | null;
  status: BookingStatus;
  cancelledBy: 'user' | 'staff' | null;
  completedAt: Date | null;
  cancelledAt: Date | null;
  expiredAt: Date | null;
  createdAt: Date;
  listingTitle: string;
  listingUnit: string;
  listingPayText: string | null;
  listingPlaceName: string | null;
  listingWorkText: string | null;
  scheduleStart: Date;
  scheduleEnd: Date;
  expiresAt: Date;
  storeName: string;
  storePaymentMethods: PaymentMethod[];
  customerName: string | null;
  customerPhone: string | null;
  customerDeleted: boolean;
};

export type Period = 'today' | 'future' | 'past' | 'all';
export type KindFilter = 'all' | BookingKind;
export type StatusFilter = 'all' | 'open' | 'done' | 'closed';
