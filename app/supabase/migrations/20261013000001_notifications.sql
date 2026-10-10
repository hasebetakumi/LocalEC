-- ============================================================
-- 通知の配信（2/2）：端末トークン、通知の状態、作る処理、送る処理の呼び出し
-- 設計：docs/設計_通知の配信.md
-- ============================================================

create extension if not exists pg_net;

-- プッシュ通知の端末トークン ------------------------------------------
create table public.push_tokens (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  token       text not null unique,
  platform    text not null check (platform in ('ios', 'android')),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  -- 端末から外れた（DeviceNotRegistered）ら立てる。再登録で戻す
  disabled_at timestamptz,
  last_error  text
);
create index push_tokens_user_idx on public.push_tokens (user_id) where disabled_at is null;

create trigger push_tokens_set_updated_at before update on public.push_tokens
  for each row execute function public.set_updated_at();

alter table public.push_tokens enable row level security;
create policy push_tokens_own on public.push_tokens for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- 端末の登録（同じトークンは持ち主を付け替え、無効化を解除する）
create function public.register_push_token(p_token text, p_platform text) returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then
    raise exception using message = 'not_authenticated', errcode = 'P0001';
  end if;
  insert into public.push_tokens (user_id, token, platform)
  values (auth.uid(), p_token, p_platform)
  on conflict (token) do update
    set user_id = excluded.user_id, platform = excluded.platform, disabled_at = null, last_error = null;
end $$;

revoke all on function public.register_push_token(text, text) from public, anon;
grant execute on function public.register_push_token(text, text) to authenticated;

-- 通知の配信状態 -------------------------------------------------
alter table public.notifications
  add column push_sent_at    timestamptz,
  add column push_ticket_id  text,
  add column push_error      text,
  add column email_sent_at   timestamptz,
  add column email_error     text,
  add column attempts        integer not null default 0,
  add column next_attempt_at timestamptz,
  add column claimed_at      timestamptz,
  -- 同じ通知を二度作らないための鍵（リマインド：reminder:<day_before|same_day>:<booking_id>）
  add column dedupe_key      text unique;

create index notifications_pending_idx on public.notifications (created_at)
  where push_sent_at is null or email_sent_at is null;

-- 種類ごとの送り先：取引通知はプッシュ＋メール、新着はプッシュだけ
create function public.notification_wants_email(p_kind public.notification_kind) returns boolean
language sql immutable as $$
  select p_kind in ('booking_confirmed', 'reminder', 'cancelled_by_staff', 'listing_changed');
$$;

-- 予約が作られたら確定の通知 --------------------------------------------
create function public.notify_booking_confirmed() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_listing public.listings%rowtype;
  v_store   public.stores%rowtype;
  v_noun    text;
  v_when    text;
begin
  select * into v_listing from public.listings where id = new.listing_id;
  select * into v_store from public.stores where id = new.store_id;
  v_noun := case new.kind when 'product' then '予約' when 'event' then '申し込み' else '応募' end;
  v_when := to_char(public.listing_schedule_start(v_listing) at time zone 'Asia/Tokyo', 'MM/DD HH24:MI');
  insert into public.notifications (user_id, kind, booking_id, listing_id, title, body)
  values (
    new.user_id, 'booking_confirmed', new.id, new.listing_id,
    case new.kind when 'product' then '予約が完了しました' when 'event' then '申し込みが完了しました' else '応募を受け付けました' end,
    '「' || v_listing.title || '」の' || v_noun || '番号は ' || new.number || ' です。'
      || case new.kind
           when 'product' then v_when || ' に ' || v_store.name || ' で番号とお名前をお伝えください。'
           when 'event' then v_when || ' に ' || coalesce(v_listing.place_name, v_store.name) || ' へお越しください。'
           else '店舗からご登録の電話番号またはメールアドレスにご連絡します。'
         end
  );
  return new;
end $$;

create trigger bookings_notify_confirmed after insert on public.bookings
  for each row execute function public.notify_booking_confirmed();

-- リマインド（前日 18:00・当日 8:00、日本時間）--------------------------------
create function public.emit_reminders(p_which text) returns integer
language plpgsql security definer set search_path = public as $$
declare
  v_day   date;
  v_count integer;
begin
  if p_which not in ('day_before', 'same_day') then
    raise exception using message = 'invalid_which', errcode = 'P0001';
  end if;
  v_day := (now() at time zone 'Asia/Tokyo')::date + case when p_which = 'day_before' then 1 else 0 end;

  insert into public.notifications (user_id, kind, booking_id, listing_id, title, body, dedupe_key)
  select b.user_id, 'reminder', b.id, l.id,
    case when p_which = 'day_before' then '明日の' else '本日の' end
      || case b.kind when 'product' then '受け取り' when 'event' then 'イベント' else '勤務' end || 'のお知らせ',
    '「' || l.title || '」'
      || case b.kind
           when 'product' then 'の受け取りは ' || to_char(l.pickup_start at time zone 'Asia/Tokyo', 'MM/DD HH24:MI') || '〜'
             || to_char(l.pickup_end at time zone 'Asia/Tokyo', 'HH24:MI') || ' です。' || s.name || ' で番号 ' || b.number || ' とお名前をお伝えください。'
           when 'event' then 'は ' || to_char(l.event_start at time zone 'Asia/Tokyo', 'MM/DD HH24:MI') || ' からです。'
             || coalesce(l.place_name, s.name) || ' で番号 ' || b.number || ' とお名前をお伝えください。'
           else 'の勤務は ' || to_char(l.work_start at time zone 'Asia/Tokyo', 'MM/DD HH24:MI') || ' からです。'
         end,
    'reminder:' || p_which || ':' || b.id
  from public.bookings b
  join public.listings l on l.id = b.listing_id
  join public.stores s on s.id = b.store_id
  join public.profiles p on p.id = b.user_id
  where b.status = 'reserved'
    and p.deleted_at is null
    and (public.listing_schedule_start(l) at time zone 'Asia/Tokyo')::date = v_day
  on conflict (dedupe_key) do nothing;
  get diagnostics v_count = row_count;
  return v_count;
end $$;

revoke all on function public.emit_reminders(text) from public, anon, authenticated;

-- 公開時の新着通知（公開予定が公開になった時点も含めて 10 分ごとに拾う）---------------
alter table public.listings add column publish_notified_at timestamptz;
-- 導入時点で公開済みの掲載は「新着」として送らない（初回の実行でまとめて届くのを防ぐ）
update public.listings set publish_notified_at = now() where publish_start <= now();

create function public.emit_publish_notifications() returns integer
language plpgsql security definer set search_path = public as $$
declare
  v_listing public.listings%rowtype;
  v_store_name text;
  v_total integer := 0;
  v_count integer;
begin
  for v_listing in
    select * from public.listings l
    where l.notify_on_publish and l.publish_notified_at is null
      and l.status = 'published' and l.publish_start <= now() and l.publish_end > now()
    order by l.publish_start
    limit 20
  loop
    select name into v_store_name from public.stores where id = v_listing.store_id;
    -- 新着はプッシュだけなので、有効な端末がある利用者にだけ作る
    insert into public.notifications (user_id, kind, listing_id, title, body, dedupe_key)
    select p.id,
      case when v_listing.kind = 'notice' then 'notice_published'::public.notification_kind
           else 'listing_published'::public.notification_kind end,
      v_listing.id,
      case v_listing.kind when 'notice' then v_store_name || 'からのお知らせ' else '新着：' || v_store_name end,
      v_listing.title,
      'publish:' || v_listing.id || ':' || p.id
    from public.profiles p
    where p.deleted_at is null and p.notifications_enabled
      and exists (select 1 from public.push_tokens t where t.user_id = p.id and t.disabled_at is null)
    on conflict (dedupe_key) do nothing;
    get diagnostics v_count = row_count;
    v_total := v_total + v_count;
    update public.listings set publish_notified_at = now() where id = v_listing.id;
  end loop;
  return v_total;
end $$;

revoke all on function public.emit_publish_notifications() from public, anon, authenticated;

-- 送る処理（Edge Function）が未送信の通知をまとめて受け取る ------------------------
-- サービスロールだけが呼ぶ。同時に動いても同じ通知を二重に取らない（skip locked）
create function public.claim_notifications(p_limit integer default 100)
returns setof public.notifications
language plpgsql security definer set search_path = public as $$
begin
  return query
  with picked as (
    select n.id from public.notifications n
    where n.attempts < 5
      and (n.next_attempt_at is null or n.next_attempt_at <= now())
      and (n.claimed_at is null or n.claimed_at < now() - interval '5 minutes')
      and (
        (n.push_sent_at is null and n.push_error is distinct from 'done')
        or (n.email_sent_at is null and public.notification_wants_email(n.kind))
      )
    order by n.created_at
    limit p_limit
    for update skip locked
  )
  update public.notifications n
  set claimed_at = now(), attempts = n.attempts + 1
  from picked
  where n.id = picked.id
  returning n.*;
end $$;

revoke all on function public.claim_notifications(integer) from public, anon, authenticated;

-- 送る処理の呼び出し（URL とキーは Vault に置く。本番は Studio で、ローカルは seed で入れる）----
create function public.invoke_send_notifications() returns bigint
language plpgsql security definer set search_path = public as $$
declare
  v_url text;
  v_key text;
  v_secret text;
begin
  select decrypted_secret into v_url from vault.decrypted_secrets where name = 'functions_url';
  select decrypted_secret into v_key from vault.decrypted_secrets where name = 'publishable_key';
  select decrypted_secret into v_secret from vault.decrypted_secrets where name = 'cron_secret';
  if v_url is null or v_key is null or v_secret is null then
    return null; -- 未設定なら何もしない（配信の準備ができるまで）
  end if;
  return net.http_post(
    url := v_url || '/send-notifications',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'apikey', v_key,
      'Authorization', 'Bearer ' || v_key,
      'x-cron-secret', v_secret
    ),
    body := jsonb_build_object('source', 'db', 'at', now())
  );
end $$;

revoke all on function public.invoke_send_notifications() from public, anon, authenticated;

-- 取引通知が作られたらすぐ送る（定期実行は取りこぼしの保険）
create function public.notifications_nudge() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if public.notification_wants_email(new.kind) then
    perform public.invoke_send_notifications();
  end if;
  return new;
end $$;

create trigger notifications_nudge after insert on public.notifications
  for each row execute function public.notifications_nudge();

-- 定期実行（pg_cron はサーバー時刻＝UTC。日本時間 18:00 ＝ 09:00 UTC、8:00 ＝ 前日 23:00 UTC）
select cron.schedule('send-notifications', '* * * * *', 'select public.invoke_send_notifications()');
select cron.schedule('emit-publish-notifications', '*/10 * * * *', 'select public.emit_publish_notifications()');
select cron.schedule('remind-day-before', '0 9 * * *', $$select public.emit_reminders('day_before')$$);
select cron.schedule('remind-same-day', '0 23 * * *', $$select public.emit_reminders('same_day')$$);

-- アカウント削除では端末トークンも消す（削除済みの人の端末に届かないように）
create or replace function public.delete_my_account() returns void
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception using message = 'not_authenticated', errcode = 'P0001';
  end if;

  perform public.expire_overdue_bookings();

  if exists (select 1 from public.bookings where user_id = v_uid and status = 'reserved') then
    raise exception using message = 'has_active_bookings', errcode = 'P0001';
  end if;

  update public.profiles
  set name = '', phone = '', email = '', pending_email = null,
      notifications_enabled = false, deleted_at = now()
  where id = v_uid;

  delete from public.push_tokens where user_id = v_uid;
  delete from public.store_staff where user_id = v_uid;
  delete from auth.users where id = v_uid;
end $$;

-- プッシュの受領確認（receipts）--------------------------------------------
-- iOS は端末から外れてもチケットは ok になり、15 分ほど後の受領で DeviceNotRegistered が分かる。
-- 1 人が複数の端末を持つと 1 通知に複数のチケットが付くので、チケットごとに端末を覚えておく。
-- 送る処理（サービスロール）だけが読み書きする
create table public.push_tickets (
  ticket_id       text primary key,
  notification_id uuid not null references public.notifications(id) on delete cascade,
  token           text not null,
  created_at      timestamptz not null default now()
);
create index push_tickets_created_idx on public.push_tickets (created_at);
alter table public.push_tickets enable row level security;
revoke all on public.push_tickets from anon, authenticated;
