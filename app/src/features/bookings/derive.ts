/**
 * 予約の表示用の派生値（U-22・U-21・U-02）。すべて now を引数に取る純関数。
 */
import {
  formatDateJa,
  formatDateTimeJa,
  formatPickup,
  formatTime,
  isSameJstDay,
  jstDayKey,
  startOfNextJstDay,
} from '@/lib/format';

import type { BookingKind, BookingStatus, MyBooking } from './types';

/** 期限切れになる時刻。商品＝受け取り終了、イベント・求人＝終了日の翌日 0:00（DB の booking_expires_at と同じ） */
export function expiresAt(b: MyBooking): Date {
  return b.kind === 'product' ? b.listing.end : startOfNextJstDay(b.listing.end);
}

/** 表示上の状態。cron の実行間隔の間も、期限を過ぎた予約中は期限切れとして扱う */
export function effectiveStatus(b: MyBooking, now: Date): BookingStatus {
  if (b.status === 'reserved' && expiresAt(b).getTime() <= now.getTime()) return 'expired';
  return b.status;
}

export function isActive(b: MyBooking, now: Date): boolean {
  return effectiveStatus(b, now) === 'reserved';
}

const RESERVED_LABEL: Record<BookingKind, string> = {
  product: '予約済み',
  event: '申し込み済み',
  job: '応募済み',
};
const COMPLETED_LABEL: Record<BookingKind, string> = {
  product: '受け取り済み',
  event: '参加済み',
  job: '勤務済み',
};

export type StatusTone = BookingKind | 'gray';

/**
 * 利用者向けの状態名とピルの色（色＝種類、キャンセル・期限切れは灰）。
 * イベント・求人の期限切れは Q11 に従い「申し込み済み」「応募済み」のまま灰で出す
 */
export function statusPill(b: MyBooking, now: Date): { label: string; tone: StatusTone } {
  const status = effectiveStatus(b, now);
  switch (status) {
    case 'reserved':
      return { label: RESERVED_LABEL[b.kind], tone: b.kind };
    case 'completed':
      return { label: COMPLETED_LABEL[b.kind], tone: b.kind };
    case 'cancelled':
      return { label: 'キャンセル', tone: 'gray' };
    case 'expired':
      return { label: b.kind === 'product' ? '期限切れ' : RESERVED_LABEL[b.kind], tone: 'gray' };
  }
}

/** 予約番号／申し込み番号／受付番号 */
export function numberLabel(kind: BookingKind): string {
  return kind === 'product' ? '予約番号' : kind === 'event' ? '申し込み番号' : '受付番号';
}

/** 「日替わり弁当　2食」「親子でさつまいも掘り体験　2名」「稲の脱穀作業（日払い）」 */
export function titleWithQuantity(b: MyBooking): string {
  if (b.kind === 'job') return b.listing.title;
  const unit = b.kind === 'event' ? '名' : b.listing.unit;
  return `${b.listing.title}　${b.quantity}${unit}`;
}

/** 日時の表示（求人で勤務の文字列があればそれ） */
export function scheduleText(b: MyBooking): string {
  if (b.kind === 'job' && b.listing.workText) return b.listing.workText;
  return formatPickup(b.listing.start, b.listing.end);
}

/** 場所の名前（商品＝店舗、イベント・求人＝開催・勤務場所） */
export function placeName(b: MyBooking): string {
  return b.kind === 'product' ? b.store.name : (b.listing.placeName ?? b.store.name);
}

export function placeAddress(b: MyBooking): string {
  return b.kind === 'product' ? b.store.address : (b.listing.placeAddress ?? b.store.address);
}

export type ActiveGroup = { key: string; date: Date; isToday: boolean; items: MyBooking[] };

/** 束ねる日付。商品で受け取り期間がすでに始まっていれば今日 */
function groupDate(b: MyBooking, now: Date): Date {
  return b.kind === 'product' && b.listing.start.getTime() <= now.getTime() ? now : b.listing.start;
}

/** U-22「予約・申し込み中」を日付で束ねる（日付昇順、同じ日は開始時刻順） */
export function groupActive(bookings: readonly MyBooking[], now: Date): ActiveGroup[] {
  const active = bookings
    .filter((b) => isActive(b, now))
    .sort((a, b) => a.listing.start.getTime() - b.listing.start.getTime());
  const groups = new Map<string, ActiveGroup>();
  for (const b of active) {
    const date = groupDate(b, now);
    const key = jstDayKey(date);
    const group = groups.get(key) ?? { key, date, isToday: isSameJstDay(date, now), items: [] };
    group.items.push(b);
    groups.set(key, group);
  }
  return [...groups.values()].sort((a, b) => a.key.localeCompare(b.key));
}

/** U-22「予約・申し込み中」の行の 2 行目（時間）と 3 行目（場所） */
export function activeRowText(b: MyBooking): { time: string; where: string } {
  const { start, end } = b.listing;
  let time: string;
  if (b.kind === 'job' && b.listing.workText) time = b.listing.workText;
  else if (isSameJstDay(start, end)) time = `${formatTime(start)}〜${formatTime(end)}`;
  else time = `〜${formatDateJa(end)}`;
  const where = b.kind === 'job' ? '連絡をお待ちください' : placeName(b);
  return { time, where };
}

/** 履歴に並べるときの日時（新しい順に使う） */
export function historyDate(b: MyBooking, now: Date): Date {
  const status = effectiveStatus(b, now);
  if (status === 'completed' && b.completedAt) return b.completedAt;
  if (status === 'cancelled' && b.cancelledAt) return b.cancelledAt;
  return b.expiredAt ?? expiresAt(b);
}

/** 履歴の 3 行目 */
export function historyLine(b: MyBooking, now: Date): string {
  const status = effectiveStatus(b, now);
  if (status === 'completed') {
    const verb = b.kind === 'product' ? '受け取り' : b.kind === 'event' ? '参加' : '勤務';
    return `${formatDateJa(b.completedAt ?? b.listing.end)} ${verb}`;
  }
  if (status === 'cancelled') return `${formatDateJa(b.cancelledAt ?? b.createdAt)} キャンセル`;
  if (b.kind === 'product') return `受け取り期間 ${formatDateJa(b.listing.end)} まで`;
  return `${b.kind === 'event' ? '開催日' : '勤務日'} ${formatDateJa(b.listing.start)}`;
}

/** U-22 履歴（予約中でないもの、新しい順） */
export function historyList(bookings: readonly MyBooking[], now: Date): MyBooking[] {
  return bookings
    .filter((b) => !isActive(b, now))
    .sort((a, b) => historyDate(b, now).getTime() - historyDate(a, now).getTime());
}

export type CancelState = 'can' | 'deadline_passed' | 'not_allowed' | 'none';

/** U-21 キャンセルできるか */
export function cancelState(b: MyBooking, now: Date): CancelState {
  if (!isActive(b, now)) return 'none';
  const deadline = b.listing.cancelDeadline;
  if (!deadline) return 'not_allowed';
  return deadline.getTime() > now.getTime() ? 'can' : 'deadline_passed';
}

/** 「10/5(月) 10:00 までキャンセルできます」 */
export function cancelUntilText(b: MyBooking): string {
  const deadline = b.listing.cancelDeadline;
  const verb = b.kind === 'job' ? '取り消せます' : 'キャンセルできます';
  return deadline ? `${formatDateTimeJa(deadline)} まで${verb}` : '';
}
