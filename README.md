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

| サービス           | URL                                                     |
| ------------------ | ------------------------------------------------------- |
| API                | http://localhost:58321                                  |
| DB                 | postgresql://postgres:postgres@localhost:58322/postgres |
| Studio（管理画面） | http://localhost:58323                                  |

接続先は `app/.env` で指定する。`app/.env.example` をコピーし、`npm run supabase:status` の publishable key を入れる。

### メール（Resend）

ログインのメールも通知のメールも、ローカルから Resend で本物の受信箱に送る。設定は `app/supabase/.env` の 1 か所（`app/supabase/.env.example` をコピー）で、`SMTP_PASS` に Resend の API キーを入れる。

- 送信元のドメインを認証するまでは、`onboarding@resend.dev` から Resend に登録したアドレス（`t-hasebe@meincoltd.com`）にしか送れない。ほかのアドレスでログインしようとするとメールの送信に失敗する
- 通知メールの「予約・申込を見る」ボタンの先は `APP_WEB_URL`（ローカルは `http://localhost:8081`）。空ならボタンを出さない。変えたら `npm run functions` を起動し直す
- 無料プランは 1 日 100 通・月 3,000 通。ログインを何度も試すとすぐ使い切るので注意スマホの Expo Go から接続するときは URL を `localhost` ではなく PC の IP アドレスにする。

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
画面ごとの確認項目を上から順に実行するチェックリストは [docs/動作確認手順_フェーズ1.md](docs/動作確認手順_フェーズ1.md)。

### 初回だけ（2026-10-14 実施済み。やり直すときの記録）

1. Resend でドメイン `dev.localec.meincoltd.com` を認証し、Supabase でプロジェクトを作る（ダッシュボード。手順は設計書 6.1）。`supabase/.env` の `MAIL_FROM*` を認証済みドメインのアドレスにする
2. `app/.env.production.example` を `app/.env.production` にコピーし、ホスト版の URL と publishable key を入れる
3. ホスト版にスキーマ・データ・関数・設定を入れる

   ```bash
   npx supabase link --project-ref <ref>
   npx supabase db push --linked --include-seed         # マイグレーション＋シード（新規プロジェクトのとき。初期化し直すなら db reset --linked）
   npx supabase seed buckets --linked                   # 掲載の写真
   npx supabase functions deploy send-notifications
   npx supabase secrets set --env-file <CRON_SECRET・SMTP_*・MAIL_FROM* だけを抜き出したファイル>   # SUPABASE_* や APP_WEB_URL は入れない
   npx supabase config push                             # 認証の設定・メールのテンプレート・SMTP
   ```

4. Studio の SQL Editor で Vault の 3 つを本番の値に上書きする（シードはローカル用の値を入れる）

   ```sql
   select vault.update_secret(id, 'https://<ref>.supabase.co/functions/v1') from vault.secrets where name = 'functions_url';
   select vault.update_secret(id, '<publishable key>') from vault.secrets where name = 'publishable_key';
   select vault.update_secret(id, '<supabase/.env の CRON_SECRET>') from vault.secrets where name = 'cron_secret';
   ```

5. Web 版を出す（`npm run deploy:web`）。固定 URL は別名 `preview` の `https://localec--preview.expo.app`。この URL を `supabase/config.toml` の `[remotes.demo.auth]`（ホスト版だけに効く上書き。ローカルの `[auth]` は localhost のまま）に入れて `npx supabase config push` し直し、`npx supabase secrets set APP_WEB_URL=<URL>` で通知メールのリンク先にも入れる

### 公開・更新

```bash
npm run deploy:web   # Web 版：expo export → eas deploy --alias preview。URL は https://localec--preview.expo.app で固定
npm run deploy:app   # Expo Go 版：eas update --channel preview
```

`develop` に取り込んだら両方をやり直す。どちらも `app/.env.production` を読む（`eas update` は `--environment` を付けると `.env.production` を読まなくなるので、スクリプトで値を渡している）。

### Expo Go で開く

- 自分の端末の Expo Go（meincoltd でログイン済み）で、`eas update` の出力にある URL か、EAS ダッシュボードの Updates の QR を開く
- **Android の Expo Go 57.0.9 では開けない**（Expo Go 側のバグ。設計書 2.1 の 7）。Android は Web 版 https://localec--preview.expo.app で見せる
- ストア版の Expo Go は最新 SDK しか動かせないので、両端末で Expo Go の自動更新を止めておく。Android に SDK 57 対応の Expo Go を入れるなら https://expo.dev/go の APK
- `runtimeVersion` は `sdkVersion` ポリシーにしてある。Expo Go は SDK ごとのランタイム（`exposdk:57.0.0`）しか読まないため。開発ビルドに移るときに `appVersion` か `fingerprint` に替える
- Android の Expo Go と Web ではプッシュは届かない。iOS の Expo Go では届く

### 注意

- Supabase Free は 7 日間アクセスがないと停止する。見せる前日にダッシュボードで起こす
- データを初期状態に戻すのは `npx supabase db reset --linked`。終わったら 4 の Vault の上書きをもう一度やる
- `supabase/config.toml` や `supabase/.env` を変えたら、ホスト版にも `config push`・`secrets set` で反映する

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
| docs/動作確認手順_フェーズ1.md                | ローカルで全体を確かめるチェックリスト            |
| docs/設計_デプロイ.md                         | デモ環境の公開方針と分担                          |
| docs/proposal_slides.md                       | 提案書                                            |
