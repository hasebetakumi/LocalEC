/**
 * A-10 掲載入力・A-12 予約後の編集のフォーム（設計書 4.7・4.8）。純関数。
 */
import type { ProductCategory } from '@/features/listings/master';
import { formatDateTimeJa, formatYen, floorToMinute } from '@/lib/format';

import type { ListingInsert, ListingUpdate } from './api';
import type { ListingKind, StaffListing, StoreInfo } from './types';

export type PayUnitChoice = 'daily' | 'hourly' | 'other';

export type ListingForm = {
  title: string;
  body: string;
  photoUrl: string | null;
  category: ProductCategory | null;
  price: string;
  originalPrice: string;
  quantity: string;
  unit: string;
  start: Date | null;
  end: Date | null;
  deadline: Date | null;
  cancelAllowed: boolean;
  cancelDeadline: Date | null;
  foodLabel: string;
  pricePerPerson: string;
  maxPerBooking: string;
  placeName: string;
  placeAddress: string;
  conditions: string;
  payUnit: PayUnitChoice;
  payAmount: string;
  payFreeText: string;
  workText: string;
  publishStart: Date | null;
  publishEnd: Date | null;
  notifyOnPublish: boolean;
  /** 手で変えた項目は自動で追従させない */
  touched: { deadline: boolean; publishEnd: boolean; cancelDeadline: boolean };
};

export type FormErrors = Partial<Record<keyof ListingForm, string>>;

export const UNIT_CHOICES = ['食', '袋', '個', '本', '枚', 'セット', 'パック', 'kg'] as const;
export const DEFAULT_FOOD_LABEL = '店舗にお問い合わせください';
const DAY_MS = 24 * 60 * 60 * 1000;

/** 種類ごとの呼び方（ラベル・注記に使う） */
export const KIND_TEXT: Record<
  ListingKind,
  {
    name: string;
    start: string;
    end: string;
    deadline: string;
    quantity: string;
    quantityUnit: string | null;
  }
> = {
  product: {
    name: '商品',
    start: '受け取り開始',
    end: '受け取り終了',
    deadline: '予約締切',
    quantity: '数量',
    quantityUnit: null,
  },
  event: {
    name: 'イベント',
    start: '開始日時',
    end: '終了日時',
    deadline: '申し込み締切',
    quantity: '定員',
    quantityUnit: '名',
  },
  job: {
    name: '求人',
    start: '勤務開始',
    end: '勤務終了',
    deadline: '応募締切',
    quantity: '募集人数',
    quantityUnit: '名',
  },
  notice: { name: 'お知らせ', start: '', end: '', deadline: '', quantity: '', quantityUnit: null },
};

/** 新規の初期値（設計書 4.7「初期値」） */
export function formDefaults(kind: ListingKind, store: StoreInfo, now: Date): ListingForm {
  return {
    title: '',
    body: '',
    photoUrl: null,
    category: null,
    price: '',
    originalPrice: '',
    quantity: '',
    unit: '食',
    start: null,
    end: null,
    deadline: null,
    cancelAllowed: true,
    cancelDeadline: null,
    foodLabel: DEFAULT_FOOD_LABEL,
    pricePerPerson: '',
    maxPerBooking: '4',
    placeName: kind === 'event' || kind === 'job' ? store.name : '',
    placeAddress: kind === 'event' || kind === 'job' ? store.address : '',
    conditions: '',
    payUnit: 'daily',
    payAmount: '',
    payFreeText: '',
    workText: '',
    publishStart: floorToMinute(now),
    publishEnd: kind === 'notice' ? floorToMinute(new Date(now.getTime() + 30 * DAY_MS)) : null,
    notifyOnPublish: true,
    touched: { deadline: false, publishEnd: false, cancelDeadline: false },
  };
}

const numText = (n: number | null) => (n == null ? '' : String(n));

/** 既存の掲載をフォームの値にする（編集・複製） */
export function listingToForm(l: StaffListing): ListingForm {
  const payUnit: PayUnitChoice = l.payUnit ?? (l.kind === 'job' && l.payText ? 'other' : 'daily');
  return {
    title: l.title,
    body: l.body ?? '',
    photoUrl: l.photoUrl,
    category: l.category,
    price: numText(l.kind === 'event' ? l.pricePerPerson : l.price),
    originalPrice: numText(l.originalPrice),
    quantity: numText(l.quantity),
    unit: l.unit,
    start: l.start,
    end: l.end,
    deadline: l.deadline,
    cancelAllowed: l.cancelDeadline != null,
    cancelDeadline: l.cancelDeadline,
    foodLabel: l.foodLabel ?? DEFAULT_FOOD_LABEL,
    pricePerPerson: numText(l.pricePerPerson),
    maxPerBooking: numText(l.maxPerBooking ?? 4),
    placeName: l.placeName ?? '',
    placeAddress: l.placeAddress ?? '',
    conditions: l.conditions ?? '',
    payUnit,
    payAmount: numText(l.payAmount),
    payFreeText: payUnit === 'other' ? (l.payText ?? '') : '',
    workText: l.workText ?? '',
    publishStart: l.publishStart,
    publishEnd: l.publishEnd,
    notifyOnPublish: l.notifyOnPublish,
    // 既存の値は手で入れたものとして扱い、勝手に動かさない
    touched: { deadline: true, publishEnd: true, cancelDeadline: true },
  };
}

/** 複製：内容は同じで、日時と公開期間は入れ直してもらう */
export function duplicateForm(l: StaffListing, now: Date): ListingForm {
  const f = listingToForm(l);
  return {
    ...f,
    publishStart: floorToMinute(now),
    publishEnd: l.kind === 'notice' ? floorToMinute(new Date(now.getTime() + 30 * DAY_MS)) : null,
    start: null,
    end: null,
    deadline: null,
    cancelDeadline: null,
    touched: { deadline: false, publishEnd: false, cancelDeadline: false },
  };
}

/**
 * 開始・終了を入れたときの追従（設計書 4.7）。
 * 開始→締切、終了→公開終了、締切→キャンセル期限。手で変えた項目は動かさない
 */
export function applyFollow(prev: ListingForm, next: ListingForm, kind: ListingKind): ListingForm {
  const out = { ...next };
  if (kind === 'notice') return out;
  if (next.start && next.start !== prev.start && !out.touched.deadline) out.deadline = next.start;
  if (next.end && next.end !== prev.end && !out.touched.publishEnd) out.publishEnd = next.end;
  if (out.deadline && out.deadline !== prev.deadline && !out.touched.cancelDeadline) {
    out.cancelDeadline = out.deadline;
  }
  return out;
}

/** 「9,000」「9000」「９０００」→ 9000。数字でなければ null */
export function parseInteger(text: string): number | null {
  const t = text
    .replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
    .replace(/[,，\s]/g, '');
  if (!/^\d+$/.test(t)) return null;
  return Number(t);
}

/** 報酬の表示文字列：「日給 9,000円」 */
export function payTextOf(unit: PayUnitChoice, amount: string, freeText: string): string {
  if (unit === 'other') return freeText.trim();
  const n = parseInteger(amount);
  return `${unit === 'daily' ? '日給' : '時給'} ${n == null ? amount : formatYen(n)}円`;
}

/**
 * 検証（設計書 4.7「検証」）。publish=false（下書き保存）はタイトルだけ必須
 */
export function validateListingForm(
  f: ListingForm,
  kind: ListingKind,
  options: { publish: boolean },
): FormErrors {
  const e: FormErrors = {};
  const t = KIND_TEXT[kind];
  if (!f.title.trim()) e.title = 'タイトルを入力してください';
  if (!options.publish) return e;

  const requireDate = (
    key: 'start' | 'end' | 'deadline' | 'publishStart' | 'publishEnd',
    label: string,
  ) => {
    if (!f[key]) e[key] = `${label}を入力してください`;
  };
  const requireInt = (
    key: 'price' | 'quantity' | 'maxPerBooking' | 'payAmount',
    label: string,
    min: number,
  ) => {
    const n = parseInteger(f[key]);
    if (!f[key].trim()) e[key] = `${label}を入力してください`;
    else if (n == null || n < min) e[key] = `${label}は${min}以上の整数で入力してください`;
  };

  requireDate('publishStart', '公開開始');
  requireDate('publishEnd', '公開終了');
  if (f.publishStart && f.publishEnd && f.publishStart >= f.publishEnd) {
    e.publishEnd = '公開終了は公開開始より後にしてください';
  }

  if (kind === 'notice') {
    if (!f.body.trim()) e.body = '本文を入力してください';
    return e;
  }

  requireDate('start', t.start);
  requireDate('end', t.end);
  requireDate('deadline', t.deadline);
  if (f.start && f.end && f.start > f.end) e.end = `${t.end}は${t.start}より後にしてください`;
  if (f.deadline && f.end && f.deadline > f.end)
    e.deadline = `${t.deadline}は${t.end}より前にしてください`;
  if (f.cancelAllowed && !f.cancelDeadline) e.cancelDeadline = '期限を入力してください';
  requireInt('quantity', t.quantity, 1);

  if (kind === 'product') {
    if (!f.category) e.category = 'カテゴリを選んでください';
    requireInt('price', '価格', 0);
    if (f.originalPrice.trim()) {
      const orig = parseInteger(f.originalPrice);
      const price = parseInteger(f.price);
      if (orig == null) e.originalPrice = '元値は整数で入力してください';
      else if (price != null && orig <= price) e.originalPrice = '元値は価格より大きくしてください';
    }
  }
  if (kind === 'event') {
    if (f.pricePerPerson.trim() && parseInteger(f.pricePerPerson) == null) {
      e.pricePerPerson = '料金は0以上の整数で入力してください';
    }
    requireInt('maxPerBooking', '人数の上限', 1);
  }
  if (kind === 'job') {
    if (f.payUnit === 'other') {
      if (!f.payFreeText.trim()) e.payFreeText = '報酬を入力してください';
    } else {
      requireInt('payAmount', '報酬', 0);
    }
  }
  if (kind === 'event' || kind === 'job') {
    if (!f.placeName.trim()) e.placeName = '場所を入力してください';
    if (!f.placeAddress.trim()) e.placeAddress = '住所を入力してください';
  }
  return e;
}

const intOrNull = (text: string) => parseInteger(text);
const strOrNull = (text: string) => (text.trim() ? text.trim() : null);
const iso = (date: Date | null) => (date ? date.toISOString() : null);

/**
 * フォームを listings の行にする。種類に関係のない列は null
 * 下書きで公開期間が空なら、公開開始＝今、公開終了＝30 日後で埋める（列が not null のため）
 */
export function formToRow(
  f: ListingForm,
  kind: ListingKind,
  storeId: string,
  status: 'draft' | 'published' | 'ended',
  now: Date,
): ListingInsert {
  const publishStart = f.publishStart ?? floorToMinute(now);
  const publishEnd =
    f.publishEnd && f.publishEnd > publishStart
      ? f.publishEnd
      : new Date(publishStart.getTime() + 30 * DAY_MS);
  const base: ListingInsert = {
    store_id: storeId,
    kind,
    status,
    title: f.title.trim(),
    body: kind === 'notice' || kind === 'product' ? strOrNull(f.body) : null,
    photo_url: kind === 'notice' ? null : f.photoUrl,
    publish_start: publishStart.toISOString(),
    publish_end: publishEnd.toISOString(),
    notify_on_publish: f.notifyOnPublish,
  };
  const cancel = f.cancelAllowed ? iso(f.cancelDeadline) : null;
  switch (kind) {
    case 'product':
      return {
        ...base,
        category: f.category,
        price: intOrNull(f.price),
        original_price: intOrNull(f.originalPrice),
        quantity_total: intOrNull(f.quantity),
        unit: f.unit || '食',
        pickup_start: iso(f.start),
        pickup_end: iso(f.end),
        booking_deadline: iso(f.deadline),
        cancel_deadline: cancel,
        food_label: strOrNull(f.foodLabel) ?? DEFAULT_FOOD_LABEL,
      };
    case 'event':
      return {
        ...base,
        price_per_person: intOrNull(f.pricePerPerson),
        capacity: intOrNull(f.quantity),
        max_per_booking: intOrNull(f.maxPerBooking) ?? 4,
        event_start: iso(f.start),
        event_end: iso(f.end),
        place_name: strOrNull(f.placeName),
        place_address: strOrNull(f.placeAddress),
        application_deadline: iso(f.deadline),
        cancel_deadline: cancel,
        conditions: strOrNull(f.conditions),
      };
    case 'job': {
      const payText = payTextOf(f.payUnit, f.payAmount, f.payFreeText);
      return {
        ...base,
        pay_text: payText || null,
        pay_amount: f.payUnit === 'other' ? null : intOrNull(f.payAmount),
        pay_unit: f.payUnit === 'other' ? null : f.payUnit,
        headcount: intOrNull(f.quantity),
        work_start: iso(f.start),
        work_end: iso(f.end),
        work_text: strOrNull(f.workText),
        place_name: strOrNull(f.placeName),
        place_address: strOrNull(f.placeAddress),
        application_deadline: iso(f.deadline),
        cancel_deadline: cancel,
        conditions: strOrNull(f.conditions),
      };
    }
    case 'notice':
      return base;
  }
}

/** 編集の update 用。店舗・種類は変えない */
export function formToUpdate(
  f: ListingForm,
  kind: ListingKind,
  storeId: string,
  status: 'draft' | 'published' | 'ended',
  now: Date,
): ListingUpdate {
  const row = formToRow(f, kind, storeId, status, now);
  const { store_id: _storeId, kind: _kind, ...rest } = row;
  return rest;
}

// ---------------------------------------------------------------- A-12

/** 予約が入っているか（入っていれば A-12 の制限つき編集） */
export function isRestricted(l: StaffListing): boolean {
  return l.reservedQuantity > 0;
}

export type RestrictedForm = { quantity: string; start: Date | null; end: Date | null };

export function restrictedErrors(
  l: StaffListing,
  f: RestrictedForm,
): Partial<Record<keyof RestrictedForm, string>> {
  const e: Partial<Record<keyof RestrictedForm, string>> = {};
  const unit = l.kind === 'product' ? l.unit : '名';
  if (l.kind !== 'job') {
    const n = parseInteger(f.quantity);
    if (n == null) e.quantity = `${KIND_TEXT[l.kind].quantity}を入力してください`;
    else if (l.quantity != null && n > l.quantity) e.quantity = '増やすことはできません';
    else if (n < l.reservedQuantity)
      e.quantity = `予約済みの${l.reservedQuantity}${unit}より少なくはできません`;
  }
  if (!f.start || !f.end) e.end = '期間を入力してください';
  else if (f.start > f.end)
    e.end = `${KIND_TEXT[l.kind].end}は${KIND_TEXT[l.kind].start}より後にしてください`;
  return e;
}

/** A-12 で保存する列（数量・定員と期間だけ。求人の募集人数は DB で制限していないので一緒に送る） */
export function restrictedToUpdate(l: StaffListing, f: RestrictedForm): ListingUpdate {
  const q = parseInteger(f.quantity);
  const start = iso(f.start);
  const end = iso(f.end);
  switch (l.kind) {
    case 'product':
      return { quantity_total: q, pickup_start: start, pickup_end: end };
    case 'event':
      return { capacity: q, event_start: start, event_end: end };
    case 'job':
      return { headcount: q, work_start: start, work_end: end };
    default:
      return {};
  }
}

export function isPeriodChanged(l: StaffListing, f: RestrictedForm): boolean {
  return f.start?.getTime() !== l.start?.getTime() || f.end?.getTime() !== l.end?.getTime();
}

/** A-12「変更できない項目」の表示（項目名と値） */
export function lockedFieldRows(
  l: StaffListing,
  storeName: string,
): { label: string; value: string }[] {
  const yen = (n: number | null) => (n == null ? '—' : `${formatYen(n)}円`);
  const date = (v: Date | null) => (v ? formatDateTimeJa(v) : '—');
  const cancel = l.cancelDeadline ? `${formatDateTimeJa(l.cancelDeadline)} まで` : 'できない';
  const rows: { label: string; value: string }[] = [{ label: 'タイトル', value: l.title }];
  if (l.kind === 'product') {
    rows.push(
      { label: '価格', value: yen(l.price) },
      { label: '店舗', value: storeName },
      { label: '予約締切', value: date(l.deadline) },
      { label: 'キャンセル', value: cancel },
      { label: '食品表示', value: l.foodLabel ?? '—' },
    );
  } else if (l.kind === 'event') {
    rows.push(
      { label: '料金（1名）', value: l.pricePerPerson ? yen(l.pricePerPerson) : '無料' },
      { label: '場所', value: l.placeName ?? '—' },
      { label: '申し込み締切', value: date(l.deadline) },
      { label: '人数の上限', value: l.maxPerBooking ? `${l.maxPerBooking}名` : '—' },
      { label: 'キャンセル', value: cancel },
    );
  } else if (l.kind === 'job') {
    rows.push(
      { label: '報酬', value: l.payText ?? '—' },
      { label: '場所', value: l.placeName ?? '—' },
      { label: '応募締切', value: date(l.deadline) },
      { label: '応募の取り消し', value: cancel },
    );
  }
  return rows;
}
