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
npm start          # 開発サーバー起動。w で Web、QR コードで Expo Go
npm run web        # Web のみ
```

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

## ディレクトリ

| パス | 内容 |
| --- | --- |
| app/ | Expo アプリ本体（package.json はここ。npm コマンドはこの中で実行） |
| app/src/app/ | 画面（Expo Router。ファイル＝ルート） |
| app/src/ | 画面以外のコード（コンポーネント、hooks など。これから追加） |
| app/assets/ | アイコン・画像 |
| docs/ | 提案書、要件定義、見積もり根拠、技術選定 |
| scripts/ | 補助スクリプト（Markdown→PDF 変換） |

## ドキュメント

| ファイル                                      | 内容                                              |
| --------------------------------------------- | ------------------------------------------------- |
| docs/要件定義_フェーズ1.md                    | フェーズ1の要件定義書（スコープ、機能、未決事項） |
| docs/見積もり根拠_フェーズ1.md                | 工数と開発費の根拠（MeiN 内部用）                 |
| docs/見積もり根拠_フェーズ1_アケボノ様向け.md | 見積もり根拠のアケボノ様提示版                    |
| docs/技術選定.md                              | 技術構成と選定理由                                |
| docs/proposal_slides.md                       | 提案書                                            |
