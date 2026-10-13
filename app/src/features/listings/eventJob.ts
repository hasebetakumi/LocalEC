/**
 * イベント・求人の表示用の派生値（U-11・U-12・U-20）。now を引数に取る純関数。
 */
import { formatPickup, formatYen } from '@/lib/format';

import { FEW_THRESHOLD } from './derive';
import type { EventListing, EventOrJob, JobListing } from './types';

export type EventAvailability = 'open' | 'full' | 'deadline_passed' | 'ended';
export type JobAvailability = 'open' | 'deadline_passed' | 'ended';

export function eventAvailability(e: EventListing, now: Date): EventAvailability {
  if (e.displayStatus !== 'published') return 'ended';
  if (e.applicationDeadline.getTime() <= now.getTime()) return 'deadline_passed';
  if (e.remaining <= 0) return 'full';
  return 'open';
}

/** 求人は募集人数に達しても締め切らない */
export function jobAvailability(j: JobListing, now: Date): JobAvailability {
  if (j.displayStatus !== 'published') return 'ended';
  if (j.applicationDeadline.getTime() <= now.getTime()) return 'deadline_passed';
  return 'open';
}

export function isOpen(l: EventOrJob, now: Date): boolean {
  return l.kind === 'event'
    ? eventAvailability(l, now) === 'open'
    : jobAvailability(l, now) === 'open';
}

export function isHeadcountReached(j: JobListing): boolean {
  return j.reservedQuantity >= j.headcount;
}

export function isFree(e: EventListing): boolean {
  return !e.pricePerPerson;
}

/** 「500円」／「無料」 */
export function priceLabel(e: EventListing): string {
  return isFree(e) ? '無料' : `${formatYen(e.pricePerPerson ?? 0)}円`;
}

/** 合計（当日払い）。無料なら「無料」 */
export function totalLabel(e: EventListing, people: number): string {
  return isFree(e) ? '無料' : `${formatYen((e.pricePerPerson ?? 0) * people)}円`;
}

/** 報酬：{ unit: '日給', amount: '9,000円' }。単位・金額がなければ pay_text をそのまま */
export function payLabel(j: JobListing): { unit: string | null; amount: string } {
  if (j.payUnit && j.payAmount != null) {
    return { unit: j.payUnit === 'daily' ? '日給' : '時給', amount: `${formatYen(j.payAmount)}円` };
  }
  return { unit: null, amount: j.payText };
}

/** 日時（求人で勤務の文字列があればそれ） */
export function scheduleText(l: EventOrJob): string {
  if (l.kind === 'job') return l.workText ?? formatPickup(l.workStart, l.workEnd);
  return formatPickup(l.eventStart, l.eventEnd);
}

/** U-11 カード右下の状態 */
export function listStatus(
  l: EventOrJob,
  now: Date,
): { label: string; tone: 'few' | 'weak' } | null {
  if (l.kind === 'event') {
    const state = eventAvailability(l, now);
    if (state === 'deadline_passed' || state === 'ended')
      return { label: '受付終了', tone: 'weak' };
    if (state === 'open' && l.remaining <= FEW_THRESHOLD)
      return { label: '残りわずか', tone: 'few' };
    return null;
  }
  return jobAvailability(l, now) === 'open'
    ? { label: '募集中', tone: 'weak' }
    : { label: '受付終了', tone: 'weak' };
}

/** U-11 カードの meta：「残り8名 / 20名　500円」「日給 9,000円　5名」 */
export function listMeta(l: EventOrJob): string {
  if (l.kind === 'event')
    return `残り${Math.max(l.remaining, 0)}名 / ${l.capacity}名　${priceLabel(l)}`;
  const pay = payLabel(l);
  return `${pay.unit ? `${pay.unit} ${pay.amount}` : pay.amount}　${l.headcount}名`;
}
