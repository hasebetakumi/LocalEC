# CLAUDE.md

## 言語

- 回答、ドキュメント、コミットメッセージは日本語で書く
- プルリクエストのタイトル・本文、GitHub上のコメントも日本語で書く

## 構成

- `app/`：Expo アプリ本体。npm コマンドはこの中で実行する
- `docs/`：提案書、要件定義、見積もり根拠、技術選定
- `scripts/`：補助スクリプト

## 開発

- Expo・React Native の扱いは `app/AGENTS.md` に従う（パッケージ追加は `npx expo install`、SDK のバージョンに合った公式ドキュメントを参照）
- 作業を終える前に `app/` で `npm run typecheck`、`npm run lint`、`npm run format:check`、`npm test` を通す
- 要件は `docs/要件定義_フェーズ1.md`、技術構成は `docs/技術選定.md` を正とする
