import { PAYMENT_METHOD_LABELS, type PaymentMethod } from '@/features/listings/master';
import { isValidPhone, normalizePhone } from '@/lib/format';

import type { StoreInput } from './api';
import type { StoreInfo } from './types';

export const PAYMENT_OPTIONS = (Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[]).map(
  (value) => ({
    value,
    label: PAYMENT_METHOD_LABELS[value],
  }),
);

export type StoreFormValue = StoreInput;
export type StoreFormErrors = Partial<Record<keyof StoreFormValue, string>>;

export const EMPTY_STORE: StoreFormValue = {
  name: '',
  address: '',
  phone: '',
  hoursText: '',
  paymentMethods: [],
};

export function storeToForm(s: StoreInfo): StoreFormValue {
  return {
    name: s.name,
    address: s.address,
    phone: s.phone,
    hoursText: s.hoursText ?? '',
    paymentMethods: s.paymentMethods,
  };
}

export function validateStoreForm(v: StoreFormValue): StoreFormErrors {
  const e: StoreFormErrors = {};
  if (!v.name.trim()) e.name = '店舗名を入力してください';
  if (!v.address.trim()) e.address = '住所を入力してください';
  if (!isValidPhone(normalizePhone(v.phone))) e.phone = '電話番号を正しく入力してください';
  if (v.paymentMethods.length === 0) e.paymentMethods = '支払い方法を1つ以上選んでください';
  return e;
}

/** 保存する形（前後の空白を取り、電話はハイフンなし） */
export function normalizeStoreForm(v: StoreFormValue): StoreInput {
  return {
    name: v.name.trim(),
    address: v.address.trim(),
    phone: normalizePhone(v.phone),
    hoursText: v.hoursText.trim(),
    paymentMethods: v.paymentMethods,
  };
}

export function isStoreFormChanged(a: StoreFormValue, b: StoreFormValue): boolean {
  const x = normalizeStoreForm(a);
  const y = normalizeStoreForm(b);
  return (
    x.name !== y.name ||
    x.address !== y.address ||
    x.phone !== y.phone ||
    x.hoursText !== y.hoursText ||
    [...x.paymentMethods].sort().join() !== [...y.paymentMethods].sort().join()
  );
}

export function isPaymentChanged(a: StoreFormValue, b: StoreFormValue): boolean {
  return [...a.paymentMethods].sort().join() !== [...b.paymentMethods].sort().join();
}
