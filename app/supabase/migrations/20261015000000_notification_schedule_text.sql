-- ============================================================
-- 通知本文の日時表記をアプリと揃える（2026-10-14）
-- 設計：docs/設計_Android動作確認後の修正.md §1
-- 確定メールの受け取り日時が「10/14 09:00 に」と開始だけで、アプリの「10/14〜10/17」と
-- 食い違っていた。リマインドは複数日の受け取りで終了側が時刻だけになり誤り。
-- 整形関数を 2 つ足し、確定・リマインド・期間変更の 3 か所で共用する。
-- 表記は src/lib/format.ts の formatPickup / formatDateTimeJa と同じ文字列にする。
-- ============================================================

-- 「10/24(土) 10:00」。日本時間、先頭ゼロなし、曜日は漢字 1 文字 -------------------
create or replace function public.format_datetime_ja(p_ts timestamptz) returns text
language sql immutable as $$
  select to_char(p_ts at time zone 'Asia/Tokyo', 'FMMM/FMDD')
    || '(' || (array['日','月','火','水','木','金','土'])[extract(dow from p_ts at time zone 'Asia/Tokyo')::int + 1] || ') '
    || to_char(p_ts at time zone 'Asia/Tokyo', 'FMHH24:MI');
$$;

-- 受け取り期間・日時。同じ日なら「10/15(木) 11:00〜13:00」、別の日なら「10/14〜10/17」 ------
create or replace function public.format_schedule_ja(p_start timestamptz, p_end timestamptz) returns text
language sql immutable as $$
  select case
    when (p_start at time zone 'Asia/Tokyo')::date = (p_end at time zone 'Asia/Tokyo')::date then
      public.format_datetime_ja(p_start) || '〜' || to_char(p_end at time zone 'Asia/Tokyo', 'FMHH24:MI')
    else
      to_char(p_start at time zone 'Asia/Tokyo', 'FMMM/FMDD') || '〜' || to_char(p_end at time zone 'Asia/Tokyo', 'FMMM/FMDD')
  end;
$$;

-- 予約が作られたら確定の通知（20261013000001 の差し替え。本文の日時だけ変更）--------------
create or replace function public.notify_booking_confirmed() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_listing public.listings%rowtype;
  v_store   public.stores%rowtype;
  v_noun    text;
begin
  select * into v_listing from public.listings where id = new.listing_id;
  select * into v_store from public.stores where id = new.store_id;
  v_noun := case new.kind when 'product' then '予約' when 'event' then '申し込み' else '応募' end;
  insert into public.notifications (user_id, kind, booking_id, listing_id, title, body)
  values (
    new.user_id, 'booking_confirmed', new.id, new.listing_id,
    case new.kind when 'product' then '予約が完了しました' when 'event' then '申し込みが完了しました' else '応募を受け付けました' end,
    '「' || v_listing.title || '」の' || v_noun || '番号は ' || new.number || ' です。'
      || case new.kind
           when 'product' then public.format_schedule_ja(v_listing.pickup_start, v_listing.pickup_end)
             || ' に ' || v_store.name || ' で番号とお名前をお伝えください。'
           when 'event' then public.format_datetime_ja(v_listing.event_start)
             || ' までに ' || coalesce(v_listing.place_name, v_store.name) || ' へお越しください。'
           else '店舗からご登録の電話番号またはメールアドレスにご連絡します。'
         end
  );
  return new;
end $$;

-- リマインド（20261013000001 の差し替え。本文の日時だけ変更）----------------------------
create or replace function public.emit_reminders(p_which text) returns integer
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
           when 'product' then 'の受け取りは ' || public.format_schedule_ja(l.pickup_start, l.pickup_end) || ' です。'
             || s.name || ' で番号 ' || b.number || ' とお名前をお伝えください。'
           when 'event' then 'は ' || public.format_datetime_ja(l.event_start) || ' からです。'
             || coalesce(l.place_name, s.name) || ' で番号 ' || b.number || ' とお名前をお伝えください。'
           else 'の勤務は ' || public.format_datetime_ja(l.work_start) || ' からです。'
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

-- 予約が入った後の編集制限と期間変更の通知（20261012000000 の差し替え。通知本文の日時だけ変更）
create or replace function public.listings_guard_update() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_reserved integer;
  v_period_changed boolean;
begin
  -- 終了した掲載は再公開できない（複製して新規）
  if old.status = 'ended' and new.status <> 'ended' then
    raise exception using message = 'listing_ended', errcode = 'P0001';
  end if;
  -- 店舗と種類は変えられない
  if new.store_id <> old.store_id or new.kind <> old.kind then
    raise exception using message = 'locked_fields', errcode = 'P0001';
  end if;

  select coalesce(sum(quantity), 0) into v_reserved
  from public.bookings where listing_id = old.id and status in ('reserved', 'completed');
  if v_reserved = 0 then
    return new;
  end if;

  -- 予約が入っている：固定の項目が変わっていたら拒否
  if new.title is distinct from old.title or new.body is distinct from old.body
     or new.photo_url is distinct from old.photo_url or new.publish_start is distinct from old.publish_start
     or new.category is distinct from old.category or new.price is distinct from old.price
     or new.original_price is distinct from old.original_price or new.unit is distinct from old.unit
     or new.booking_deadline is distinct from old.booking_deadline
     or new.cancel_deadline is distinct from old.cancel_deadline or new.food_label is distinct from old.food_label
     or new.price_per_person is distinct from old.price_per_person or new.max_per_booking is distinct from old.max_per_booking
     or new.place_name is distinct from old.place_name or new.place_address is distinct from old.place_address
     or new.application_deadline is distinct from old.application_deadline or new.conditions is distinct from old.conditions
     or new.pay_text is distinct from old.pay_text or new.pay_amount is distinct from old.pay_amount
     or new.pay_unit is distinct from old.pay_unit or new.work_text is distinct from old.work_text
  then
    raise exception using message = 'locked_fields', errcode = 'P0001';
  end if;
  -- 数量・定員は減らすだけ。予約済みより下にはできない
  if new.quantity_total is distinct from old.quantity_total then
    if new.quantity_total > old.quantity_total then
      raise exception using message = 'quantity_increase_not_allowed', errcode = 'P0001';
    end if;
    if new.quantity_total < v_reserved then
      raise exception using message = 'quantity_below_reserved', errcode = 'P0001';
    end if;
  end if;
  if new.capacity is distinct from old.capacity then
    if new.capacity > old.capacity then
      raise exception using message = 'quantity_increase_not_allowed', errcode = 'P0001';
    end if;
    if new.capacity < v_reserved then
      raise exception using message = 'quantity_below_reserved', errcode = 'P0001';
    end if;
  end if;

  -- 受け取り期間・日時が変わったら予約者へ通知（記録だけ。配信は後続）
  v_period_changed :=
    new.pickup_start is distinct from old.pickup_start or new.pickup_end is distinct from old.pickup_end
    or new.event_start is distinct from old.event_start or new.event_end is distinct from old.event_end
    or new.work_start is distinct from old.work_start or new.work_end is distinct from old.work_end;
  if v_period_changed then
    -- 期間を延ばしたら公開終了も合わせる（公開終了が先に来て予約が見えなくならないように）
    if public.listing_schedule_end(new) > new.publish_end then
      new.publish_end := public.listing_schedule_end(new);
    end if;
    insert into public.notifications (user_id, kind, booking_id, listing_id, title, body)
    select b.user_id, 'listing_changed', b.id, new.id,
           case new.kind when 'product' then '受け取り期間が変わりました' else '日時が変わりました' end,
           '「' || new.title || '」の' || case new.kind when 'product' then '受け取り期間' else '日時' end || 'が '
           || public.format_schedule_ja(public.listing_schedule_start(new), public.listing_schedule_end(new))
           || ' に変わりました。'
    from public.bookings b
    join public.profiles p on p.id = b.user_id
    where b.listing_id = new.id and b.status = 'reserved' and p.deleted_at is null;
  end if;
  return new;
end $$;
