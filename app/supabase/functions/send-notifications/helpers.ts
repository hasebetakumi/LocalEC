// 送る処理の純粋な部分（Deno に依存しない。アプリの Jest から単体テストする）

export type NotificationLike = {
  kind: string;
  booking_id: string | null;
  listing_id: string | null;
};

/** 取引通知（プッシュ＋メール）。新着はプッシュだけ */
export const EMAIL_KINDS: ReadonlySet<string> = new Set([
  'booking_confirmed',
  'reminder',
  'cancelled_by_staff',
  'listing_changed',
]);

/** 通知をタップしたときに開く画面（アプリ内のパス） */
export function deepLink(n: NotificationLike): string {
  if (n.booking_id) return `/bookings/${n.booking_id}`;
  if (n.listing_id)
    return n.kind === 'notice_published' ? `/notices/${n.listing_id}` : `/listings/${n.listing_id}`;
  return '/';
}

/** 次に送り直す時刻（5 分 × 回数） */
export function retryAt(attempts: number, now: Date = new Date()): string {
  return new Date(now.getTime() + Math.max(attempts, 1) * 5 * 60_000).toISOString();
}

/** Expo Push API は 1 回 100 件まで */
export function chunk<T>(items: readonly T[], size = 100): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

/**
 * メールの組み立て（docs/設計_通知メールのデザイン.md）。
 * 骨組み・配色・文字は認証メール（supabase/templates/magic_link.html）と同じ。
 * 文面（title・body）は DB が作ったものをそのまま使い、HTML は枠と部品だけ足す。
 */

/** 番号の箱を出す種類（番号を店で見せる場面だけ。キャンセル・変更では出さない） */
export const NUMBER_BOX_KINDS: ReadonlySet<string> = new Set(['booking_confirmed', 'reminder']);

export type EmailInput = {
  kind: string;
  title: string;
  body: string;
  /** 送り先（フッターに出す） */
  to: string;
  /** 番号の箱。予約が引けたときだけ渡す。出すかどうかは kind で決める */
  booking?: { number: string; kind: string } | null;
  /** ボタンの先。APP_WEB_URL が未設定なら null（ボタンなし） */
  url?: string | null;
};

/** &, <, >, ", ' をエスケープする（title・body には運営が自由に入れた掲載名が入る） */
export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** ボタンの先：APP_WEB_URL（末尾の / は落とす）＋ deepLink(n)。APP_WEB_URL が空なら null */
export function emailLink(base: string | undefined, n: NotificationLike): string | null {
  const root = (base ?? '').trim().replace(/\/+$/, '');
  if (!root) return null;
  return `${root}${deepLink(n)}`;
}

/** 予約番号／申し込み番号／受付番号（src/features/bookings/derive.ts の numberLabel と同じ 3 語） */
function numberLabel(kind: string): string {
  return kind === 'product' ? '予約番号' : kind === 'event' ? '申し込み番号' : '受付番号';
}

const NOTE = 'アプリの「予約・申込」からも確認できます。';
const BUTTON = '予約・申込を見る';

// 色は src/theme/tokens.ts と同じ値
const C = {
  bg: '#F6F1E8',
  card: '#FFFFFF',
  fill: '#EFE9DF',
  text: '#1F1B17',
  textSub: '#4A443D',
  textWeak: '#6A6159',
  accent: '#B3471A',
  white: '#FFFFFF',
} as const;

const FONT =
  "font-family:-apple-system,BlinkMacSystemFont,'Hiragino Sans','Hiragino Kaku Gothic ProN','Noto Sans JP','Noto Sans CJK JP',Meiryo,sans-serif;";

const TABLE = 'role="presentation" cellpadding="0" cellspacing="0" border="0"';

/** エスケープ済みの文に改行を <br /> で入れる */
function multiline(s: string): string {
  return escapeHtml(s).replace(/\r?\n/g, '<br />');
}

function numberBox(b: { number: string; kind: string }): string {
  return `<tr><td style="padding-bottom:20px;">
<table ${TABLE} width="100%"><tr><td align="center" bgcolor="${C.fill}" style="background:${C.fill};border-radius:12px;padding:16px;">
<div style="${FONT}font-size:13px;font-weight:700;line-height:1.5;color:${C.textWeak};">${numberLabel(b.kind)}</div>
<div style="${FONT}font-size:32px;font-weight:900;line-height:1.2;letter-spacing:.12em;padding-left:.12em;font-variant-numeric:tabular-nums;color:${C.text};">${escapeHtml(b.number)}</div>
</td></tr></table>
</td></tr>`;
}

function button(url: string): string {
  return `<tr><td align="center" style="padding-bottom:16px;">
<table ${TABLE}><tr><td align="center" bgcolor="${C.accent}" style="background:${C.accent};border-radius:999px;">
<a href="${escapeHtml(url)}" style="display:inline-block;padding:16px 36px;${FONT}font-size:17px;font-weight:700;line-height:20px;color:${C.white};text-decoration:none;border-radius:999px;">${BUTTON}</a>
</td></tr></table>
</td></tr>`;
}

function emailHtml(n: EmailInput): string {
  // 種類が該当しても予約が引けなければ箱は出さない（送信は止めない）
  const box = NUMBER_BOX_KINDS.has(n.kind) && n.booking ? numberBox(n.booking) : '';
  const title = escapeHtml(n.title);
  return `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="x-apple-disable-message-reformatting" />
<meta name="color-scheme" content="light" />
<meta name="supported-color-schemes" content="light" />
<title>${title}</title>
</head>
<body style="margin:0;padding:0;background:${C.bg};" bgcolor="${C.bg}">
<div style="display:none;max-height:0;overflow:hidden;font-size:1px;line-height:1px;color:${C.bg};opacity:0;">${escapeHtml(n.body)}</div>
<table ${TABLE} width="100%" bgcolor="${C.bg}" style="background:${C.bg};"><tr><td align="center" style="padding:32px 16px;">
<table ${TABLE} width="100%" style="max-width:480px;">
<tr><td style="padding:0 8px 16px;${FONT}font-size:15px;font-weight:800;letter-spacing:.08em;color:${C.accent};">LocalEC</td></tr>
<tr><td bgcolor="${C.card}" style="background:${C.card};border-radius:18px;padding:28px 24px;">
<table ${TABLE} width="100%">
<tr><td style="padding-bottom:12px;${FONT}font-size:22px;font-weight:800;line-height:1.4;color:${C.text};">${title}</td></tr>
${box}
<tr><td style="padding-bottom:24px;${FONT}font-size:15px;line-height:1.7;color:${C.textSub};">${multiline(n.body)}</td></tr>
${n.url ? button(n.url) : ''}
<tr><td align="center" style="${FONT}font-size:13px;line-height:1.6;color:${C.textWeak};">${NOTE}</td></tr>
</table>
</td></tr>
<tr><td style="padding:20px 8px 0;${FONT}font-size:12px;line-height:1.7;color:${C.textWeak};">このメールは LocalEC に登録されたメールアドレス（${escapeHtml(n.to)}）宛てに、予約・申込の状況をお知らせするために送信しました。送信専用のため、返信には対応できません。予約・申込に関するメールは、アプリの通知設定に関わらずお送りします。</td></tr>
</table>
</td></tr></table>
</body>
</html>
`;
}

/** 件名・テキスト・HTML。件名とテキストの形は HTML 化の前と同じ（テキストはボタンの URL の行だけ足す） */
export function emailContent(n: EmailInput): { subject: string; text: string; html: string } {
  const link = n.url ? `詳細：${n.url}\n\n` : '';
  return {
    subject: `【LocalEC】${n.title}`,
    text: `${n.body}\n\n${link}${NOTE}\n\n※このメールは送信専用です。`,
    html: emailHtml(n),
  };
}

export type PushReceipt = { status: string; message?: string; details?: { error?: string } };

/** 受領が届くのは送ってから 15 分ほど後。Expo に残るのは 24 時間 */
export const RECEIPT_DELAY_MS = 15 * 60_000;
export const RECEIPT_TTL_MS = 24 * 60 * 60_000;

/**
 * 受領の結果を振り分ける。
 * - unregistered：端末から外れたトークン（無効化する）
 * - finished：確認が済んだ（または期限を過ぎて確認できない）チケット（消す）
 * まだ受領がないチケットは、どちらにも入れず次の実行で見直す
 */
export function classifyReceipts(
  tickets: readonly { ticket_id: string; token: string; created_at: string }[],
  receipts: Readonly<Record<string, PushReceipt>>,
  now: Date = new Date(),
): { unregistered: string[]; finished: string[] } {
  const unregistered = new Set<string>();
  const finished: string[] = [];
  for (const t of tickets) {
    const r = receipts[t.ticket_id];
    if (r) {
      if (r.status === 'error' && r.details?.error === 'DeviceNotRegistered') {
        unregistered.add(t.token);
      }
      finished.push(t.ticket_id);
    } else if (now.getTime() - new Date(t.created_at).getTime() > RECEIPT_TTL_MS) {
      finished.push(t.ticket_id);
    }
  }
  return { unregistered: [...unregistered], finished };
}
