# English 5 Patterns Trainer

英文を見た瞬間に「第1〜第5文型」を判定できるようにする学習アプリ。
タイムアタック（瞬間判定）と、S/V/O/C分解モードで反射を作る。

## Features (MVP)
- **Sniper**: 2秒以内に第1〜第5文型をタップ回答
- **Parse**: V→O→C の順に要素を選んで文型判定
- **Review**: 間違えた/混同したパターンを優先出題
- **Stats**: 文型別正答率、平均反応時間、混同ペア可視化

## Tech
- React (Vite)
- TypeScript
- localStorage (No Backend)

## Getting Started
```bash
npm install
npm run dev
```

## Data
* `src/data/questions.seed.ts` を編集して問題を増やす
* schema: `docs/DATA_SCHEMA.md`

## Roadmap
* Vカード（動詞図鑑）
* 実文ソース対応（ニュース/会話）
* クラウド同期（任意）

## License
MIT
