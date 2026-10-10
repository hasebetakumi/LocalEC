# データ構造（フェーズ1）

画面（00〜06）から逆算したエンティティ定義。実装の ORM / スキーマの出発点。名前は英語の案、表示名は画面の日本語。

## 1. 親子関係
```
Store（店舗）
 └─ Listing（掲載）… 種類：product / event / job / notice
     └─ Booking（予約・申し込み・応募）… notice には付かない
User（利用者）── Booking
User（staff=true）── StoreStaff ── Store（複数店舗可）
Notification（通知）── User
```

## 2. User（利用者・スタッフ共通）
| 項目 | 型 | 必須 | 備考 |
|---|---|---|---|
| id | uuid | ○ | |
| name | string | ○ | 氏名（姓 名） |
| phone | string | ○ | ハイフンなし保存、表示は 090-1234-5678。SMS 認証なし |
| email | string | ○ | ログイン用（マジックリンク）。一意 |
| pending_email | string | | 変更中の新アドレス。確認リンク押下で email に昇格 |
| notifications_enabled | bool | ○ | 既定 true（U-30） |
| is_staff | bool | ○ | true ならマイページに「スタッフメニュー」 |
| deleted_at | datetime | | 削除時は name/phone/email を消去し「削除済みユーザー」として Booking から参照される |
| agreed_terms_at | datetime | ○ | 規約同意 |

制約：`deleted_at` を立てられるのは status=reserved の Booking が 0 件のときのみ（U-02）。

## 3. Store（店舗）
| 項目 | 型 | 必須 | 備考 |
|---|---|---|---|
| id | uuid | ○ | |
| name | string | ○ | 例：カフェ あけぼの 駅前店 |
| address | string | ○ | |
| phone | string | ○ | U-22 でキャンセル期限後の連絡先として表示 |
| hours_text | text | | 営業時間（自由記述、複数行可） |
| payment_methods | enum[] | ○ | cash / paypay / credit / transit_ic / other（1つ以上） |
| created_at / updated_at | | | |

制約：Listing が 1 件でもある店舗は削除不可。payment_methods 変更時は公開中 product の表示に即反映（保存前に確認）。

## 4. Listing（掲載）
共通項目：
| 項目 | 型 | 必須 | 備考 |
|---|---|---|---|
| id | uuid | ○ | |
| store_id | uuid | ○ | 作成時に固定（店舗モード） |
| kind | enum | ○ | product / event / job / notice |
| title | string | ○ | 全種類 |
| body | text | | 説明・内容（product は任意、notice は必須） |
| photo_url | string | | product / event / job のみ任意。notice は持たない |
| publish_start | datetime | ○ | 公開開始 |
| publish_end | datetime | ○ | 公開終了 |
| status | enum | ○ | draft / scheduled / published / ended（下書き／公開予定／公開／終了）。scheduled・published・ended は publish_start/end と現在時刻から導出可。ended は手動「終了する」でも遷移 |
| created_at / updated_at | | | |

種類別項目（A-10）：

**product（商品）**
| 項目 | 必須 | 備考 |
|---|---|---|
| category | ○ | enum：bento / rice / vegetable / bread / sweets / processed / laundry |
| price | ○ | 円・整数 |
| original_price | | 元値。あれば割引バッジ（半額／◯%OFF）と取り消し線 |
| quantity_total | ○ | 数量 |
| pickup_start / pickup_end | ○ | 受け取り期間（同日なら時間帯表示 11:30〜13:30、複数日なら 10/4〜10/6） |
| booking_deadline | ○ | 予約締切 |
| cancel_deadline | | キャンセル期限（なし＝キャンセル不可） |
| food_label | | 食品表示（自由記述）。既定「店舗にお問い合わせください」 |

**event（イベント）**
| 項目 | 必須 | 備考 |
|---|---|---|
| price_per_person | | 円。0 または空＝無料 |
| capacity | ○ | 定員 |
| max_per_booking | ○ | 1件の人数上限（既定 4） |
| event_start / event_end | ○ | 日時 |
| place_name / place_address | ○ | 場所 |
| application_deadline | ○ | 申し込み締切 |
| cancel_deadline | | |
| conditions | | 参加条件・持ち物 |

**job（求人）**
| 項目 | 必須 | 備考 |
|---|---|---|
| pay_text | ○ | 報酬の表示（例：日給 9,000円／時給 1,100円） |
| pay_amount / pay_unit | | 数値・単位（daily / hourly）。並び替え用 |
| headcount | ○ | 募集人数。到達しても応募は締め切らない |
| work_start / work_end | ○ | 勤務日時（「週2日〜」など文字列が必要なら work_text） |
| place_name / place_address | ○ | |
| application_deadline | ○ | 応募締切 |
| cancel_deadline | | 利用者表記は「応募の取り消し」 |
| conditions | | 条件・仕事内容 |

**notice（お知らせ）**
| 項目 | 必須 | 備考 |
|---|---|---|
| body | ○ | 本文のみ。写真なし。予約を持たない |

### 掲載の派生値（表示用）
- `remaining` = quantity_total − Σ(reserved + completed の quantity)（product）／capacity − Σ(人数)（event）
- `is_sold_out` = remaining ≤ 0（product / event）。job は常に false
- `badge`：original_price があれば「半額」（≥50%）または「◯%OFF」、publish_start から 72h 以内なら「新着」、remaining ≤ 3 なら「残りわずか」、締切まで 24h 以内なら「締切間近」、pickup が当日のみなら「本日限定」
- 一覧の並び：利用者＝新着順（publish_start desc）、運営 A-11＝公開期間の新しい順

## 5. Booking（予約・申し込み・応募）
| 項目 | 型 | 必須 | 備考 |
|---|---|---|---|
| id | uuid | ○ | |
| number | string(4) | ○ | 4桁の採番（§7） |
| listing_id | uuid | ○ | |
| store_id | uuid | ○ | 非正規化（番号検索・A-20 用） |
| user_id | uuid | ○ | 削除済みユーザーも参照を保持 |
| kind | enum | ○ | listing.kind のコピー |
| quantity | int | ○ | product＝食数、event＝人数、job＝1 |
| amount | int | | 合計金額（店頭払い）。job は null |
| status | enum | ○ | reserved / completed / cancelled / expired |
| cancelled_by | enum | | user / staff |
| completed_at / cancelled_at / expired_at | datetime | | |
| created_at | datetime | ○ | |

### 状態名の対応
| status | kind | 利用者表示 | 運営表示 |
|---|---|---|---|
| reserved | product | 予約済み | 未受け取り |
| reserved | event | 申し込み済み | 未参加 |
| reserved | job | 応募済み | 未勤務 |
| completed | product | 受け取り済み | 受け取り済み |
| completed | event | 参加済み | 参加済み |
| completed | job | 勤務済み | 勤務済み |
| cancelled | * | キャンセル | キャンセル |
| expired | * | 期限切れ | 期限切れ |

番号の呼び方：product＝予約番号、event＝申し込み番号、job＝受付番号。

## 6. 状態遷移
```
Listing
  draft ──(公開する & start ≤ now)──▶ published
  draft ──(公開する & start > now)──▶ scheduled ──(start 到来)──▶ published
  published ──(end 到来 | 終了する)──▶ ended
  ended は再公開不可（複製して新規）

Booking
  reserved ──(A-21 受け取り/参加/勤務済みにする)──▶ completed
  completed ──(A-21 未受け取りに戻す)──▶ reserved
  reserved ──(U-21 利用者キャンセル、cancel_deadline 内)──▶ cancelled(by user)
  reserved ──(A-21 スタッフがキャンセルにする)──▶ cancelled(by staff) ＋利用者へ通知
  reserved ──(product: pickup_end 経過 / event・job: 翌日 0:00)──▶ expired
  expired ──(A-21 受け取り済みにする：期限後来店)──▶ completed
```
- cancelled / expired で remaining が戻る。
- 掲載を ended にしても既存 Booking はそのまま（受け取り可能）。
- A-12（予約が入った後の編集）：quantity_total の **減少**（≥ 予約済み数）、pickup 期間、終了のみ可。他項目は読み取り専用。

## 7. 採番ルール（number）
- 数字 4 桁、`0001`〜`9999`。店舗ごと・種類ごとではなく **全体で 1 本の連番**（番号検索が店舗横断のため）。
- 9999 の次は 0001 に戻る。同じ番号が同時に reserved で存在しないことを保証（直近の同番号が completed/cancelled/expired なら再利用可）。
- 衝突時は次の番号へ。採番はトランザクション内で行う。
- 検索は前方一致（「04」→ 04xx）。A-01 は全店舗、A-11 詳細・A-20 は store_id で絞る。

## 8. Notification（通知）
| 種別 | 宛先 | 契機 |
|---|---|---|
| booking_confirmed | 利用者 | Booking 作成 |
| reminder | 利用者 | pickup/event/work の前日 18:00 と当日朝 |
| cancelled_by_staff | 利用者 | status → cancelled(by staff)。定型文、理由なし |
| listing_changed | 利用者 | A-12 で数量・期間を変更 |
| notice_published | 利用者 | notice が published に |
配信はプッシュ＋メール。`notifications_enabled=false` ならプッシュのみ停止（取引通知のメールは送る）。未読は notice のみカウント（U-10 ベル）。

## 9. 固定マスタ
| マスタ | 値 |
|---|---|
| category | bento お弁当 / rice お米 / vegetable 野菜 / bread パン / sweets スイーツ / processed 加工品 / laundry ランドリー |
| payment_method | cash 現金 / paypay PayPay / credit クレジットカード / transit_ic 交通系IC / other その他 |
| listing.kind | product 商品 / event イベント / job 求人 / notice お知らせ |
| listing.status | draft 下書き / scheduled 公開予定 / published 公開 / ended 終了 |
| booking.status | reserved / completed / cancelled / expired |
| 都道府県 | 住所は自由記述（フェーズ1 は埼玉県久喜市のみ想定、選択式にしない） |

## 10. 権限
| 操作 | 利用者 | スタッフ |
|---|---|---|
| 閲覧（一覧・詳細） | ○（未ログイン可） | ○ |
| 予約・申し込み・応募 | ○（ログイン必須） | ○ |
| 自分の Booking のキャンセル | ○（期限内） | — |
| Listing の作成・編集・終了 | — | ○（所属店舗のみ） |
| Booking の状態変更（A-21） | — | ○（所属店舗のみ） |
| 番号検索（全店舗） | — | ○（所属店舗の Booking のみヒット） |
| Store の追加・編集 | — | ○ |
