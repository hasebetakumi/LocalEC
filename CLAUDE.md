# CLAUDE.md

## 言語

- 回答、ドキュメント、コミットメッセージは日本語で書く
- プルリクエストのタイトル・本文、GitHub上のコメントも日本語で書く

## 開発

- Expo・React Native の扱いは `AGENTS.md` に従う（パッケージ追加は `npx expo install`、SDK のバージョンに合った公式ドキュメントを参照）
- 作業を終える前に `npm run typecheck`、`npm run lint`、`npm run format:check`、`npm test` を通す
- 要件は `docs/要件定義_フェーズ1.md`、技術構成は `docs/技術選定.md` を正とする
