import type { Database } from '@/lib/database.types';

export type ProductCategory = Database['public']['Enums']['product_category'];
export type PaymentMethod = Database['public']['Enums']['payment_method'];

/** カテゴリ（固定マスタ。並び順もこの順） */
export const CATEGORIES: readonly { key: ProductCategory; label: string }[] = [
  { key: 'bento', label: 'お弁当' },
  { key: 'rice', label: 'お米' },
  { key: 'vegetable', label: '野菜' },
  { key: 'bread', label: 'パン' },
  { key: 'sweets', label: 'スイーツ' },
  { key: 'processed', label: '加工品' },
  { key: 'laundry', label: 'ランドリー' },
];

export function categoryLabel(key: ProductCategory): string {
  return CATEGORIES.find((c) => c.key === key)?.label ?? key;
}

export function isProductCategory(value: unknown): value is ProductCategory {
  return CATEGORIES.some((c) => c.key === value);
}

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: '現金',
  paypay: 'PayPay',
  credit: 'クレジットカード',
  transit_ic: '交通系IC',
  other: 'その他',
};

/** 「現金・PayPay」 */
export function paymentMethodsText(methods: readonly PaymentMethod[]): string {
  return methods.map((m) => PAYMENT_METHOD_LABELS[m]).join('・');
}
