-- ============================================================
-- 利用者側の残り画面（U-22・U-21・マイページ・U-02）に必要な変更
-- 設計：docs/設計_利用者側_予約管理・イベント求人・お知らせ・マイページ.md 2 章
-- ============================================================

-- profiles の列権限（利用者が is_staff・deleted_at などを書き換えられないようにする）
revoke update on public.profiles from authenticated, anon;
grant update (name, phone, notifications_enabled, agreed_terms_at) on public.profiles to authenticated;

-- 予約の記録を残したまま auth のユーザーを消せるよう、外部キーを外す
alter table public.profiles drop constraint profiles_id_fkey;

-- メール変更待ちのアドレスを profiles.pending_email に写す ----------
drop trigger on_auth_user_email_changed on auth.users;

create or replace function public.handle_user_email_change() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update public.profiles
  set email = coalesce(new.email, ''),
      pending_email = nullif(new.email_change, '')
  where id = new.id;
  return new;
end $$;

create trigger on_auth_user_email_changed after update of email, email_change on auth.users
  for each row execute function public.handle_user_email_change();

-- 期限切れになる時刻 ---------------------------------------------
-- 商品：受け取り終了。イベント・求人：終了日の翌日 0:00（日本時間）
create function public.booking_expires_at(p_listing public.listings)
returns timestamptz
language sql immutable as $$
  select case p_listing.kind
    when 'product' then p_listing.pickup_end
    when 'event' then (date_trunc('day', p_listing.event_end at time zone 'Asia/Tokyo') + interval '1 day') at time zone 'Asia/Tokyo'
    when 'job' then (date_trunc('day', p_listing.work_end at time zone 'Asia/Tokyo') + interval '1 day') at time zone 'Asia/Tokyo'
  end;
$$;

-- 期限を過ぎた予約を expired にする（pg_cron から 10 分ごと、U-02 からも呼ぶ）
create function public.expire_overdue_bookings() returns integer
language plpgsql security definer set search_path = public as $$
declare
  v_count integer;
begin
  update public.bookings b
  set status = 'expired', expired_at = now()
  from public.listings l
  where b.listing_id = l.id
    and b.status = 'reserved'
    and public.booking_expires_at(l) <= now();
  get diagnostics v_count = row_count;
  return v_count;
end $$;

revoke all on function public.expire_overdue_bookings() from public, anon, authenticated;

create extension if not exists pg_cron;
select cron.schedule('expire-overdue-bookings', '*/10 * * * *', 'select public.expire_overdue_bookings()');

-- 利用者のキャンセル（U-21）---------------------------------------
create function public.cancel_booking(p_booking_id uuid)
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

  return v_booking;
end $$;

revoke all on function public.cancel_booking(uuid) from public, anon;
grant execute on function public.cancel_booking(uuid) to authenticated;

-- アカウント削除（U-02）-----------------------------------------
create function public.delete_my_account() returns void
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception using message = 'not_authenticated', errcode = 'P0001';
  end if;

  -- 期限を過ぎた予約は削除を妨げない
  perform public.expire_overdue_bookings();

  if exists (select 1 from public.bookings where user_id = v_uid and status = 'reserved') then
    raise exception using message = 'has_active_bookings', errcode = 'P0001';
  end if;

  -- 予約の記録は残し、個人情報だけ消す（運営側は「削除済みユーザー」と表示する）
  update public.profiles
  set name = '', phone = '', email = '', pending_email = null,
      notifications_enabled = false, deleted_at = now()
  where id = v_uid;

  delete from public.store_staff where user_id = v_uid;
  delete from auth.users where id = v_uid;
end $$;

revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
