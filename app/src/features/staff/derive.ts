/**
 * 運営画面の表示用の派生値（設計書 9 章）。now を引数に取る純関数。
 */
import type { BookingKind, BookingStatus } from '@/features/bookings/types';
import type { DisplayStatus } from '@/features/listings/types';
import {
  formatDateJa,
  formatMonthDay,
  formatMonthDayTime,
  formatPickup,
  formatTime,
  formatYen,
  isSameJstDay,
  jstDayKey,
  startOfJstDay,
  startOfNextJstDay,
} from '@/lib/format';

import type { KindFilter, Period, StaffBookingRow, StaffListing, StatusFilter } from './types';

// ---------------------------------------------------------------- 予約の状態

const OPEN_LABEL: Record<BookingKind, string> = {
  product: '未受け取り',
  event: '未参加',
  job: '未勤務',
};
const DONE_LABEL: Record<BookingKind, string> = {
  product: '受け取り済み',
  event: '参加済み',
  job: '勤務済み',
};

/** 表示上の状態。cron の実行間隔の間も、期限を過ぎた予約中は期限切れとして扱う */
export function staffEffectiveStatus(row: StaffBookingRow, now: Date): BookingStatus {
  if (row.status === 'reserved' && row.expiresAt.getTime() <= now.getTime()) return 'expired';
  return row.status;
}

export type StaffStatusTone = 'open' | 'done' | 'closed';

/** 運営側の状態名と色（未完了＝橙、完了＝緑、キャンセル・期限切れ＝灰。種類によらず 3 色） */
export function staffStatus(
  row: StaffBookingRow,
  now: Date,
): { label: string; tone: StaffStatusTone } {
  switch (staffEffectiveStatus(row, now)) {
    case 'reserved':
      return { label: OPEN_LABEL[row.kind], tone: 'open' };
    case 'completed':
      return { label: DONE_LABEL[row.kind], tone: 'done' };
    case 'cancelled':
      return { label: 'キャンセル', tone: 'closed' };
    case 'expired':
      return { label: '期限切れ', tone: 'closed' };
  }
}

export function doneActionLabel(kind: BookingKind): string {
  return `${DONE_LABEL[kind]}にする`;
}

export function revertActionLabel(kind: BookingKind): string {
  return `${OPEN_LABEL[kind]}に戻す`;
}

const EXPIRED_PERIOD: Record<BookingKind, { period: string; visit: string }> = {
  product: { period: '受け取り期間', visit: '来店' },
  event: { period: '開催日', visit: '参加' },
  job: { period: '勤務日', visit: '勤務' },
};

/** A-21 の期限切れの帯。種類ごとに期間と行為の言葉を変える（利用者側の履歴の「受け取り期間／開催日／勤務日」と同じ分け方） */
export function expiredNotice(kind: BookingKind): string {
  const t = EXPIRED_PERIOD[kind];
  return `${t.period}を過ぎています（期限切れ）。${t.visit}があればそのまま${DONE_LABEL[kind]}にできます。`;
}

/** 状態の絞り込み */
export function matchesStatus(row: StaffBookingRow, filter: StatusFilter, now: Date): boolean {
  const s = staffEffectiveStatus(row, now);
  switch (filter) {
    case 'all':
      return true;
    case 'open':
      return s === 'reserved';
    case 'done':
      return s === 'completed';
    case 'closed':
      return s === 'cancelled' || s === 'expired';
  }
}

export function matchesKind(row: StaffBookingRow, filter: KindFilter): boolean {
  return filter === 'all' || row.kind === filter;
}

/** 期間の絞り込み（SQL 側の fetchStoreBookings と同じ境界） */
export function matchesPeriod(row: StaffBookingRow, period: Period, now: Date): boolean {
  const today = startOfJstDay(now).getTime();
  const tomorrow = startOfNextJstDay(now).getTime();
  const start = row.scheduleStart.getTime();
  const end = row.scheduleEnd.getTime();
  switch (period) {
    case 'today':
      return start < tomorrow && end >= today;
    case 'future':
      return start >= tomorrow;
    case 'past':
      return end < today;
    case 'all':
      return true;
  }
}

/** 氏名。削除済みなら「削除済みユーザー」 */
export function customerLabel(row: StaffBookingRow): string {
  return row.customerDeleted || !row.customerName ? '削除済みユーザー' : row.customerName;
}

/** 「日替わり弁当　2食」「コーヒーの淹れ方講座　1名」「ランチタイムの配膳スタッフ」 */
export function bookingItemText(row: StaffBookingRow): string {
  if (row.kind === 'job') return row.listingTitle;
  return `${row.listingTitle}　${quantityText(row)}`;
}

/** 「2食」「1名」 */
export function quantityText(row: StaffBookingRow): string {
  return `${row.quantity}${row.kind === 'event' ? '名' : row.kind === 'job' ? '名' : row.listingUnit}`;
}

/** 金額。求人は報酬の文字列、0 円は種類を問わず「無料」（利用者側と同じ） */
export function amountText(row: StaffBookingRow): string {
  if (row.kind === 'job') return row.listingPayText ?? '—';
  if (!row.amount) return '無料';
  return `${formatYen(row.amount)}円`;
}

/** A-20 の行の右端：「11:30〜13:30」「〜10/12(月)」「週2日〜 10:00〜15:00」（利用者側 U-22 の行と同じ） */
export function rowTimeText(row: StaffBookingRow): string {
  if (row.kind === 'job' && row.listingWorkText) return row.listingWorkText;
  if (isSameJstDay(row.scheduleStart, row.scheduleEnd)) {
    return `${formatTime(row.scheduleStart)}〜${formatTime(row.scheduleEnd)}`;
  }
  return `〜${formatDateJa(row.scheduleEnd)}`;
}

/** A-21 の「受け取り」「日時」の値 */
export function scheduleFullText(row: StaffBookingRow): string {
  if (row.kind === 'job' && row.listingWorkText) return row.listingWorkText;
  return formatPickup(row.scheduleStart, row.scheduleEnd);
}

/**
 * お得（商品）の合計金額。キャンセル・期限切れは売上にならないので除く
 * （要件定義 A-20「お得は件数と合計金額」）
 */
export function productTotal(rows: readonly StaffBookingRow[], now: Date): number {
  return rows
    .filter((r) => r.kind === 'product')
    .filter((r) => {
      const st = staffEffectiveStatus(r, now);
      return st === 'reserved' || st === 'completed';
    })
    .reduce((n, r) => n + (r.amount ?? 0), 0);
}

/** A-11 掲載詳細（商品）の見出し下：「予約 5件　合計 6,000円」。予約がなければ null */
export function listingBookingTotalLine(
  rows: readonly StaffBookingRow[],
  now: Date,
): string | null {
  const live = rows.filter((r) => {
    const st = staffEffectiveStatus(r, now);
    return r.kind === 'product' && (st === 'reserved' || st === 'completed');
  });
  if (live.length === 0) return null;
  return `予約 ${live.length}件　合計 ${formatYen(productTotal(live, now))}円`;
}

/** A-20 の件数行の補足：「10/5(月)　受け取り 3件・イベント 2名　時間の早い順」 */
export function bookingSummaryLine(
  rows: readonly StaffBookingRow[],
  period: Period,
  now: Date,
): string {
  const parts: string[] = [];
  const products = rows.filter((r) => r.kind === 'product').length;
  const total = productTotal(rows, now);
  const people = rows.filter((r) => r.kind === 'event').reduce((n, r) => n + r.quantity, 0);
  const jobs = rows.filter((r) => r.kind === 'job').length;
  if (products > 0) parts.push(`受け取り ${products}件（合計 ${formatYen(total)}円）`);
  if (people > 0) parts.push(`イベント ${people}名`);
  if (jobs > 0) parts.push(`求人 ${jobs}件`);
  const order = period === 'past' ? '新しい順' : '時間の早い順';
  return [period === 'today' ? formatDateJa(now) : null, parts.join('・') || null, order]
    .filter(Boolean)
    .join('　');
}

// ---------------------------------------------------------------- 掲載

export const LISTING_STATUS_LABEL: Record<DisplayStatus, string> = {
  published: '公開',
  scheduled: '公開予定',
  draft: '下書き',
  ended: '終了',
};

const QUANTITY_UNIT = { event: '名', job: '名' } as const;

/** A-11 の右端：「8 / 20食」「2 / 8名」「3件 / 2名」。お知らせは null */
export function listingMetric(l: StaffListing): string | null {
  if (l.kind === 'notice') return null;
  if (l.kind === 'job') return `${l.reservedQuantity}件 / ${l.quantity ?? '—'}名`;
  const unit = l.kind === 'product' ? l.unit : QUANTITY_UNIT.event;
  return `${l.reservedQuantity} / ${l.quantity ?? '—'}${unit}`;
}

/**
 * A-12 の注意の見出し。件数ではなく数量を単位付きで言う（設計_運営画面 §12 判断 7）。
 * 「予約が 2 件」だと 1 件 2 袋の予約と矛盾して見えるため（2026-10-14）
 */
export function restrictedNoticeTitle(l: StaffListing): string {
  if (l.kind === 'job') return `応募が ${l.reservedQuantity}件 あります`;
  if (l.kind === 'event') return `申し込み済みが ${l.reservedQuantity}名 います`;
  return `予約済みが ${l.reservedQuantity}${l.unit} あります`;
}

/** A-11 一覧の 2 行目：「受け取り 10/5 11:30〜13:30」「10/5 14:00〜15:30」「10/3〜10/31 掲載」 */
export function listingScheduleLine(l: StaffListing): string {
  if (l.kind === 'notice') {
    return `${formatMonthDay(l.publishStart)}〜${formatMonthDay(l.publishEnd)} 掲載`;
  }
  if (!l.start || !l.end) return '日時未設定';
  const range = isSameJstDay(l.start, l.end)
    ? `${formatMonthDayTime(l.start)}〜${formatTime(l.end)}`
    : `${formatMonthDay(l.start)}〜${formatMonthDay(l.end)}`;
  if (l.kind === 'job' && l.workText) return l.workText;
  return l.kind === 'product' ? `受け取り ${range}` : range;
}

/** A-11 詳細の見出しの予定行 */
export function listingScheduleHeading(l: StaffListing): string {
  if (l.kind === 'notice') {
    return `掲載 ${formatMonthDay(l.publishStart)}〜${formatMonthDay(l.publishEnd)}`;
  }
  if (!l.start || !l.end) return '日時未設定';
  const range = formatPickup(l.start, l.end);
  const label = l.kind === 'product' ? '受け取り' : l.kind === 'event' ? '日時' : '勤務';
  return `${label} ${l.kind === 'job' && l.workText ? l.workText : range}`;
}

/** アバターの 1 文字 */
export function initialOf(name: string | null | undefined): string {
  const trimmed = (name ?? '').trim();
  return trimmed ? Array.from(trimmed)[0] : '？';
}

/** 予約一覧の並び：開始の早い順（過去は新しい順）、同じなら番号順 */
export function sortBookings(rows: StaffBookingRow[], period: Period): StaffBookingRow[] {
  const dir = period === 'past' ? -1 : 1;
  return [...rows].sort(
    (a, b) =>
      dir * (a.scheduleStart.getTime() - b.scheduleStart.getTime()) ||
      a.number.localeCompare(b.number),
  );
}

export type StaffBookingGroup = {
  key: string;
  date: Date;
  isToday: boolean;
  rows: StaffBookingRow[];
};

/**
 * A-20 本日以外（今後・過去・すべて・番号検索）を日付で束ねる（U-22 と同じ規則）。
 * 受け取り期間中の商品は今日、それ以外は開始日。グループは日付順（過去は新しい順）、中の並びは入力順
 */
export function groupStaffBookings(
  rows: readonly StaffBookingRow[],
  period: Period,
  now: Date,
): StaffBookingGroup[] {
  const groups = new Map<string, StaffBookingGroup>();
  for (const r of rows) {
    const inProgress =
      r.kind === 'product' &&
      r.scheduleStart.getTime() <= now.getTime() &&
      now.getTime() <= r.scheduleEnd.getTime();
    const date = inProgress ? now : r.scheduleStart;
    const key = jstDayKey(date);
    const g = groups.get(key) ?? { key, date, isToday: isSameJstDay(date, now), rows: [] };
    g.rows.push(r);
    groups.set(key, g);
  }
  const dir = period === 'past' ? -1 : 1;
  return [...groups.values()].sort((a, b) => dir * a.key.localeCompare(b.key));
}
