/**
 * 日付・金額・電話番号の表示整形。
 * 表示は日本時間固定（フェーズ1は単一地域。日本は夏時間がないので +9 時間で計算する）。
 */
const JST_OFFSET_MS = 9 * 60 * 60 * 1000;
const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'] as const;

type JstParts = {
  year: number;
  month: number;
  day: number;
  weekday: number;
  hour: number;
  minute: number;
};

function jst(date: Date): JstParts {
  const d = new Date(date.getTime() + JST_OFFSET_MS);
  return {
    year: d.getUTCFullYear(),
    month: d.getUTCMonth() + 1,
    day: d.getUTCDate(),
    weekday: d.getUTCDay(),
    hour: d.getUTCHours(),
    minute: d.getUTCMinutes(),
  };
}

/** 日本時間で同じ日か */
export function isSameJstDay(a: Date, b: Date): boolean {
  const x = jst(a);
  const y = jst(b);
  return x.year === y.year && x.month === y.month && x.day === y.day;
}

/** 11:30 */
export function formatTime(date: Date): string {
  const p = jst(date);
  return `${p.hour}:${String(p.minute).padStart(2, '0')}`;
}

/** 10/5 */
export function formatMonthDay(date: Date): string {
  const p = jst(date);
  return `${p.month}/${p.day}`;
}

/** 10/5(月) */
export function formatDateJa(date: Date): string {
  const p = jst(date);
  return `${p.month}/${p.day}(${WEEKDAYS[p.weekday]})`;
}

/** 10/5(月) 10:00 */
export function formatDateTimeJa(date: Date): string {
  return `${formatDateJa(date)} ${formatTime(date)}`;
}

/**
 * 受け取り期間。同じ日なら「10/5(月) 11:30〜13:30」（withDate=false なら「11:30〜13:30」）、
 * 複数日なら「10/4〜10/6」
 */
export function formatPickup(start: Date, end: Date, options: { withDate?: boolean } = {}): string {
  const { withDate = true } = options;
  if (isSameJstDay(start, end)) {
    const time = `${formatTime(start)}〜${formatTime(end)}`;
    return withDate ? `${formatDateJa(start)} ${time}` : time;
  }
  return `${formatMonthDay(start)}〜${formatMonthDay(end)}`;
}

/** 締切。今日なら「10:00」、別の日なら「10/5(月) 10:00」 */
export function formatDeadline(deadline: Date, now: Date): string {
  return isSameJstDay(deadline, now) ? formatTime(deadline) : formatDateTimeJa(deadline);
}

/** 1200 → 1,200 */
export function formatYen(amount: number): string {
  return String(Math.trunc(amount)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/** 全角数字を半角にし、数字以外（ハイフン・空白など）を取り除く */
export function normalizePhone(input: string): string {
  return input
    .replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
    .replace(/[^0-9]/g, '');
}

/** ハイフンなしの国内番号（0 始まり 10〜11 桁）か */
export function isValidPhone(phone: string): boolean {
  return /^0[0-9]{9,10}$/.test(phone);
}

/** 09012345678 → 090-1234-5678。10 桁は 3-3-4 で区切る */
export function formatPhone(phone: string): string {
  if (phone.length === 11) return `${phone.slice(0, 3)}-${phone.slice(3, 7)}-${phone.slice(7)}`;
  if (phone.length === 10) return `${phone.slice(0, 3)}-${phone.slice(3, 6)}-${phone.slice(6)}`;
  return phone;
}

/** メールアドレスの簡易チェック（最終的な判定は Supabase に任せる） */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/** 日本時間の日付キー（2026-10-05）。日付で束ねるときに使う */
export function jstDayKey(date: Date): string {
  const p = jst(date);
  return `${p.year}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`;
}

/** 日本時間で翌日の 0:00 */
export function startOfNextJstDay(date: Date): Date {
  const p = jst(date);
  return new Date(Date.UTC(p.year, p.month - 1, p.day + 1) - JST_OFFSET_MS);
}

/** 2026年10月3日（土） */
export function formatLongDateJa(date: Date): string {
  const p = jst(date);
  return `${p.year}年${p.month}月${p.day}日（${WEEKDAYS[p.weekday]}）`;
}
