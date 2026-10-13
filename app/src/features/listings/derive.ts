/**
 * 商品の表示用の派生値。すべて now を引数に取る純関数（テストで時刻を固定するため）。
 */
import { isSameJstDay } from '@/lib/format';

import { CATEGORIES, type ProductCategory } from './master';
import type { Product } from './types';

const HOUR_MS = 60 * 60 * 1000;
/** 「残りわずか」＝残り 3 以下 */
export const FEW_THRESHOLD = 3;
/** 「もうすぐ終了」＝締切まで 24 時間以内 */
export const ENDING_SOON_MS = 24 * HOUR_MS;
/** 「新着」＝公開から 72 時間以内（仮） */
export const NEW_MS = 72 * HOUR_MS;

export type Availability = 'open' | 'sold_out' | 'deadline_passed' | 'ended';

/** 予約できるか。終了 → 締切後 → 売り切れ の順に判定する */
export function availability(p: Product, now: Date): Availability {
  if (p.displayStatus !== 'published') return 'ended';
  if (p.bookingDeadline.getTime() <= now.getTime()) return 'deadline_passed';
  if (p.remaining <= 0) return 'sold_out';
  return 'open';
}

/** 割引率（%）。元値がなければ null */
export function discountPercent(price: number, originalPrice: number | null): number | null {
  if (originalPrice == null || originalPrice <= 0 || price >= originalPrice) return null;
  return Math.round((1 - price / originalPrice) * 100);
}

/** 「半額」「25%OFF」。元値がなければ null */
export function discountLabel(p: Product): string | null {
  const percent = discountPercent(p.price, p.originalPrice);
  if (percent == null) return null;
  return percent >= 50 ? '半額' : `${percent}%OFF`;
}

export function isEndingSoon(p: Product, now: Date): boolean {
  return (
    availability(p, now) === 'open' && p.bookingDeadline.getTime() - now.getTime() <= ENDING_SOON_MS
  );
}

export function isNew(p: Product, now: Date): boolean {
  const age = now.getTime() - p.publishStart.getTime();
  return age >= 0 && age <= NEW_MS;
}

/** 受け取りが 1 日だけで、その日が今日 */
export function isTodayOnly(p: Product, now: Date): boolean {
  return isSameJstDay(p.pickupStart, p.pickupEnd) && isSameJstDay(p.pickupStart, now);
}

export type BadgeTone = 'off' | 'few' | 'new' | 'today' | 'gray';
export type Badge = { label: string; tone: BadgeTone };

/**
 * 写真の左上に出すバッジ（1 枚だけ）。
 * 優先順：割引（半額／◯%OFF）→ 残りわずか → 本日限定 → 新着。
 * - prefer='new'：新着の帯では新着を最優先にする（design 01 の新着カード）
 * - excludeDiscount：詳細画面では割引率を価格の横に出すので、写真のバッジからは外す
 * 予約できない状態（売り切れ・締切後）では同じ文言を灰色で出す（design 05）
 */
export function badge(
  p: Product,
  now: Date,
  options: { prefer?: 'new'; excludeDiscount?: boolean } = {},
): Badge | null {
  const candidates: Badge[] = [];
  const discount = options.excludeDiscount ? null : discountLabel(p);
  const isOpen = availability(p, now) === 'open';
  if (options.prefer === 'new' && isNew(p, now)) candidates.push({ label: '新着', tone: 'new' });
  if (discount) candidates.push({ label: discount, tone: 'off' });
  if (isOpen && p.remaining <= FEW_THRESHOLD) candidates.push({ label: '残りわずか', tone: 'few' });
  if (isTodayOnly(p, now)) candidates.push({ label: '本日限定', tone: 'today' });
  if (isNew(p, now)) candidates.push({ label: '新着', tone: 'new' });

  const first = candidates[0];
  if (!first) return null;
  return isOpen ? first : { label: first.label, tone: 'gray' };
}

/** 「残り12食」 */
export function remainLabel(p: Product): string {
  return `残り${Math.max(p.remaining, 0)}${p.unit}`;
}

const byDeadlineAsc = (a: Product, b: Product) =>
  a.bookingDeadline.getTime() - b.bookingDeadline.getTime();
const byPublishDesc = (a: Product, b: Product) =>
  b.publishStart.getTime() - a.publishStart.getTime();

export type HomeGroups = {
  soon: Product[];
  fresh: Product[];
  byCategory: { category: ProductCategory; label: string; items: Product[] }[];
};

/** U-10 ホームの帯に振り分ける */
export function groupHome(products: readonly Product[], now: Date): HomeGroups {
  const visible = products.filter((p) => p.displayStatus === 'published');
  return {
    soon: visible.filter((p) => isEndingSoon(p, now)).sort(byDeadlineAsc),
    fresh: visible.filter((p) => isNew(p, now)).sort(byPublishDesc),
    byCategory: CATEGORIES.map((c) => ({
      category: c.key,
      label: c.label,
      items: visible.filter((p) => p.category === c.key).sort(byPublishDesc),
    })).filter((g) => g.items.length > 0),
  };
}

export type ListSection = 'soon' | 'new';
export type ListFilter = {
  section?: ListSection;
  category?: ProductCategory;
  storeId?: string;
};

/** U-10 一覧（すべて見る）。section で母集団と並びを決め、カテゴリ・店舗で絞る */
export function filterProducts(
  products: readonly Product[],
  filter: ListFilter,
  now: Date,
): Product[] {
  let items = products.filter((p) => p.displayStatus === 'published');
  if (filter.section === 'soon') items = items.filter((p) => isEndingSoon(p, now));
  if (filter.section === 'new') items = items.filter((p) => isNew(p, now));
  if (filter.category) items = items.filter((p) => p.category === filter.category);
  if (filter.storeId) items = items.filter((p) => p.store.id === filter.storeId);
  return [...items].sort(filter.section === 'soon' ? byDeadlineAsc : byPublishDesc);
}
