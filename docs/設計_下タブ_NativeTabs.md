# 設計：利用者側の下タブを NativeTabs にする（試作）

2026-10-13

## 背景

- iOS 26 以降、OS 標準のタブバーは画面の端から離れて浮いたカプセル型（Liquid Glass）になった。LINE など主要アプリも同じ見た目に揃えている
- 今の下タブは JS 実装の `Tabs`（白地＋上線）で、iOS 26 ではやや古く見える
- Expo Router の `NativeTabs` に切り替えると、iOS では OS 標準のタブバーが、Android では Material のタブバーがそのまま使われる

## 方針（きりがなくならないための線引き）

- **見た目は OS 標準に任せる**。アイコンは iOS が SF Symbols、Android が Material Symbols。design/ の線画アイコン（SVG）は NativeTabs に渡せないので、下タブに限って諦める
- アプリ側で指定するのは **アクセント色（`colors.accent`）とラベル文字列だけ**。ラベルのフォント・サイズ・余白は触らない
- Web は **今の JS `Tabs` のまま**。NativeTabs の Web 実装は画面上部に黒いピル（文字のみ・アイコンなし）を出すもので、design/ の画面と合わない。Web は見た目の確認用なので、タブの形が変わらないほうが都合がよい
- 運営画面（`staff/[storeId]/(tabs)`）も同じ分け方にする（2026-10-13 追加）。当初は design 04 の独自タブバー（上端 3px の指示線）を維持する予定だったが、マイページからスタッフメニューに入ると下タブの見た目が変わって運営側だけ古く見えるため、そろえた。Web と PC 幅（左メニュー）は従来どおり

## 構成

- `src/app/(tabs)/_layout.tsx`
  - `Platform.OS === 'web'` → 従来の `Tabs`（`WebTabsLayout`）
  - それ以外 → `NativeTabs`（`expo-router/unstable-native-tabs`。SDK 57 ではこのパスが正。安定版の `expo-router/native-tabs` は SDK 58 以降）
- 各タブのアイコン

  | タブ         | SF Symbols（通常 / 選択）  | Material Symbols      |
  | ------------ | -------------------------- | --------------------- |
  | 商品         | `tag` / `tag.fill`         | `sell`                |
  | イベント・求人 | `megaphone` / `megaphone.fill` | `campaign`        |
  | 予約・申込   | `ticket` / `ticket.fill`   | `confirmation_number` |
  | マイページ   | `person` / `person.fill`   | `person`              |

  運営画面（店舗モード）

  | タブ | SF Symbols（通常 / 選択） | Material Symbols |
  | --- | --- | --- |
  | 掲載 | `list.bullet` / 同じ | `list` |
  | 予約・申し込み | `calendar.badge.checkmark` / 同じ | `event_available` |
  | 店舗情報 | `storefront` / `storefront.fill` | `storefront` |

- 「イベント・求人」は design/ ではカレンダーだったが、求人が表せないのでメガホン（募集・告知）に変更。Web 用に線画 `megaphone` を Icon.tsx に追加し、アプリと Web で同じ絵にした

## 前提の確認（SDK 57 の公式ドキュメント・node_modules で確認済み）

- NativeTabs は Expo Go に含まれる（`Included in Expo Go`）
- Android の `md` アイコンは `expo-symbols` でフォントから画像に変換される（Expo Go 同梱）
- `Icon.src` に React 要素を渡せるのは `VectorIcon` だけで、react-native-svg の要素は渡せない
- iOS 26 の見た目になるのは Xcode 26 以上でビルドしたアプリ。Expo Go は対応済みなので実機でそのまま確認できる

## 確認手順

1. `npm run web` で Web のタブが今までどおりであること
2. 実機の Expo Go（iOS 26）で
   - 下タブが浮いたカプセル型になり、選択タブがアクセント色になる
   - 4 つのラベル（「イベント・求人」「予約・申込」が長め）が欠けずに収まる
   - 各タブの一覧を最後までスクロールし、末尾がタブバーに隠れないこと。隠れる場合は各タブ画面の `ScrollView` / `FlatList` に `contentInsetAdjustmentBehavior="automatic"` を付ける
   - 下にスクロールするとタブバーが縮む（`minimizeBehavior` の既定 `automatic`）。邪魔なら `never` にする
3. お知らせ（`(home)/notices`）など、タブ内のスタックに入っても下タブが残ること
4. マイページ → スタッフメニュー → 店舗を選んだあとの下タブ 3 つも同じ見た目になること。「予約・申し込み」のラベルが欠けないこと、掲載一覧の末尾がタブバーに隠れないこと

## 既知の制約

- `unstable-native-tabs` は名前のとおり試験版。SDK 58 で `expo-router/native-tabs` に移る前提で、import パス以外は変えない
- タブの動的な追加・削除、ネイティブタブの入れ子は非対応（今回は該当なし）
- Android はタブ 5 つまで（今回は 4 つ）
