-- ============================================================
-- LocalEC 開発用シード（npx supabase db reset で投入）
-- 日時は「実行した日の日本時間」を基準にした相対値。いつ reset しても本日の商品が出る
-- ============================================================
set timezone = 'Asia/Tokyo';

-- 基準日（日本時間の今日 0:00）
create temporary table seed_base as select date_trunc('day', now()) as today;

-- 店舗 --------------------------------------------------------
insert into public.stores (id, name, address, phone, hours_text, payment_methods) values
  ('00000000-0000-4000-8000-000000000001', 'カフェ あけぼの 駅前店', '埼玉県久喜市栗橋東1-2-8', '0480000001', E'8:00〜18:00\n月曜定休', '{cash,paypay}'),
  ('00000000-0000-4000-8000-000000000002', 'あけぼの農園 直売所', '埼玉県久喜市栗橋北3-10', '0480000002', '9:00〜17:00', '{cash,paypay,credit}'),
  ('00000000-0000-4000-8000-000000000003', 'コインランドリー あけぼの', '埼玉県久喜市栗橋東2-5-1', '0480000003', '24時間', '{cash,transit_ic,other}');

-- 商品 --------------------------------------------------------
insert into public.listings (
  id, store_id, kind, title, body, status, publish_start, publish_end,
  category, price, original_price, quantity_total, unit,
  pickup_start, pickup_end, booking_deadline, cancel_deadline
)
select v.id::uuid, v.store_id::uuid, 'product', v.title, v.body, 'published', v.publish_start, v.publish_end,
       v.category::public.product_category, v.price, v.original_price, v.quantity_total, v.unit,
       v.pickup_start, v.pickup_end, v.booking_deadline, v.cancel_deadline
from seed_base b, lateral (values
  ('00000000-0000-4000-8000-000000000101', '00000000-0000-4000-8000-000000000001', '日替わり弁当',
   '今日のメインは鶏の照り焼き。地元の野菜を使った副菜が3種類付きます。ごはんは地元産のお米です。',
   b.today - interval '1 day', b.today + interval '1 day',
   'bento', 600, 800, 20, '食',
   b.today + interval '11 hours 30 minutes', b.today + interval '13 hours 30 minutes',
   b.today + interval '23 hours', b.today + interval '23 hours'),
  ('00000000-0000-4000-8000-000000000102', '00000000-0000-4000-8000-000000000001', '季節のシフォンケーキ',
   'ふんわり焼き上げた本日限定のシフォンケーキ。',
   b.today - interval '1 day', b.today + interval '1 day',
   'sweets', 900, 1800, 2, '個',
   b.today + interval '13 hours', b.today + interval '17 hours',
   b.today + interval '23 hours 30 minutes', null),
  ('00000000-0000-4000-8000-000000000103', '00000000-0000-4000-8000-000000000001', '本日のパン詰め合わせ',
   '閉店前のパンをお得に。',
   b.today - interval '1 day', b.today + interval '1 day',
   'bread', 400, 800, 5, '袋',
   b.today + interval '17 hours', b.today + interval '19 hours',
   b.today + interval '23 hours 30 minutes', b.today + interval '16 hours'),
  ('00000000-0000-4000-8000-000000000104', '00000000-0000-4000-8000-000000000002', '新米コシヒカリ 5kg',
   'あけぼの農園で今年収穫した新米です。直売所でお受け取りください。',
   now() - interval '1 hour', b.today + interval '4 days',
   'rice', 2800, null, 17, '袋',
   b.today + interval '9 hours', b.today + interval '3 days 17 hours',
   b.today + interval '3 days 17 hours', b.today + interval '1 day 18 hours'),
  ('00000000-0000-4000-8000-000000000105', '00000000-0000-4000-8000-000000000001', '自家製にんじんドレッシング',
   '地元のにんじんを使った自家製ドレッシング。',
   now() - interval '2 hours', b.today + interval '8 days',
   'processed', 650, 750, 30, '本',
   b.today + interval '8 hours', b.today + interval '7 days 18 hours',
   b.today + interval '7 days 17 hours', null),
  ('00000000-0000-4000-8000-000000000106', '00000000-0000-4000-8000-000000000003', 'ランドリーカード 5,000円分',
   '5,000円分のプリペイドカードをお得に。',
   b.today - interval '5 days', b.today + interval '31 days',
   'laundry', 4800, 5000, 50, '枚',
   b.today, b.today + interval '30 days 23 hours',
   b.today + interval '30 days 23 hours', null),
  -- 売り切れ確認用（下で 3 セット分を予約済みにする）
  ('00000000-0000-4000-8000-000000000107', '00000000-0000-4000-8000-000000000002', '朝採れ野菜セット',
   'その日の朝に採れた野菜を詰め合わせました。',
   b.today - interval '1 day', b.today + interval '2 days',
   'vegetable', 500, null, 3, 'セット',
   -- 受け取りを明日にして、期限切れ処理で枠が戻らないようにする
   b.today + interval '1 day 10 hours', b.today + interval '1 day 12 hours',
   b.today + interval '23 hours', null),
  -- 締切後確認用（締切が今日 0:00）
  ('00000000-0000-4000-8000-000000000108', '00000000-0000-4000-8000-000000000001', '焼きたてメロンパン',
   '外はさっくり、中はふんわり。',
   b.today - interval '1 day', b.today + interval '1 day',
   'bread', 180, null, 6, '個',
   b.today + interval '15 hours', b.today + interval '17 hours',
   b.today, null)
) as v(id, store_id, title, body, publish_start, publish_end, category, price, original_price, quantity_total, unit,
       pickup_start, pickup_end, booking_deadline, cancel_deadline);

-- イベント ----------------------------------------------------
insert into public.listings (
  id, store_id, kind, title, body, status, publish_start, publish_end,
  price_per_person, capacity, max_per_booking, event_start, event_end,
  place_name, place_address, application_deadline, cancel_deadline, conditions
)
select v.id::uuid, '00000000-0000-4000-8000-000000000002', 'event', v.title, v.body, 'published',
       b.today - interval '2 days', v.event_end,
       v.price, v.capacity, 4, v.event_start, v.event_end,
       v.place_name, v.place_address, v.event_start - interval '3 days', v.event_start - interval '2 days', v.conditions
from seed_base b, lateral (values
  ('00000000-0000-4000-8000-000000000201', '親子でさつまいも掘り体験', '秋の畑でさつまいもを掘ってみませんか。掘ったおいもはお持ち帰りいただけます。',
   500, 20, b.today + interval '10 days 10 hours', b.today + interval '10 days 12 hours',
   'あけぼの農園 第2畑', '埼玉県久喜市栗橋北3-10', '小学生以下のお子さまと保護者。軍手・汚れてもよい服装でお越しください。'),
  ('00000000-0000-4000-8000-000000000202', '秋の園庭開放と子ども健康相談', '園庭で自由に遊べます。保健師による健康相談もあります。',
   0, 30, b.today + interval '16 days 9 hours 30 minutes', b.today + interval '16 days 11 hours 30 minutes',
   'あけぼの保育園', '埼玉県久喜市栗橋東3-1-1', null)
) as v(id, title, body, price, capacity, event_start, event_end, place_name, place_address, conditions);

-- 求人 --------------------------------------------------------
insert into public.listings (
  id, store_id, kind, title, body, status, publish_start, publish_end,
  pay_text, pay_amount, pay_unit, headcount, work_start, work_end, work_text,
  place_name, place_address, application_deadline, cancel_deadline, conditions
)
select v.id::uuid, v.store_id::uuid, 'job', v.title, null, 'published',
       b.today - interval '3 days', v.work_end,
       v.pay_text, v.pay_amount, v.pay_unit::public.pay_unit, v.headcount, v.work_start, v.work_end, v.work_text,
       v.place_name, v.place_address, v.work_start - interval '2 days', v.work_start - interval '2 days', v.conditions
from seed_base b, lateral (values
  ('00000000-0000-4000-8000-000000000301', '00000000-0000-4000-8000-000000000002', '稲の脱穀作業（日払い）',
   '日給 9,000円', 9000, 'daily', 5, b.today + interval '7 days 8 hours', b.today + interval '7 days 15 hours', null,
   'あけぼの農園 作業場', '埼玉県久喜市栗橋北3-12', '18歳以上。刈り取った稲の運搬と脱穀機の補助。昼食付き。報酬は当日現金でお支払いします。'),
  ('00000000-0000-4000-8000-000000000302', '00000000-0000-4000-8000-000000000001', 'カフェのホールスタッフ',
   '時給 1,100円', 1100, 'hourly', 2, b.today + interval '14 days 10 hours', b.today + interval '60 days 15 hours', '週2日〜 10:00〜15:00',
   'カフェ あけぼの 駅前店', '埼玉県久喜市栗橋東1-2-8', '接客経験は問いません。')
) as v(id, store_id, title, pay_text, pay_amount, pay_unit, headcount, work_start, work_end, work_text,
       place_name, place_address, conditions);

-- お知らせ ----------------------------------------------------
insert into public.listings (id, store_id, kind, title, body, status, publish_start, publish_end)
select v.id::uuid, v.store_id::uuid, 'notice', v.title, v.body, 'published', v.publish_start, b.today + interval '60 days'
from seed_base b, lateral (values
  ('00000000-0000-4000-8000-000000000401', '00000000-0000-4000-8000-000000000001', '駅前店の営業時間が変わります',
   '10月12日（月）から、カフェ あけぼの 駅前店の営業時間を 8:00〜17:00 に変更します。お弁当の受け取り時間は各掲載に記載の時間をご確認ください。', b.today - interval '1 day'),
  ('00000000-0000-4000-8000-000000000402', '00000000-0000-4000-8000-000000000001', '駅東口の道路工事について',
   '10月中旬まで、駅東口からお店までの道の一部が通行止めになります。お越しの際は北側の道をご利用ください。', b.today - interval '6 days'),
  ('00000000-0000-4000-8000-000000000403', '00000000-0000-4000-8000-000000000002', '新米の販売を始めました',
   'あけぼの農園で今年の新米の収穫が始まりました。直売所での受け取り予約を「商品」から受け付けています。', b.today - interval '14 days')
) as v(id, store_id, title, body, publish_start);

-- 売り切れ再現用のダミー利用者と予約 ----------------------------
insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at)
values ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-8000-0000000000aa', 'authenticated', 'authenticated',
        'seed-user@example.com', 'x', now(),
        '{"name":"シード 太郎","phone":"09000000000","agreed_terms_at":"2026-10-10T00:00:00Z"}', now(), now());

insert into public.bookings (number, listing_id, store_id, user_id, kind, quantity, amount)
values ('0001', '00000000-0000-4000-8000-000000000107', '00000000-0000-4000-8000-000000000002',
        '00000000-0000-4000-8000-0000000000aa', 'product', 3, 1500);

update public.booking_number_counter set last = 1 where id = 1;

drop table seed_base;
