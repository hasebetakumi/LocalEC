/**
 * U-20 の種類ごとの違い（文言・数量の上限・確認表）。画面は BookForm が共通で描く
 */
import { formatDateTimeJa, formatPickup, formatYen } from '@/lib/format';

import { availability, remainLabel } from '../derive';
import {
  eventAvailability,
  isFree,
  jobAvailability,
  payLabel,
  scheduleText,
  totalLabel,
} from '../eventJob';
import { paymentMethodsText } from '../master';
import type { EventListing, JobListing, Listing, Product } from '../types';

export type BookSpec = {
  navTitle: string;
  thumbTone: 'default' | 'fresh' | 'job';
  summary: { was: string | null; price: string; per: string };
  /** 数量・人数を選ばない（求人）は null */
  quantity: {
    label: string;
    unit: string;
    remaining: number;
    /** ＋で選べる上限（残り と 1 回の上限 の小さい方） */
    max: number;
    remainLabel: string;
    note: string | null;
  } | null;
  rows: { label: string; value: string; strong?: boolean }[];
  infoNote: string | null;
  total: ((quantity: number) => { label: string; text: string }) | null;
  open: boolean;
  closedMessage: string | null;
  confirmLabel: string;
  closedLabel: string;
  /** 予約／申し込み／応募 */
  verb: string;
  /** 商品／イベント／求人 */
  noun: string;
  deadline: Date;
};

/** 残りで上限に達したとき・確定直前に売り切れたときの文言 */
export function limitMessage(spec: BookSpec, remaining: number): string {
  if (remaining > 0)
    return `残りが${remaining}${spec.quantity?.unit ?? ''}のため、これ以上は選べません`;
  return spec.noun === 'イベント'
    ? '定員に達したため、申し込みできません。'
    : '売り切れのため、予約できません。';
}

function productSpec(p: Product, now: Date): BookSpec {
  const state = availability(p, now);
  const open = state === 'open';
  return {
    navTitle: '予約内容の確認',
    thumbTone: 'default',
    summary: {
      was: p.originalPrice != null ? `${formatYen(p.originalPrice)}円` : null,
      price: `${formatYen(p.price)}円`,
      per: `/ 1${p.unit}`,
    },
    quantity: {
      label: '数量',
      unit: p.unit,
      remaining: p.remaining,
      max: p.remaining,
      remainLabel: remainLabel(p),
      note: null,
    },
    rows: [
      { label: '受け取り', value: formatPickup(p.pickupStart, p.pickupEnd), strong: true },
      { label: '場所', value: p.store.name },
      { label: 'お支払い', value: `店頭で（${paymentMethodsText(p.store.paymentMethods)}）` },
      {
        label: 'キャンセル',
        value: p.cancelDeadline ? `${formatDateTimeJa(p.cancelDeadline)} まで` : 'できません',
      },
    ],
    infoNote: null,
    total: (q) => ({ label: '合計・店頭払い', text: `${formatYen(p.price * q)}円` }),
    open,
    closedMessage:
      state === 'sold_out'
        ? '売り切れのため、予約できません。'
        : !open
          ? `予約の受付は ${formatDateTimeJa(p.bookingDeadline)} で終了しました。`
          : null,
    confirmLabel: '予約を確定する',
    closedLabel: '予約できません',
    verb: '予約',
    noun: '商品',
    deadline: p.bookingDeadline,
  };
}

function eventSpec(e: EventListing, now: Date): BookSpec {
  const state = eventAvailability(e, now);
  const open = state === 'open';
  return {
    navTitle: '申し込み内容の確認',
    thumbTone: 'fresh',
    summary: {
      was: null,
      price: isFree(e) ? '無料' : `${formatYen(e.pricePerPerson ?? 0)}円`,
      per: '/ 1名',
    },
    quantity: {
      label: '参加人数',
      unit: '名',
      remaining: e.remaining,
      max: Math.min(e.remaining, e.maxPerBooking),
      remainLabel: `残り${Math.max(e.remaining, 0)}名`,
      note: `1回の申し込みで${e.maxPerBooking}名まで選べます`,
    },
    rows: [
      { label: '日時', value: scheduleText(e), strong: true },
      { label: '場所', value: e.placeName },
      {
        label: 'お支払い',
        value: isFree(e) ? '無料' : `当日受付で（${paymentMethodsText(e.store.paymentMethods)}）`,
      },
      {
        label: 'キャンセル',
        value: e.cancelDeadline ? `${formatDateTimeJa(e.cancelDeadline)} まで` : 'できません',
      },
    ],
    infoNote: null,
    total: (q) => ({ label: '合計・当日払い', text: totalLabel(e, q) }),
    open,
    closedMessage:
      state === 'full'
        ? '定員に達したため、申し込みできません。キャンセルが出ると再び申し込めます。'
        : !open
          ? `申し込みの受付は ${formatDateTimeJa(e.applicationDeadline)} で終了しました。`
          : null,
    confirmLabel: '申し込みを確定する',
    closedLabel: '申し込みできません',
    verb: '申し込み',
    noun: 'イベント',
    deadline: e.applicationDeadline,
  };
}

function jobSpec(j: JobListing, now: Date): BookSpec {
  const open = jobAvailability(j, now) === 'open';
  const pay = payLabel(j);
  return {
    navTitle: '応募内容の確認',
    thumbTone: 'job',
    summary: { was: null, price: pay.amount, per: pay.unit ? `/ ${pay.unit}` : '' },
    quantity: null,
    rows: [
      { label: '日時', value: scheduleText(j), strong: true },
      { label: '場所', value: j.placeName },
      { label: '報酬', value: j.payText },
    ],
    infoNote: '応募後、店舗からご登録の電話番号またはメールアドレスにご連絡いたします。',
    total: null,
    open,
    closedMessage: open
      ? null
      : `応募の受付は ${formatDateTimeJa(j.applicationDeadline)} で終了しました。`,
    confirmLabel: '応募する',
    closedLabel: '応募できません',
    verb: '応募',
    noun: '求人',
    deadline: j.applicationDeadline,
  };
}

/** お知らせは申し込めないので null */
export function bookSpec(l: Listing, now: Date): BookSpec | null {
  switch (l.kind) {
    case 'product':
      return productSpec(l, now);
    case 'event':
      return eventSpec(l, now);
    case 'job':
      return jobSpec(l, now);
    default:
      return null;
  }
}
