-- ============================================================
-- 利用者キャンセルの通知（2/2）：利用者が自分でキャンセルしたら、本人にメールを送る
-- 設計：docs/設計_利用者キャンセルの通知.md
-- プッシュは送らない（自分で押した直後にバナーが出ても意味がないため）。メールだけ
-- ============================================================

-- 種類ごとの送り先：取引通知と利用者キャンセルはメールを送る（insert 直後の nudge もこれで決まる）
create or replace function public.notification_wants_email(p_kind public.notification_kind) returns boolean
language sql immutable as $$
  select p_kind in ('booking_confirmed', 'reminder', 'cancelled_by_staff', 'cancelled_by_user', 'listing_changed');
$$;

-- 利用者のキャンセル（U-21）---------------------------------------
-- チェックと更新は 20261011000000_user_screens.sql のまま。更新のあとに通知を 1 行作る
create or replace function public.cancel_booking(p_booking_id uuid)
returns public.bookings
language plpgsql security definer set search_path = public as $$
declare
  v_uid     uuid := auth.uid();
  v_booking public.bookings%rowtype;
  v_listing public.listings%rowtype;
begin
  if v_uid is null then
    raise exception using message = 'not_authenticated', errcode = 'P0001';
  end if;

  select * into v_booking from public.bookings where id = p_booking_id for update;
  if not found or v_booking.user_id <> v_uid then
    raise exception using message = 'not_found', errcode = 'P0001';
  end if;
  if v_booking.status <> 'reserved' then
    raise exception using message = 'not_cancellable', errcode = 'P0001';
  end if;

  select * into v_listing from public.listings where id = v_booking.listing_id;
  if v_listing.cancel_deadline is null then
    raise exception using message = 'cancel_not_allowed', errcode = 'P0001';
  end if;
  if v_listing.cancel_deadline <= now() then
    raise exception using message = 'cancel_deadline_passed', errcode = 'P0001';
  end if;

  update public.bookings
  set status = 'cancelled', cancelled_by = 'user', cancelled_at = now()
  where id = p_booking_id
  returning * into v_booking;

  -- 本人へのキャンセル完了メール。配信は後続、ここでは記録だけ
  -- push_error = 'done'：プッシュは送らないと確定した印（claim_notifications がプッシュ未送信として拾い続けないように）
  -- 二重キャンセルは status <> 'reserved' のチェックで起きないので dedupe_key は付けない
  insert into public.notifications (user_id, kind, booking_id, listing_id, title, body, push_error)
  values (
    v_booking.user_id, 'cancelled_by_user', v_booking.id, v_booking.listing_id,
    case v_booking.kind
      when 'product' then '予約をキャンセルしました'
      when 'event' then '申し込みをキャンセルしました'
      else '応募を取り消しました'
    end,
    '「' || v_listing.title || '」の'
      || case v_booking.kind
           when 'product' then '予約（番号 ' || v_booking.number || '）をキャンセルしました。'
           when 'event' then '申し込み（番号 ' || v_booking.number || '）をキャンセルしました。'
           else '応募（番号 ' || v_booking.number || '）を取り消しました。'
         end,
    'done'
  );

  return v_booking;
end $$;

revoke all on function public.cancel_booking(uuid) from public, anon;
grant execute on function public.cancel_booking(uuid) to authenticated;
