-- ============================================================
-- 予約番号をランダムにする
-- 設計：design/DATA_MODEL.md §7、docs/設計_利用者予約フロー_U10-U12-U20.md §3.1
-- ============================================================

-- 採番：ランダムな 4 桁（0001〜9999）。
-- ・同じ番号が同時に reserved で存在しないことは、部分ユニークインデックス
--   bookings_number_reserved_uidx が最終的に保証する
-- ・同時に走る採番は advisory lock で直列化し、空き確認と insert の間に
--   別の予約が同じ番号を取るのを防ぐ（ロックはトランザクション終了で解放）
-- ・ランダムな位置から始め、埋まっていれば次の番号へ進む。全部埋まっていたら
--   no_number_available
create or replace function public.next_booking_number() returns text
language plpgsql as $$
declare
  v_start     integer;
  v_candidate integer;
  v_number    text;
  v_i         integer;
begin
  perform pg_advisory_xact_lock(hashtext('public.next_booking_number'));
  v_start := floor(random() * 9999)::integer + 1;   -- 1..9999
  for v_i in 0..9998 loop
    v_candidate := (v_start + v_i - 1) % 9999 + 1;   -- 9999 の次は 1
    v_number := lpad(v_candidate::text, 4, '0');
    if not exists (select 1 from public.bookings where number = v_number and status = 'reserved') then
      return v_number;
    end if;
  end loop;
  raise exception using message = 'no_number_available', errcode = 'P0001';
end $$;

-- create or replace でも権限は引き継がれるが、意図を明示しておく
revoke all on function public.next_booking_number() from public, anon, authenticated;

-- 連番用のカウンターは不要になった
drop table public.booking_number_counter;
