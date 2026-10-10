-- ============================================================
-- 運営画面（A-01〜A-21）に必要な変更
-- 設計：docs/設計_運営画面.md
-- ============================================================

-- 公開時に新着通知を送るか（配信は後続。掲載ごとの設定だけ持つ）
alter table public.listings add column notify_on_publish boolean not null default true;

-- listing_availability は作成時の列で固定されるので、新しい列を出すため作り直す
drop view public.listing_availability;
create view public.listing_availability
with (security_invoker = on) as
select
  l.*,
  coalesce(b.reserved_quantity, 0)::integer as reserved_quantity,
  case
    when l.kind = 'product' then l.quantity_total - coalesce(b.reserved_quantity, 0)
    when l.kind = 'event'   then l.capacity       - coalesce(b.reserved_quantity, 0)
    else null
  end::integer as remaining,
  case
    when l.status = 'draft' then 'draft'
    when l.status = 'ended' or l.publish_end <= now() then 'ended'
    when l.publish_start > now() then 'scheduled'
    else 'published'
  end as display_status
from public.listings l
left join public.listing_reserved_quantities() b on b.listing_id = l.id;

grant select on public.listing_availability to anon, authenticated;

-- 下書きは種類別の必須項目が埋まっていなくてよい（公開するときに揃える）
alter table public.listings drop constraint listings_product_required;
alter table public.listings drop constraint listings_event_required;
alter table public.listings drop constraint listings_job_required;
alter table public.listings drop constraint listings_notice_required;
alter table public.listings add constraint listings_product_required check (
  kind <> 'product' or status = 'draft' or (
    category is not null and price is not null and quantity_total is not null
    and pickup_start is not null and pickup_end is not null and pickup_start <= pickup_end
    and booking_deadline is not null
  )
);
alter table public.listings add constraint listings_event_required check (
  kind <> 'event' or status = 'draft' or (
    capacity is not null and max_per_booking is not null and max_per_booking >= 1
    and event_start is not null and event_end is not null and event_start <= event_end
    and place_name is not null and place_address is not null and application_deadline is not null
  )
);
alter table public.listings add constraint listings_job_required check (
  kind <> 'job' or status = 'draft' or (
    pay_text is not null and headcount is not null
    and work_start is not null and work_end is not null and work_start <= work_end
    and place_name is not null and place_address is not null and application_deadline is not null
  )
);
alter table public.listings add constraint listings_notice_required check (
  kind <> 'notice' or status = 'draft' or body is not null
);

-- 掲載の予定の期間（商品＝受け取り、イベント＝開催、求人＝勤務）------
create function public.listing_schedule_start(p_listing public.listings) returns timestamptz
language sql immutable as $$
  select case p_listing.kind
    when 'product' then p_listing.pickup_start
    when 'event' then p_listing.event_start
    when 'job' then p_listing.work_start
  end;
$$;

create function public.listing_schedule_end(p_listing public.listings) returns timestamptz
language sql immutable as $$
  select case p_listing.kind
    when 'product' then p_listing.pickup_end
    when 'event' then p_listing.event_end
    when 'job' then p_listing.work_end
  end;
$$;

-- 日本時間の今日の範囲 [start, end)
create function public.jst_today_start() returns timestamptz
language sql stable as $$
  select date_trunc('day', now() at time zone 'Asia/Tokyo') at time zone 'Asia/Tokyo';
$$;

-- 運営側の予約一覧（A-20・A-11 詳細・A-21）。RLS は元テーブルのものが効く
-- 利用者の氏名・電話は、削除済みなら null（画面で「削除済みユーザー」と出す）
create view public.staff_booking_rows
with (security_invoker = on) as
select
  b.id, b.number, b.listing_id, b.store_id, b.user_id, b.kind, b.quantity, b.amount,
  b.status, b.cancelled_by, b.completed_at, b.cancelled_at, b.expired_at, b.created_at,
  l.title as listing_title,
  l.unit as listing_unit,
  l.pay_text as listing_pay_text,
  l.place_name as listing_place_name,
  l.work_text as listing_work_text,
  public.listing_schedule_start(l) as schedule_start,
  public.listing_schedule_end(l) as schedule_end,
  public.booking_expires_at(l) as expires_at,
  s.name as store_name,
  s.payment_methods as store_payment_methods,
  case when p.deleted_at is null then p.name end as customer_name,
  case when p.deleted_at is null then p.phone end as customer_phone,
  (p.id is null or p.deleted_at is not null) as customer_deleted
from public.bookings b
join public.listings l on l.id = b.listing_id
join public.stores s on s.id = b.store_id
left join public.profiles p on p.id = b.user_id;

grant select on public.staff_booking_rows to authenticated;

-- A-01：所属店舗ごとの件数 -------------------------------------------
create function public.staff_store_summaries()
returns table (
  store_id uuid, name text, address text, phone text, hours_text text,
  payment_methods public.payment_method[],
  published_count integer, scheduled_count integer, draft_count integer, today_count integer
)
language sql stable security definer set search_path = public as $$
  select s.id, s.name, s.address, s.phone, s.hours_text, s.payment_methods,
    (select count(*) from public.listings l
      where l.store_id = s.id and l.status = 'published' and l.publish_start <= now() and l.publish_end > now())::integer,
    (select count(*) from public.listings l
      where l.store_id = s.id and l.status = 'published' and l.publish_start > now())::integer,
    (select count(*) from public.listings l where l.store_id = s.id and l.status = 'draft')::integer,
    (select count(*) from public.bookings b join public.listings l on l.id = b.listing_id
      where b.store_id = s.id and b.status = 'reserved'
        and public.listing_schedule_start(l) < public.jst_today_start() + interval '1 day'
        and public.listing_schedule_end(l) >= public.jst_today_start())::integer
  from public.stores s
  where exists (select 1 from public.store_staff ss where ss.store_id = s.id and ss.user_id = auth.uid())
  order by s.name;
$$;

revoke all on function public.staff_store_summaries() from public, anon;
grant execute on function public.staff_store_summaries() to authenticated;

-- A-01：店舗の追加（作成者を所属にする）----------------------------------
create function public.create_store(
  p_name text, p_address text, p_phone text, p_hours_text text, p_payment_methods public.payment_method[]
) returns public.stores
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_store public.stores%rowtype;
begin
  if v_uid is null then
    raise exception using message = 'not_authenticated', errcode = 'P0001';
  end if;
  if not exists (select 1 from public.profiles where id = v_uid and is_staff and deleted_at is null) then
    raise exception using message = 'not_staff', errcode = 'P0001';
  end if;
  insert into public.stores (name, address, phone, hours_text, payment_methods)
  values (p_name, p_address, p_phone, nullif(p_hours_text, ''), p_payment_methods)
  returning * into v_store;
  insert into public.store_staff (store_id, user_id) values (v_store.id, v_uid);
  return v_store;
end $$;

revoke all on function public.create_store(text, text, text, text, public.payment_method[]) from public, anon;
grant execute on function public.create_store(text, text, text, text, public.payment_method[]) to authenticated;

-- A-21：受け取り・参加・勤務済み／未受け取りに戻す／店舗によるキャンセル -----------
create function public.staff_booking_guard(p_booking_id uuid) returns public.bookings
language plpgsql security definer set search_path = public as $$
declare
  v_booking public.bookings%rowtype;
begin
  if auth.uid() is null then
    raise exception using message = 'not_authenticated', errcode = 'P0001';
  end if;
  select * into v_booking from public.bookings where id = p_booking_id for update;
  if not found or not public.is_store_staff(v_booking.store_id) then
    raise exception using message = 'not_found', errcode = 'P0001';
  end if;
  return v_booking;
end $$;

revoke all on function public.staff_booking_guard(uuid) from public, anon, authenticated;

create function public.complete_booking(p_booking_id uuid) returns public.bookings
language plpgsql security definer set search_path = public as $$
declare
  v_booking public.bookings%rowtype := public.staff_booking_guard(p_booking_id);
begin
  -- 期限切れ後の来店も受け取り済みにできる（Q20）
  if v_booking.status not in ('reserved', 'expired') then
    raise exception using message = 'not_completable', errcode = 'P0001';
  end if;
  update public.bookings set status = 'completed', completed_at = now(), expired_at = null
  where id = p_booking_id returning * into v_booking;
  return v_booking;
end $$;

create function public.revert_booking(p_booking_id uuid) returns public.bookings
language plpgsql security definer set search_path = public as $$
declare
  v_booking public.bookings%rowtype := public.staff_booking_guard(p_booking_id);
  v_listing public.listings%rowtype;
begin
  if v_booking.status <> 'completed' then
    raise exception using message = 'not_revertable', errcode = 'P0001';
  end if;
  select * into v_listing from public.listings where id = v_booking.listing_id;
  -- 期限を過ぎていれば期限切れに戻る
  if public.booking_expires_at(v_listing) <= now() then
    update public.bookings set status = 'expired', completed_at = null, expired_at = now()
    where id = p_booking_id returning * into v_booking;
  else
    update public.bookings set status = 'reserved', completed_at = null
    where id = p_booking_id returning * into v_booking;
  end if;
  return v_booking;
end $$;

create function public.staff_cancel_booking(p_booking_id uuid) returns public.bookings
language plpgsql security definer set search_path = public as $$
declare
  v_booking public.bookings%rowtype := public.staff_booking_guard(p_booking_id);
  v_title text;
begin
  if v_booking.status not in ('reserved', 'expired') then
    raise exception using message = 'not_cancellable', errcode = 'P0001';
  end if;
  update public.bookings set status = 'cancelled', cancelled_by = 'staff', cancelled_at = now()
  where id = p_booking_id returning * into v_booking;
  -- 利用者への通知（定型文・理由なし）。配信は後続、ここでは記録だけ
  select title into v_title from public.listings where id = v_booking.listing_id;
  insert into public.notifications (user_id, kind, booking_id, listing_id, title, body)
  select v_booking.user_id, 'cancelled_by_staff', v_booking.id, v_booking.listing_id,
         '店舗によりキャンセルされました',
         '「' || v_title || '」の' || case v_booking.kind when 'product' then '予約' when 'event' then '申し込み' else '応募' end
         || '（番号 ' || v_booking.number || '）は、店舗の都合によりキャンセルされました。'
  where exists (select 1 from public.profiles where id = v_booking.user_id and deleted_at is null);
  return v_booking;
end $$;

revoke all on function public.complete_booking(uuid) from public, anon;
revoke all on function public.revert_booking(uuid) from public, anon;
revoke all on function public.staff_cancel_booking(uuid) from public, anon;
grant execute on function public.complete_booking(uuid) to authenticated;
grant execute on function public.revert_booking(uuid) to authenticated;
grant execute on function public.staff_cancel_booking(uuid) to authenticated;

-- A-11：掲載を終了する ----------------------------------------------
create function public.end_listing(p_listing_id uuid) returns public.listings
language plpgsql security definer set search_path = public as $$
declare
  v_listing public.listings%rowtype;
begin
  select * into v_listing from public.listings where id = p_listing_id for update;
  if not found or not public.is_store_staff(v_listing.store_id) then
    raise exception using message = 'not_found', errcode = 'P0001';
  end if;
  if v_listing.status <> 'published' then
    raise exception using message = 'not_endable', errcode = 'P0001';
  end if;
  update public.listings set status = 'ended', ended_at = now()
  where id = p_listing_id returning * into v_listing;
  return v_listing;
end $$;

revoke all on function public.end_listing(uuid) from public, anon;
grant execute on function public.end_listing(uuid) to authenticated;

-- A-12：予約が入った後の編集制限（数量・定員・募集人数の減少、期間、終了だけ）-------
create function public.listings_guard_update() returns trigger
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
           || to_char(public.listing_schedule_start(new) at time zone 'Asia/Tokyo', 'MM/DD HH24:MI') || '〜'
           || to_char(public.listing_schedule_end(new) at time zone 'Asia/Tokyo', 'MM/DD HH24:MI') || ' に変わりました。'
    from public.bookings b
    join public.profiles p on p.id = b.user_id
    where b.listing_id = new.id and b.status = 'reserved' and p.deleted_at is null;
  end if;
  return new;
end $$;

create trigger listings_guard_update before update on public.listings
  for each row execute function public.listings_guard_update();

-- 写真の保存先（公開バケット。書き込みは所属店舗のフォルダだけ）----------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('listing-photos', 'listing-photos', true, 5242880, array['image/jpeg', 'image/png', 'image/webp']);

create policy "listing_photos_public_read" on storage.objects for select
  using (bucket_id = 'listing-photos');
create policy "listing_photos_staff_insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'listing-photos' and public.is_store_staff(((storage.foldername(name))[1])::uuid));
create policy "listing_photos_staff_update" on storage.objects for update to authenticated
  using (bucket_id = 'listing-photos' and public.is_store_staff(((storage.foldername(name))[1])::uuid));
create policy "listing_photos_staff_delete" on storage.objects for delete to authenticated
  using (bucket_id = 'listing-photos' and public.is_store_staff(((storage.foldername(name))[1])::uuid));
