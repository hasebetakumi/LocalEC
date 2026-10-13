import type { Database } from '@/lib/database.types';

import type { PaymentMethod, ProductCategory } from './master';

export type DisplayStatus = 'draft' | 'scheduled' | 'published' | 'ended';
export type PayUnit = Database['public']['Enums']['pay_unit'];

export type Store = {
  id: string;
  name: string;
  address: string;
  phone: string;
  paymentMethods: PaymentMethod[];
};

/** 種類に共通する項目 */
type ListingBase = {
  id: string;
  title: string;
  body: string | null;
  photoUrl: string | null;
  publishStart: Date;
  publishEnd: Date;
  displayStatus: DisplayStatus;
  store: Store;
};

/** 商品（listing_availability の kind='product' の行を必須項目つきに整えたもの） */
export type Product = ListingBase & {
  kind: 'product';
  category: ProductCategory;
  price: number;
  originalPrice: number | null;
  quantityTotal: number;
  unit: string;
  remaining: number;
  pickupStart: Date;
  pickupEnd: Date;
  bookingDeadline: Date;
  cancelDeadline: Date | null;
  foodLabel: string | null;
};

export type EventListing = ListingBase & {
  kind: 'event';
  /** 0 または null は無料 */
  pricePerPerson: number | null;
  capacity: number;
  maxPerBooking: number;
  remaining: number;
  eventStart: Date;
  eventEnd: Date;
  placeName: string;
  placeAddress: string;
  applicationDeadline: Date;
  cancelDeadline: Date | null;
  conditions: string | null;
};

export type JobListing = ListingBase & {
  kind: 'job';
  payText: string;
  payAmount: number | null;
  payUnit: PayUnit | null;
  headcount: number;
  /** 応募済み（予約中＋勤務済み）の人数 */
  reservedQuantity: number;
  workStart: Date;
  workEnd: Date;
  workText: string | null;
  placeName: string;
  placeAddress: string;
  applicationDeadline: Date;
  cancelDeadline: Date | null;
  conditions: string | null;
};

export type Notice = ListingBase & {
  kind: 'notice';
  body: string;
};

export type Listing = Product | EventListing | JobListing | Notice;
export type EventOrJob = EventListing | JobListing;
