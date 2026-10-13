-- ============================================================
-- LocalEC フェーズ1 初期スキーマ
-- ============================================================

-- 列挙型 ------------------------------------------------------
create type public.listing_kind     as enum ('product', 'event', 'job', 'notice');
create type public.listing_status   as enum ('draft', 'published', 'ended');
create type public.product_category as enum ('bento', 'rice', 'vegetable', 'bread', 'sweets', 'processed', 'laundry');
create type public.payment_method   as enum ('cash', 'paypay', 'credit', 'transit_ic', 'other');
create type public.pay_unit         as enum ('daily', 'hourly');
create type public.booking_status   as enum ('reserved', 'completed', 'cancelled', 'expired');
create type public.cancelled_by     as enum ('user', 'staff');
create type public.notification_kind as enum ('booking_confirmed', 'reminder', 'cancelled_by_staff', 'listing_changed', 'notice_published');

-- 共通：updated_at ---------------------------------------------
create function public.set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

-- profiles ----------------------------------------------------
create table public.profiles (
  id                    uuid primary key references auth.users(id) on delete cascade,
  name                  text not null default '',
  phone                 text not null default '',
  email                 text not null default '',
  pending_email         text,
  notifications_enabled boolean not null default true,
  is_staff              boolean not null default false,
  agreed_terms_at       timestamptz,
  deleted_at            timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  constraint profiles_phone_format check (phone = '' or phone ~ '^0[0-9]{9,10}$')
);
comment on table public.profiles is '利用者・スタッフ共通。name/phone が空のうちは登録未完了';

create trigger profiles_set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- auth.users が作られたら profiles を作る（メタデータから名前・電話を写す）
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, name, phone, email, agreed_terms_at)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', ''),
    coalesce(new.raw_user_meta_data ->> 'phone', ''),
    coalesce(new.email, ''),
    nullif(new.raw_user_meta_data ->> 'agreed_terms_at', '')::timestamptz
  );
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- メールが変わったら profiles.email に反映
create function public.handle_user_email_change() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update public.profiles set email = coalesce(new.email, '') where id = new.id;
  return new;
end $$;

create trigger on_auth_user_email_changed after update of email on auth.users
  for each row execute function public.handle_user_email_change();

-- stores ------------------------------------------------------
create table public.stores (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  address         text not null,
  phone           text not null,
  hours_text      text,
  payment_methods public.payment_method[] not null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint stores_payment_methods_nonempty check (cardinality(payment_methods) >= 1)
);

create trigger stores_set_updated_at before update on public.stores
  for each row execute function public.set_updated_at();

create table public.store_staff (
  store_id   uuid not null references public.stores(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (store_id, user_id)
);

-- listings ----------------------------------------------------
create table public.listings (
  id            uuid primary key default gen_random_uuid(),
  store_id      uuid not null references public.stores(id) on delete restrict,
  kind          public.listing_kind not null,
  title         text not null,
  body          text,
  photo_url     text,
  publish_start timestamptz not null,
  publish_end   timestamptz not null,
  status        public.listing_status not null default 'draft',
  ended_at      timestamptz,
  -- product
  category         public.product_category,
  price            integer,
  original_price   integer,
  quantity_total   integer,
  unit             text not null default '食',
  pickup_start     timestamptz,
  pickup_end       timestamptz,
  booking_deadline timestamptz,
  food_label       text default '店舗にお問い合わせください',
  -- event
  price_per_person integer,
  capacity         integer,
  max_per_booking  integer default 4,
  event_start      timestamptz,
  event_end        timestamptz,
  -- job
  pay_text   text,
  pay_amount integer,
  pay_unit   public.pay_unit,
  headcount  integer,
  work_start timestamptz,
  work_end   timestamptz,
  work_text  text,
  -- event / job 共通
  place_name           text,
  place_address        text,
  application_deadline timestamptz,
  cancel_deadline      timestamptz,
  conditions           text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint listings_publish_range check (publish_start < publish_end),
  constraint listings_price_nonneg check (price is null or price >= 0),
  constraint listings_original_gt_price check (original_price is null or (price is not null and original_price > price)),
  constraint listings_quantity_nonneg check (quantity_total is null or quantity_total >= 0),
  constraint listings_product_required check (
    kind <> 'product' or (
      category is not null and price is not null and quantity_total is not null
      and pickup_start is not null and pickup_end is not null and pickup_start <= pickup_end
      and booking_deadline is not null
    )
  ),
  constraint listings_event_required check (
    kind <> 'event' or (
      capacity is not null and max_per_booking is not null and max_per_booking >= 1
      and event_start is not null and event_end is not null and event_start <= event_end
      and place_name is not null and place_address is not null and application_deadline is not null
    )
  ),
  constraint listings_job_required check (
    kind <> 'job' or (
      pay_text is not null and headcount is not null
      and work_start is not null and work_end is not null and work_start <= work_end
      and place_name is not null and place_address is not null and application_deadline is not null
    )
  ),
  constraint listings_notice_required check (kind <> 'notice' or body is not null)
);
comment on column public.listings.status is 'draft / published / ended。公開予定は publish_start > now() から導出';

create index listings_kind_status_idx on public.listings (kind, status, publish_start desc);
create index listings_store_idx on public.listings (store_id);

create trigger listings_set_updated_at before update on public.listings
  for each row execute function public.set_updated_at();

-- bookings ----------------------------------------------------
create table public.bookings (
  id           uuid primary key default gen_random_uuid(),
  number       text not null,
  listing_id   uuid not null references public.listings(id) on delete restrict,
  store_id     uuid not null references public.stores(id) on delete restrict,
  user_id      uuid not null references public.profiles(id) on delete restrict,
  kind         public.listing_kind not null,
  quantity     integer not null,
  amount       integer,
  status       public.booking_status not null default 'reserved',
  cancelled_by public.cancelled_by,
  completed_at timestamptz,
  cancelled_at timestamptz,
  expired_at   timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint bookings_number_format check (number ~ '^[0-9]{4}$'),
  constraint bookings_quantity_positive check (quantity >= 1),
  constraint bookings_kind_not_notice check (kind <> 'notice')
);

-- 同じ番号が同時に reserved で存在しない
create unique index bookings_number_reserved_uidx on public.bookings (number) where status = 'reserved';
create index bookings_store_number_idx on public.bookings (store_id, number text_pattern_ops);
create index bookings_user_idx on public.bookings (user_id, status, created_at desc);
create index bookings_listing_status_idx on public.bookings (listing_id, status);

create trigger bookings_set_updated_at before update on public.bookings
  for each row execute function public.set_updated_at();

-- 採番カウンター（1行）---------------------------------------
create table public.booking_number_counter (
  id   integer primary key check (id = 1),
  last integer not null check (last between 0 and 9999)
);
insert into public.booking_number_counter (id, last) values (1, 0);

-- notifications（配信は後続）----------------------------------
create table public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  kind       public.notification_kind not null,
  booking_id uuid references public.bookings(id) on delete set null,
  listing_id uuid references public.listings(id) on delete set null,
  title      text not null,
  body       text not null,
  read_at    timestamptz,
  created_at timestamptz not null default now()
);
create index notifications_user_idx on public.notifications (user_id, created_at desc);

-- 予約数の集計（RLS を通さずに全員の予約を数える）--------------
-- bookings は RLS で「自分の分だけ」しか見えないため、ビューで直接集計すると
-- 他人の予約が漏れて残数が多く見える。集計だけを security definer で行い、
-- 返すのは掲載 ID と数量だけにする（個人情報は出さない）
create function public.listing_reserved_quantities()
returns table (listing_id uuid, reserved_quantity integer)
language sql stable security definer set search_path = public as $$
  select b.listing_id, sum(b.quantity)::integer
  from public.bookings b
  where b.status in ('reserved', 'completed')
  group by b.listing_id;
$$;

-- ビュー：残数と表示状態 ----------------------------------------
-- security_invoker なので listings の RLS（下書き・公開予定を隠す）はそのまま効く
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

-- 権限判定 ------------------------------------------------------
create function public.is_store_staff(p_store_id uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.store_staff s
    where s.store_id = p_store_id and s.user_id = auth.uid()
  );
$$;

-- 採番 ----------------------------------------------------------
create function public.next_booking_number() returns text
language plpgsql as $$
declare
  v_last      integer;
  v_candidate integer;
  v_number    text;
  v_i         integer;
begin
  select last into v_last from public.booking_number_counter where id = 1 for update;
  for v_i in 1..9999 loop
    v_candidate := (v_last + v_i - 1) % 9999 + 1;   -- 1..9999、9999 の次は 1
    v_number := lpad(v_candidate::text, 4, '0');
    if not exists (select 1 from public.bookings where number = v_number and status = 'reserved') then
      update public.booking_number_counter set last = v_candidate where id = 1;
      return v_number;
    end if;
  end loop;
  raise exception using message = 'no_number_available', errcode = 'P0001';
end $$;

-- 予約の作成 ----------------------------------------------------
create function public.create_booking(p_listing_id uuid, p_quantity integer)
returns public.bookings
language plpgsql security definer set search_path = public as $$
declare
  v_uid      uuid := auth.uid();
  v_profile  public.profiles%rowtype;
  v_listing  public.listings%rowtype;
  v_reserved integer;
  v_remaining integer;
  v_amount   integer;
  v_booking  public.bookings%rowtype;
begin
  if v_uid is null then
    raise exception using message = 'not_authenticated', errcode = 'P0001';
  end if;

  select * into v_profile from public.profiles where id = v_uid;
  if not found or v_profile.deleted_at is not null or v_profile.name = '' or v_profile.phone = '' then
    raise exception using message = 'profile_incomplete', errcode = 'P0001';
  end if;

  if p_quantity is null or p_quantity < 1 then
    raise exception using message = 'invalid_quantity', errcode = 'P0001';
  end if;

  -- 残数の競合を直列化
  select * into v_listing from public.listings where id = p_listing_id for update;
  if not found or v_listing.kind = 'notice' then
    raise exception using message = 'not_found', errcode = 'P0001';
  end if;
  if v_listing.status <> 'published' or v_listing.publish_start > now() or v_listing.publish_end <= now() then
    raise exception using message = 'not_published', errcode = 'P0001';
  end if;

  select coalesce(sum(quantity), 0) into v_reserved
  from public.bookings
  where listing_id = p_listing_id and status in ('reserved', 'completed');

  if v_listing.kind = 'product' then
    if v_listing.booking_deadline <= now() then
      raise exception using message = 'deadline_passed', errcode = 'P0001';
    end if;
    v_remaining := v_listing.quantity_total - v_reserved;
    if v_remaining < p_quantity then
      raise exception using message = 'sold_out', errcode = 'P0001';
    end if;
    v_amount := v_listing.price * p_quantity;

  elsif v_listing.kind = 'event' then
    if v_listing.application_deadline <= now() then
      raise exception using message = 'deadline_passed', errcode = 'P0001';
    end if;
    if p_quantity > v_listing.max_per_booking then
      raise exception using message = 'over_max_per_booking', errcode = 'P0001';
    end if;
    v_remaining := v_listing.capacity - v_reserved;
    if v_remaining < p_quantity then
      raise exception using message = 'sold_out', errcode = 'P0001';
    end if;
    v_amount := coalesce(v_listing.price_per_person, 0) * p_quantity;

  else -- job：人数到達でも締め切らない
    if v_listing.application_deadline <= now() then
      raise exception using message = 'deadline_passed', errcode = 'P0001';
    end if;
    if p_quantity <> 1 then
      raise exception using message = 'invalid_quantity', errcode = 'P0001';
    end if;
    v_amount := null;
  end if;

  insert into public.bookings (number, listing_id, store_id, user_id, kind, quantity, amount)
  values (public.next_booking_number(), v_listing.id, v_listing.store_id, v_uid, v_listing.kind, p_quantity, v_amount)
  returning * into v_booking;

  return v_booking;
end $$;

revoke all on function public.create_booking(uuid, integer) from public, anon;
grant execute on function public.create_booking(uuid, integer) to authenticated;
revoke all on function public.next_booking_number() from public, anon, authenticated;

-- RLS ------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.stores enable row level security;
alter table public.store_staff enable row level security;
alter table public.listings enable row level security;
alter table public.bookings enable row level security;
alter table public.booking_number_counter enable row level security;
alter table public.notifications enable row level security;

-- profiles
create policy profiles_select_self on public.profiles for select to authenticated
  using (id = auth.uid());
create policy profiles_update_self on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());
create policy profiles_select_by_staff on public.profiles for select to authenticated
  using (exists (
    select 1 from public.bookings b
    where b.user_id = profiles.id and public.is_store_staff(b.store_id)
  ));

-- stores
create policy stores_select_all on public.stores for select to anon, authenticated using (true);
create policy stores_update_staff on public.stores for update to authenticated
  using (public.is_store_staff(id)) with check (public.is_store_staff(id));
create policy stores_insert_staff on public.stores for insert to authenticated
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_staff));

-- store_staff
create policy store_staff_select_self on public.store_staff for select to authenticated
  using (user_id = auth.uid());

-- listings：利用者は公開中（公開開始後）と終了分だけ。下書き・公開予定は見えない
create policy listings_select_public on public.listings for select to anon, authenticated
  using ((status = 'published' and publish_start <= now()) or status = 'ended');
create policy listings_all_staff on public.listings for all to authenticated
  using (public.is_store_staff(store_id)) with check (public.is_store_staff(store_id));

-- bookings：insert は create_booking 経由のみ（insert ポリシーを置かない）
create policy bookings_select_own on public.bookings for select to authenticated
  using (user_id = auth.uid());
create policy bookings_select_staff on public.bookings for select to authenticated
  using (public.is_store_staff(store_id));
create policy bookings_update_staff on public.bookings for update to authenticated
  using (public.is_store_staff(store_id)) with check (public.is_store_staff(store_id));

-- notifications
create policy notifications_select_own on public.notifications for select to authenticated
  using (user_id = auth.uid());
create policy notifications_update_own on public.notifications for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- booking_number_counter：ポリシーなし（RPC の security definer だけが触る）

-- ビューの読み取り権限
grant select on public.listing_availability to anon, authenticated;
