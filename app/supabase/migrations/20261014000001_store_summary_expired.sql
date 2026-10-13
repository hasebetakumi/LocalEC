-- A-01「本日の予定」の件数から、期限を過ぎた予約を除く
--
-- 期限切れへの切り替えは pg_cron（expire_overdue_bookings、10 分ごと）が行うため、その間は DB 上 reserved のまま。
-- A-20・A-21 は expires_at を見て期限切れとして扱う（未完了に出さない）のに、A-01 の件数は DB の状態だけで数えていたので、
-- 受け取り時間を過ぎた直後の数分だけ「本日の予定 1 件」と「本日の予定はありません」が食い違っていた（2026-10-13 の実機確認）。
-- 条件を 1 つ足し、A-20 の「本日 × 未完了」と同じ数え方にする。

create or replace function public.staff_store_summaries()
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
        and public.booking_expires_at(l) > now()
        and public.listing_schedule_start(l) < public.jst_today_start() + interval '1 day'
        and public.listing_schedule_end(l) >= public.jst_today_start())::integer
  from public.stores s
  where exists (select 1 from public.store_staff ss where ss.store_id = s.id and ss.user_id = auth.uid())
  order by s.name;
$$;
