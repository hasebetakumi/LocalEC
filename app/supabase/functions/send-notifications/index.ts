// 未送信の通知を取り出して、プッシュ（Expo）とメール（SMTP）で送る
// 呼び出し元：pg_cron（毎分）と、取引通知の insert トリガー。x-cron-secret で呼び出し元を確かめる
import { createClient } from 'npm:@supabase/supabase-js@2';
import nodemailer from 'npm:nodemailer@6';

import {
  chunk,
  classifyReceipts,
  deepLink,
  EMAIL_KINDS,
  emailContent,
  type PushReceipt,
  RECEIPT_DELAY_MS,
  retryAt,
} from './helpers.ts';

type Notification = {
  id: string;
  user_id: string;
  kind: string;
  booking_id: string | null;
  listing_id: string | null;
  title: string;
  body: string;
  attempts: number;
  push_sent_at: string | null;
  email_sent_at: string | null;
};

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';
const EXPO_RECEIPTS_URL = 'https://exp.host/--/api/v2/push/getReceipts';

function expoHeaders(): Record<string, string> {
  const token = Deno.env.get('EXPO_ACCESS_TOKEN');
  return {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

async function sendPush(items: Notification[]) {
  const userIds = [...new Set(items.map((n) => n.user_id))];
  const { data: tokens } = await supabase
    .from('push_tokens')
    .select('user_id, token')
    .in('user_id', userIds)
    .is('disabled_at', null);
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, notifications_enabled')
    .in('id', userIds);
  const enabled = new Set((profiles ?? []).filter((p) => p.notifications_enabled).map((p) => p.id));
  const byUser = new Map<string, string[]>();
  for (const t of tokens ?? []) byUser.set(t.user_id, [...(byUser.get(t.user_id) ?? []), t.token]);

  const messages: {
    to: string;
    title: string;
    body: string;
    data: object;
    channelId: string;
    sound: string;
  }[] = [];
  const owners: { notificationId: string; token: string }[] = [];
  for (const n of items) {
    // 通知オフ、または端末なし → プッシュは「送らない」で確定（done）
    const targets = enabled.has(n.user_id) ? (byUser.get(n.user_id) ?? []) : [];
    if (targets.length === 0) {
      await supabase.from('notifications').update({ push_error: 'done' }).eq('id', n.id);
      continue;
    }
    for (const token of targets) {
      messages.push({
        to: token,
        title: n.title,
        body: n.body,
        data: { url: deepLink(n) },
        channelId: 'default',
        sound: 'default',
      });
      owners.push({ notificationId: n.id, token });
    }
  }
  let offset = 0;
  for (const batch of chunk(messages)) {
    const base = offset;
    offset += batch.length;
    const res = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: expoHeaders(),
      body: JSON.stringify(batch),
    });
    const json = await res.json().catch(() => ({}));
    const tickets: {
      status: string;
      id?: string;
      message?: string;
      details?: { error?: string };
    }[] = json.data ?? [];
    for (let j = 0; j < batch.length; j++) {
      const t = tickets[j];
      const { notificationId, token } = owners[base + j];
      if (t?.status === 'ok') {
        await supabase
          .from('notifications')
          .update({
            push_sent_at: new Date().toISOString(),
            push_ticket_id: t.id,
            push_error: null,
          })
          .eq('id', notificationId);
        if (t.id) {
          await supabase
            .from('push_tickets')
            .insert({ ticket_id: t.id, notification_id: notificationId, token });
        }
      } else {
        const err = t?.details?.error ?? t?.message ?? `http ${res.status}`;
        if (err === 'DeviceNotRegistered') {
          await supabase
            .from('push_tokens')
            .update({ disabled_at: new Date().toISOString(), last_error: err })
            .eq('token', token);
          await supabase
            .from('notifications')
            .update({ push_error: 'done' })
            .eq('id', notificationId);
        } else {
          const n = items.find((x) => x.id === notificationId)!;
          await supabase
            .from('notifications')
            .update({ push_error: err, next_attempt_at: retryAt(n.attempts) })
            .eq('id', notificationId);
        }
      }
    }
  }
}

/** 15 分以上前のチケットの受領を確かめ、端末から外れたトークンを無効化する */
async function checkReceipts() {
  const { data: tickets } = await supabase
    .from('push_tickets')
    .select('ticket_id, token, created_at')
    .lt('created_at', new Date(Date.now() - RECEIPT_DELAY_MS).toISOString())
    .order('created_at')
    .limit(1000);
  if (!tickets || tickets.length === 0) return 0;
  const res = await fetch(EXPO_RECEIPTS_URL, {
    method: 'POST',
    headers: expoHeaders(),
    body: JSON.stringify({ ids: tickets.map((t) => t.ticket_id) }),
  });
  if (!res.ok) return 0;
  const json = await res.json().catch(() => ({}));
  const receipts = (json.data ?? {}) as Record<string, PushReceipt>;
  const { unregistered, finished } = classifyReceipts(tickets, receipts);
  if (unregistered.length > 0) {
    await supabase
      .from('push_tokens')
      .update({ disabled_at: new Date().toISOString(), last_error: 'DeviceNotRegistered' })
      .in('token', unregistered);
  }
  if (finished.length > 0) {
    await supabase.from('push_tickets').delete().in('ticket_id', finished);
  }
  return finished.length;
}

async function sendEmails(items: Notification[]) {
  const host = Deno.env.get('SMTP_HOST');
  if (!host || items.length === 0) return;
  const transport = nodemailer.createTransport({
    host,
    port: Number(Deno.env.get('SMTP_PORT') ?? 587),
    secure: Deno.env.get('SMTP_SECURE') === 'true',
    auth: Deno.env.get('SMTP_USER')
      ? { user: Deno.env.get('SMTP_USER'), pass: Deno.env.get('SMTP_PASS') }
      : undefined,
  });
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, email, deleted_at')
    .in('id', [...new Set(items.map((n) => n.user_id))]);
  const emailOf = new Map((profiles ?? []).map((p) => [p.id, p.deleted_at ? '' : p.email]));
  for (const n of items) {
    const to = emailOf.get(n.user_id);
    if (!to) {
      await supabase
        .from('notifications')
        .update({ email_sent_at: new Date().toISOString(), email_error: 'no_address' })
        .eq('id', n.id);
      continue;
    }
    try {
      await transport.sendMail({
        from: Deno.env.get('MAIL_FROM') ?? 'LocalEC <no-reply@example.com>',
        to,
        ...emailContent(n),
      });
      await supabase
        .from('notifications')
        .update({ email_sent_at: new Date().toISOString(), email_error: null })
        .eq('id', n.id);
    } catch (e) {
      await supabase
        .from('notifications')
        .update({ email_error: String(e).slice(0, 500), next_attempt_at: retryAt(n.attempts) })
        .eq('id', n.id);
    }
  }
}

Deno.serve(async (req) => {
  if (req.headers.get('x-cron-secret') !== Deno.env.get('CRON_SECRET')) {
    return new Response('forbidden', { status: 403 });
  }
  const { data, error } = await supabase.rpc('claim_notifications', { p_limit: 100 });
  if (error) return Response.json({ error: error.message }, { status: 500 });
  const items = (data ?? []) as Notification[];
  await sendPush(items.filter((n) => !n.push_sent_at && n.push_error !== 'done'));
  await sendEmails(items.filter((n) => !n.email_sent_at && EMAIL_KINDS.has(n.kind)));
  // 受領の確認に失敗しても送信の結果には影響させない
  const receipts = await checkReceipts().catch(() => 0);
  return Response.json({ claimed: items.length, receipts });
});
