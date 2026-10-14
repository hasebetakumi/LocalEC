# 設計：Android 動作確認（2026-10-14）で見つかった 4 点の修正

2026-10-14 に Android（Expo Go）で一通り操作したスクショを確認し、直す 4 点を決めた。「直したほうがよい点」2 つと「仕様どおりだが分かりにくい点」2 つ。設計は先にここに書き、実装はこの文書を正とする。

| # | 対象 | 症状 | 層 |
| --- | --- | --- | --- |
| 1 | 通知メール・プッシュの本文 | 受け取り日時が「10/14 09:00 に」と開始時刻だけで、アプリの「10/14〜10/17」と食い違う | DB（SQL） |
| 2 | A-10 掲載入力（＋ A-02 店舗情報・店舗追加） | 「公開する」でエラーになった後、入力しても赤枠と「〜を入力してください」が消えない | 画面 |
| 3 | A-12 予約が入った後の編集 | 「予約が 2 件入っています」が実際は 1 件（2 袋）。掲載詳細の「予約 1件」と矛盾して見える | 画面・文言 |
| 4 | A-20 予約・申し込み（スタッフ） | 期間を「今後」「過去」「すべて」にすると行に日付がなく、どの日か分からない | 画面 |

---

## 1. 通知本文の日時表記をアプリと揃える

### 1.1 現状と問題

本文は SQL 側（トリガー・関数）で `to_char(..., 'MM/DD HH24:MI')` で組み立てている。3 か所ある。

| 通知 | 場所 | 現状の例 | 問題 |
| --- | --- | --- | --- |
| `booking_confirmed` | `20261013000001_notifications.sql` `notify_booking_confirmed()` | 商品「10/14 09:00 に あけぼの農園 直売所 で番号と…」／イベント「10/24 10:00 に … へお越しください」 | 開始だけ。期間指定の商品は「14 日 9 時に来い」と読める。同日でも終了時刻が出ない |
| `reminder` | 同ファイル `emit_reminders()` | 商品「受け取りは 10/14 09:00〜17:00 です」 | 終了側が時刻だけなので、複数日の受け取り（10/14 9:00〜10/17 17:00）が「10/14 09:00〜17:00」になり**誤り** |
| `listing_changed` | `20261012000000_staff.sql` `listings_guard_update()` | 「10/14 09:00〜10/17 17:00 に変わりました」 | 正しいが、曜日なし・先頭ゼロありでアプリと表記が違う |

アプリ側の表記（`src/lib/format.ts`）は次のとおり。これを正とする。

- `formatPickup(start, end)`：同じ日なら「10/15(木) 11:00〜13:00」、複数日なら「10/14〜10/17」
- `formatDateTimeJa(d)`：「10/24(土) 10:00」
- 時刻は先頭ゼロなし（「9:00」）、日付も先頭ゼロなし（「10/5」）、曜日は漢字 1 文字

### 1.2 判断

- **本文の日時はアプリの `formatPickup` / `formatDateTimeJa` と同じ形にする**。利用者がメールとアプリを見比べたときに同じ文字列になることを優先する
- **`listing_changed` も同じ形にする**（複数日なら「10/14〜10/17」）。複数日の受け取りで時刻だけ変えると本文の期間は変わらないが、アプリの表示も同じなので、メールとアプリの一致を優先する（2026-10-14 決定）
- **SQL に整形関数を 2 つ足して 3 か所で共用する**。個別に `to_char` を書き直すと次にずれる
- イベントの確定通知は「〜 に」ではなく「〜 までに」にする（完了画面 U-12 の「10/24(土) 10:00 までに あけぼの農園 第2畑へ」と同じ言い回し）

### 1.3 変更点

**新しいマイグレーション** `20261015000000_notification_schedule_text.sql`

1. `public.format_datetime_ja(p_ts timestamptz) returns text`（`immutable`）
   - 日本時間で「M/D(曜) H:MI」。例「10/24(土) 10:00」「10/5(月) 9:00」
   - 曜日は `(array['日','月','火','水','木','金','土'])[extract(dow from p_ts at time zone 'Asia/Tokyo')::int + 1]`
   - 数字は `to_char(..., 'FMMM/FMDD')`・`to_char(..., 'FMHH24:MI')`（`FM` で先頭ゼロを落とす。分は 2 桁のまま）
2. `public.format_schedule_ja(p_start timestamptz, p_end timestamptz) returns text`（`immutable`）
   - 同じ日（日本時間）：「10/15(木) 11:00〜13:00」
   - 別の日：「10/14〜10/17」（アプリの `formatPickup` と同じ）
3. `create or replace function public.notify_booking_confirmed()`：本文を次に差し替える
   - 商品：`「{title}」の予約番号は {number} です。{format_schedule_ja(pickup_start, pickup_end)} に {store.name} で番号とお名前をお伝えください。`
   - イベント：`「{title}」の申し込み番号は {number} です。{format_datetime_ja(event_start)} までに {place_name ?? store.name} へお越しください。`
   - 求人：変更なし
4. `create or replace function public.emit_reminders(text)`：本文を次に差し替える
   - 商品：`「{title}」の受け取りは {format_schedule_ja(pickup_start, pickup_end)} です。{store.name} で番号 {number} とお名前をお伝えください。`
   - イベント：`「{title}」は {format_datetime_ja(event_start)} からです。…`
   - 求人：`「{title}」の勤務は {format_datetime_ja(work_start)} からです。`
5. `create or replace function public.listings_guard_update()`：`listing_changed` の本文を `format_schedule_ja(schedule_start, schedule_end)` に差し替える。関数の他の部分（制限チェック・公開終了の延長）は変えない。`create or replace` なのでトリガーの付け直しは不要

`20261012000000_staff.sql`・`20261013000001_notifications.sql` 自体は触らない（適用済みのマイグレーションは書き換えない）。

### 1.4 確認

- ローカル Supabase で `supabase db reset` → ロールバック付き SQL で、同日・複数日の商品と、イベントの予約を 1 件ずつ作り、`notifications.body` が上の形になることを見る（`docs/設計_通知の配信.md` §8 の手順）
- `select format_schedule_ja('2026-10-14 00:00+00','2026-10-17 08:00+00')` → `10/14〜10/17`、`format_schedule_ja('2026-10-15 02:00+00','2026-10-15 04:00+00')` → `10/15(木) 11:00〜13:00`、`format_datetime_ja('2026-10-24 01:00+00')` → `10/24(土) 10:00`
- 関数の `send-notifications` は `body` をそのまま使うので変更なし。`npm run gen:types` は型に影響なし（関数の戻りは text）

### 1.5 設計書の反映

- `docs/設計_通知の配信.md` に「17. 本文の日時表記をアプリと揃える（2026-10-14）」を足し、この文書を指す
- `docs/設計_運営画面.md` §5.2 の SQL 全文は `listings_guard_update()` の本文が古くなる。全文は写し直さず、§5.2 冒頭に「`listing_changed` の本文は `20261015000000` で差し替え（設計_Android動作確認後の修正.md）」と注記する

---

## 2. 掲載入力：エラーになった後は入力のたびに検証し直す

### 2.1 現状と問題

`ListingFormView` は `submit` のときだけ `validateListingForm` を呼んで `errors` state に入れる。入力欄を直しても `errors` は変わらないので、赤枠と赤字が「公開する」をもう一度押すまで残る。上の赤帯「入力内容を確認してください。」も同様。

設計（§4.7）の「『公開する』を押したときだけ必須チェック」は**初回の契機**の話で、「直しても消えない」ことまでは決めていなかった。A-12（`RestrictedEditView`）は毎レンダーで `restrictedErrors` を計算する方式なので、こちらは入力に追従している。

同じ作りが A-02 店舗情報（`(tabs)/store.tsx`）と店舗追加（`new-store.tsx`）にもある。

### 2.2 判断

- **押すまでは検証しない（従来どおり）。一度押してエラーになったら、以後は入力のたびに検証し直す**。直った欄のエラーは消え、全部直れば赤帯も消える
- `errors` を state に持つのをやめ、「最後に押したボタンの条件」を state に持って `useMemo` で導出する。A-12 と同じ「導出」の形に寄せる
- 「公開する」「下書き保存」は押せるまま（無効にしない。設計どおり）
- A-02・店舗追加も同じ方式に揃える（`validateStoreForm` は引数なしなので `checked: boolean` だけ）

### 2.3 変更点

**`src/features/staff/components/ListingFormView.tsx`**

```ts
// before
const [errors, setErrors] = useState<FormErrors>({});
...
const e = validateListingForm(form, kind, { publish });
setErrors(e);

// after
/** 最後に押したボタンの検証条件。押すまでは null（＝検証しない） */
const [checked, setChecked] = useState<{ publish: boolean } | null>(null);
const errors = useMemo<FormErrors>(
  () => (checked ? validateListingForm(form, kind, checked) : {}),
  [form, kind, checked],
);
...
const submit = async (publish: boolean) => {
  const e = validateListingForm(form, kind, { publish });
  setChecked({ publish });
  if (Object.keys(e).length > 0) { setSaveError('入力内容を確認してください。'); scroll; return; }
  ...
};
```

- 赤帯 `saveError` は「入力内容を確認してください。」のときだけ、`errors` が空になったら消す（`useEffect` ではなく描画時に `saveError && Object.keys(errors).length > 0` で出し分ける。保存失敗の赤帯はそのまま）
- 「下書き保存」でタイトルだけ検証した後に「公開する」を押せば `checked` が `{ publish: true }` に変わり、全項目の検証に切り替わる

**`src/app/staff/[storeId]/(tabs)/store.tsx`・`src/app/staff/new-store.tsx`**

- `const [errors, setErrors]` → `const [checked, setChecked] = useState(false)` と `const errors = useMemo(() => (checked ? validateStoreForm(value) : {}), [value, checked])`

### 2.4 テスト

- `__tests__/staffListingForm.test.tsx` に追加：「公開でエラーになった後、タイトルを入れるとタイトルのエラーだけ消える。全部埋めると赤帯も消える」
- 既存「公開は必須が空だと欄の下に理由を出して保存しない」はそのまま通る

### 2.5 設計書の反映

- `docs/設計_運営画面.md` §4.7「入力欄」の「『公開する』を押したときだけ必須チェック」の後ろに「（一度押した後は入力のたびに検証し直し、直った欄のエラーは消す。2026-10-14）」を足す。§4.3 A-02 / 店舗追加も同様に一言

---

## 3. 「予約が N 件」を単位付きの数量で言う

### 3.1 現状と問題

`RestrictedEditView` の注意の見出しは `予約が${l.reservedQuantity}件入っています`。`reservedQuantity` は数量の合計（`listing_availability.reserved_quantity`。§12 判断 7「N は数量の合計」）。1 件 2 袋の予約があると「予約が 2 件」と出て、掲載詳細の「予約 1件　合計 5,600円」と並ぶと矛盾して見える。

### 3.2 判断

- **「件」をやめ、数量を単位付きで言う**。件数（予約の行数）は出さない
  - 件数を出すには `useListingBookings` の結果を待つ必要があり、見出しが「0 件 → 1 件」と変わる。数量は掲載行にあるので同期的に出せる
  - 注意の下の補足「2〜17袋の範囲で減らせます」「予約済みの2袋より少なくはできません」が既に単位付きの数量なので、見出しも合わせるほうが自然
- 判断 7 は残す（残数の計算と合わせて「数量」で数える）。言い方だけ変える

### 3.3 文言

| 種類 | 見出し | 例 |
| --- | --- | --- |
| 商品 | `予約済みが {n}{unit} あります` | 予約済みが 2袋 あります |
| イベント | `申し込み済みが {n}名 います` | 申し込み済みが 3名 います |
| 求人 | `応募が {n}件 あります` | 応募が 1件 あります（求人の `reserved_quantity` は応募 1 件＝1 なので「件」で正しい） |

本文「変更できるのは…だけです。予約者へは変更の通知が届きます。」は変えない。

### 3.4 変更点

- `src/features/staff/components/RestrictedEditView.tsx`：`WarningBox` の `title` を上の文言に。`unit` は既存の `l.kind === 'product' ? l.unit : '名'` を使い、求人だけ分岐
- 文言は `derive.ts` に `restrictedNoticeTitle(l)` として切り出し、テスト対象にする
- `__tests__/staffRestricted.test.tsx:27` の `予約が8件入っています` を `予約済みが 8食 あります` に更新（テストの掲載は商品・単位「食」）

### 3.5 設計書の反映

- `docs/設計_運営画面.md` §4.8 の「**予約が 8 件入っています**」を「**予約済みが 8食 あります**（イベント「申し込み済みが 8名 います」、求人「応募が 8件 あります」。2026-10-14 変更）」に
- §12 判断 7 を「**『予約済み』の数は数量の合計で、単位を付けて言う**（残数の計算と合わせる。「N 件」とは言わない。2026-10-14）」に

---

## 4. スタッフの予約一覧：本日以外は日付ごとに束ねる

### 4.1 現状と問題

A-20 の行の右端は `rowTimeText`（同日「11:00〜13:00」、複数日「〜10/17(土)」）。「本日」のときは件数行に日付（`bookingSummaryLine`）が出るので困らないが、「今後」「過去」「すべて」と番号検索では日付がどこにも出ない。今回は「今後」の 2 件がどちらも 10/15 だったので実害はなかったが、日が分かれると区別できない。

### 4.2 判断

- **「本日」以外（今後・過去・すべて・番号検索中）は、利用者側 U-22 と同じく日付の見出しで束ねる**。行の右端の時刻はそのまま
  - 右端に日付を足す案（「10/15(木) 11:00〜13:00」）は 15/800 で 18 文字になり氏名を圧迫するので採らない
- **「本日」は従来どおり 1 枚のカード**（件数行に日付があり、見出しを足すと二重になる）
- 束ねる日は利用者側の `groupDate` に準じる：商品で受け取り期間中（開始 ≤ 今 ≤ 終了）なら今日、それ以外は開始日（「始まっていれば」にすると「過去」の商品が全部今日に入ってしまうので「期間中」とした）。「過去」は新しい順なので見出しも降順
- 見出しの文字は「10/15(木)」。今日なら「今日」＋小さく「10/14(水)」（U-22 と同じ見た目。`styles.groupHead` 相当を運営側トークンで）

### 4.3 変更点

**`src/features/staff/derive.ts`**

```ts
export type StaffBookingGroup = { key: string; date: Date; isToday: boolean; rows: StaffBookingRow[] };

/** A-20 本日以外の束ね。sortBookings 済みの rows を日付で分ける */
export function groupStaffBookings(rows: readonly StaffBookingRow[], period: Period, now: Date): StaffBookingGroup[]
```

- 束ねる日：商品で `scheduleStart <= now <= scheduleEnd` なら `now`、それ以外は `scheduleStart`
- キーは `jstDayKey`。グループは日付順（過去は新しい順）。グループの中の並びは入力順（`sortBookings` 済み）

**`src/app/staff/[storeId]/(tabs)/bookings.tsx`**

- `period === 'today' && !searching` のときは従来どおり `GroupList` 1 枚
- それ以外は `groupStaffBookings(rows, period, now)` を回し、見出し＋ `GroupList` を日付ごとに描く（`testID="booking-group-<日付キー>"`）。見出しは `adminColors` の文字色、今日はアクセント色

**`src/components/admin/`**：見出しは `bookings.tsx` 内の小さな部品で足りる。共通部品にはしない（A-11 など他で使う予定がない）

### 4.4 テスト

- `features/staff/derive.test.ts`：`groupStaffBookings` の束ね（別日の 2 行が 2 グループ、受け取り期間中の複数日商品は今日に入る、過去の順を保つ）
- `__tests__/staffBookings.test.tsx`：期間を「今後」にすると日付の見出しが出る。「本日」では出ない

### 4.5 設計書の反映

- `docs/設計_運営画面.md` §4.9「グループリスト。行 padding…」の前に「期間が本日以外（と番号検索中）は U-22 と同じ日付の見出しで束ねる。本日は 1 枚（2026-10-14）」を足す

---

## 5. 実装の順序と完了条件

1. #1 SQL（マイグレーション 1 本）→ ローカルで `db reset` と本文の確認
2. #3 文言（小さい）→ テスト更新
3. #2 検証の導出化（3 画面）→ テスト追加
4. #4 束ね（derive ＋ 画面）→ テスト追加
5. `app/` で `npm run typecheck`・`npm run lint`・`npm run format:check`・`npm test`
6. 設計書の反映（§1.5・2.5・3.5・4.5）と `docs/動作確認手順_フェーズ1.md` への追記は不要（手順は変わらない）
7. Android 実機で再確認：期間指定の商品を予約してメール本文、A-10 でわざとエラー → 直す、A-12 の見出し、A-20 の「今後」

完了条件：上の 7 が通り、PR は `fix/android-bugs` ブランチから main へ。

### 実装の記録（2026-10-14）

- 1〜5 は実施済み。`typecheck`・`lint`・`format:check`・`test`（32 suites / 196 tests）すべて通過
- SQL はローカルに `supabase migration up` で適用し、ロールバック付きの SQL で確認：確定「10/14〜10/17 に あけぼの農園 直売所 で…」「10/14(水) 17:00〜19:00 に カフェ あけぼの 駅前店 で…」「10/24(土) 10:00 までに あけぼの農園 第2畑 へお越しください。」、リマインド「受け取りは 10/14〜10/17 です。」、期間変更「受け取り期間が 10/14〜10/18 に変わりました。」
- A-10 の赤帯「入力内容を確認してください。」は `saveError` の文字列で判定して、エラーが残っているときだけ出す（保存失敗の赤帯と区別）
- 7 の実機確認は未実施（次回の動作確認で）

## 6. 今回は直さないと決めたもの

- スタッフ予約一覧で受け取り済みにした直後に古い行が一瞬残る件：`useRefetchOnFocus` と `useStaffMutation` の `invalidateQueries` が入っており、再取得中に前のデータを出す React Query の通常動作と判断。長く残るようなら別途
- イベント詳細の「申し込み締切 10/21(水)」に時刻がない件：商品は「予約締切 10/17(土) 17:00」と時刻付きで、表記が揃っていない。今回の範囲外（別途、利用者側の設計で決める）
