# LocalEC

地域の商品・お得情報・イベント・求人・お知らせをアプリで届け、予約して店舗で受け取ってもらう地域ECアプリ。
アケボノ様のフェーズ1を MeiN が開発する。

## 技術構成

Expo（React Native）+ TypeScript + Supabase。1コードで iOS・Android・Web と運営向け管理画面を提供する。
詳細は [docs/技術選定.md](docs/技術選定.md)。

## 開発環境

- Node.js 22（`app/.nvmrc` 参照）、npm
- スマホでの確認は [Expo Go](https://expo.dev/go)。PC と同じ Wi-Fi に接続する
- npm コマンドはすべて `app/` の中で実行する

```bash
cd app
npm install
npm start          # Supabase（Docker）と Expo をまとめて起動。w で Web、QR コードで Expo Go
npm stop           # Supabase を停止（データは保持）
```

Supabase だけ、Expo だけを動かしたいときは次を使う。

```bash
npx supabase start     # Supabase のみ。初回はイメージ取得で数分かかる
npm run start:app      # Expo のみ（Supabase を使わない作業向け）
npm run web            # Expo の Web のみ
npm run supabase:status  # URL と publishable key を表示
npm run functions      # 通知を送る Edge Function（Supabase の起動後に別の端末で）
npm run db:reset       # DB を作り直してシードを入れ直す（データは消える）
npm run gen:types      # DB の型（src/lib/database.types.ts）を作り直す。マイグレーションを足したら実行
```

### Supabase（ローカル）

Docker を起動しておく。他案件と重ならないよう、ポートは 58320 番台にしている（`app/supabase/config.toml`）。

| サービス                              | URL                                                     |
| ------------------------------------- | ------------------------------------------------------- |
| API                                   | http://localhost:58321                                  |
| DB                                    | postgresql://postgres:postgres@localhost:58322/postgres |
| Studio（管理画面）                    | http://localhost:58323                                  |
| メール確認（Mailpit）                 | http://localhost:58324                                  |
| Mailpit の SMTP（通知メールの送信先） | localhost:58325                                         |

接続先は `app/.env` で指定する。`app/.env.example` をコピーし、`npm run supabase:status` の publishable key を入れる。スマホの Expo Go から接続するときは URL を `localhost` ではなく PC の IP アドレスにする。

### 品質チェック

CI（GitHub Actions）でも同じものを実行する。

```bash
npm run typecheck     # 型チェック
npm run lint          # ESLint
npm run format:check  # Prettier
npm test              # Jest
```

### WSL2 で Expo Go がつながらないとき

Windows のファイアウォールで 8081 番ポートを許可するか、`npx expo start --tunnel` で起動する。

## 動作確認の手順

ローカルで利用者画面・運営画面・通知の配信を一通り確かめる手順。コマンドはすべて `app/` の中で実行する。

### 初回だけ

```bash
cd app
npm install
cp .env.example .env                                     # アプリの接続先
cp supabase/functions/.env.example supabase/functions/.env  # 通知を送る関数の設定（そのままで動く）
npx supabase start                                       # 初回はイメージ取得で数分かかる
npm run supabase:status                                  # 表示された publishable key を .env に入れる
npm run db:reset                                         # テーブルとシード（店舗・掲載・確認用アカウント）を入れる
```

### 毎回の起動

Docker を先に起動しておく。

```bash
npx supabase start     # DB・認証・Studio・Mailpit。バックグラウンドで動き続ける（起動済みなら不要）
npm run functions      # 端末 A：通知を送る Edge Function（動かしたままにする）
npm run web            # 端末 B：アプリ（http://localhost:8081）。スマホで見るなら npm run start:app
```

`npm run functions` を止めていると通知は送られず、次に起動したときにまとめて送られる。

長時間動かして開発サーバーが落ちるときは、端末 B を `NODE_OPTIONS=--max-old-space-size=4096 npm run web` で起動する。

### ログイン

パスワードはない。ログイン画面でメールアドレスを入れ、Mailpit（http://localhost:58324 ）に届いたメールのリンクを押す。リンクは 15 分有効。
シードに確認用のアカウントがある。新しいアドレスで新規登録してもよい。

| アカウント              | 用途                                                                                                       |
| ----------------------- | ---------------------------------------------------------------------------------------------------------- |
| `staff@example.com`     | 運営（3 店舗すべてに所属）。ログイン後、マイページの「スタッフメニュー」または http://localhost:8081/staff |
| `seed-user@example.com` | 利用者（売り切れの表示確認用に予約を 1 件持つ）                                                            |

### 確認の流れ（例）

1. **利用者**：ホーム → 詳細 → 予約。数秒で Mailpit に「【LocalEC】予約が完了しました」が届く
2. **運営**：`staff@example.com` でログイン → 店舗を選ぶ → 予約タブに今の予約が出る → 受け取り済みにする／キャンセルにする（キャンセルは利用者にメールが届く）
3. **掲載**：運営の掲載タブ → 右上の「＋ 掲載」で掲載を作って公開 → 利用者のホームに出る
4. **PC 幅の運営画面**：ブラウザの幅を 960px 以上にすると、黒いヘッダーと左メニューの表示になる

Web とシミュレータではプッシュ通知は届かない。メールで届くことを確認する。

### 通知の配信を直接確かめる

Studio（http://localhost:58323 ）の SQL Editor で実行する。

```sql
select public.emit_reminders('same_day');          -- 今日の受け取りのリマインドを作る（Mailpit に届く）
select public.emit_publish_notifications();        -- 公開になった掲載の新着通知を作る（プッシュのみ）
select public.invoke_send_notifications();         -- 定期実行（毎分）を待たずに送る
select kind, title, push_error, email_sent_at, attempts
  from public.notifications order by created_at desc limit 10;   -- 送った結果
select * from net._http_response order by id desc limit 5;      -- 関数の応答
```

`push_error` が `done` なのは「プッシュは送らないで確定」（通知オフ・端末なし）。ローカルには本物の端末がないので、プッシュは常にこうなる。

### スマホ（Expo Go）で確かめる

- PC とスマホを同じ Wi-Fi につなぎ、`app/.env` の `EXPO_PUBLIC_SUPABASE_URL` を PC の IP アドレス（`http://192.168.x.x:58321`）にしてアプリ（端末 B）を起動し直す
- Windows（WSL2）では、ファイアウォールで 8081（Expo）と 58321（Supabase）を許可する。Wi-Fi が「パブリック」扱いだと許可ルールが効かないことがある
- ログインのメールは PC の Mailpit に届く。スマホのブラウザで Mailpit（`http://<PC の IP>:58324`）を開いてリンクを押す（58324 の許可も要る）。リンクからアプリに戻る動きは、実機ではまだ確かめていない
- プッシュ通知は iOS の Expo Go なら許可ダイアログと端末の登録まで確かめられる。Android の Expo Go ではプッシュが使えない（SDK 53 以降）。実際の受信は開発ビルド（`eas build --profile development`）で確かめる

### 止める・やり直す

```bash
npm stop             # Supabase を止める（データは残る）
npm run db:reset     # データを初期状態に戻す（予約・通知・追加した掲載は消える）
```

- `supabase/config.toml` を変えたら `npx supabase stop && npx supabase start` で反映する
- 通知メールが届かないときは、`npm run functions` が動いているか、`supabase/functions/.env` があるかを確かめる

## ディレクトリ

| パス          | 内容                                                                            |
| ------------- | ------------------------------------------------------------------------------- |
| app/          | Expo アプリ本体（package.json はここ。npm コマンドはこの中で実行）              |
| app/src/app/  | 画面（Expo Router。ファイル＝ルート）                                           |
| app/src/      | 画面以外のコード（components・features・lib・theme など）                       |
| app/supabase/ | ローカル Supabase の設定、マイグレーション、シード、Edge Function（通知の送信） |
| app/assets/   | アイコン・画像                                                                  |
| docs/         | 提案書、要件定義、見積もり根拠、技術選定、実装設計（`設計_*.md`）               |
| design/       | 画面設計（HTML プロトタイプ・データモデル。参照用）                             |
| scripts/      | 補助スクリプト（Markdown→PDF 変換）                                             |

## ドキュメント

| ファイル                                      | 内容                                              |
| --------------------------------------------- | ------------------------------------------------- |
| docs/要件定義_フェーズ1.md                    | フェーズ1の要件定義書（スコープ、機能、未決事項） |
| docs/見積もり根拠_フェーズ1.md                | 工数と開発費の根拠（MeiN 内部用）                 |
| docs/見積もり根拠_フェーズ1_アケボノ様向け.md | 見積もり根拠のアケボノ様提示版                    |
| docs/技術選定.md                              | 技術構成と選定理由                                |
| docs/proposal_slides.md                       | 提案書                                            |
