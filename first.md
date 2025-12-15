ここでは **React Native + Expo + TypeScript** を前提にする（あなたの既存スキル資産的に最速でMVPが出る）。別スタックでも、README/データ仕様/運用テンプレはそのまま流用できる。

---

## 0) リポ名・説明（決め打ち案）

* repo: `english-5-patterns-trainer`

---

## 1) まず作るべきディレクトリ構成（MVP）

```
english-5-patterns-trainer/
  app/                      # 画面（expo-router想定）
    (tabs)/
      index.tsx             # Home
      sniper.tsx            # 瞬間判定
      parse.tsx             # 分解
      review.tsx            # 弱点復習
      settings.tsx          # 設定
  src/
    domain/
      pattern.ts            # 文型定義（1..5）と表示ラベル
      question.ts           # Question型
      answer.ts             # UserAnswer型
    data/
      questions.seed.json   # 初期問題データ（50-100問へ増やす）
    logic/
      judge.ts              # 文型判定（データの正解を採用。将来解析は補助）
      scheduler.ts          # 出題重み付け（弱点優先）
      stats.ts              # 集計
    storage/
      store.ts              # 永続化（AsyncStorageなど）
    ui/
      components/           # ボタン、タイマー、結果カード
  docs/
    SPEC.md                 # 仕様（あなたがさっき欲しがったやつの正式版）
    DATA_SCHEMA.md          # 問題データ仕様
  .github/
    workflows/ci.yml
    ISSUE_TEMPLATE/
      bug_report.md
      feature_request.md
    PULL_REQUEST_TEMPLATE.md
  README.md
  LICENSE
```

---

## 2) README.md（コピペ用テンプレ）

````md
# English 5 Patterns Trainer

英文を見た瞬間に「第1〜第5文型」を判定できるようにする学習アプリ。
タイムアタック（瞬間判定）と、S/V/O/C分解モードで反射を作る。

## Features (MVP)
- Sniper: 2秒以内に第1〜第5文型をタップ回答
- Parse: V→O→C の順に要素を選んで文型判定
- Review: 間違えた/混同したパターンを優先出題
- Stats: 文型別正答率、平均反応時間、混同ペア可視化

## Tech
- Expo (React Native)
- TypeScript

## Getting Started
```bash
npm i
npm run start
````

## Data

* `src/data/questions.seed.json` を編集して問題を増やす
* schema: `docs/DATA_SCHEMA.md`

## Roadmap

* Vカード（動詞図鑑）
* 実文ソース対応（ニュース/会話）
* クラウド同期（任意）

## License

MIT

````

---

## 3) docs/SPEC.md（最低限の仕様書：コピペ用）
```md
# SPEC (MVP)

## Goal
英文を「構造で」見分け、第1〜第5文型を即答できるようにする。

## Patterns
1: SV
2: SVC
3: SVO
4: SVOO
5: SVOC

※M(修飾語)は判定に含めない。

## Modes
### Sniper
- 1問表示 → 第1〜第5をタップ
- デフォルト制限: 2.0s
- 正誤 + ワンライン解説（0.8s表示）

### Parse
- 英文を表示
- ステップ: 動詞(V)選択 → 目的語(O)選択（0〜2）→ 補語(C)選択（0〜1）
- 入力から文型を確定し、正誤表示

### Review
- 直近誤答、混同ペア（例: 4↔5, 2↔3）を優先出題

## Stats
- 正答率、平均回答時間
- 文型別正答率
- 混同マトリクス（どれとどれを間違えたか）

## Non-Functional
- 端末内保存（ログ/設定）
- オフライン動作（種データ同梱）
````

---

## 4) docs/DATA_SCHEMA.md（問題データの仕様）

```md
# Question Data Schema

## Question
- id: string
- sentence: string
- level: 1..5
- correctPattern: 1..5
- explanationShort: string  # 20〜40文字
- tags: string[]            # ["SVOO","give","noise:pp"] 等

### Optional (future)
- answerKey:
  - verbSpan: [start,end]
  - objectSpans: [[start,end], ...]
  - complementSpans: [[start,end], ...]
```

---

## 5) `src/data/questions.seed.json`（サンプル10問）

```json
[
  {
    "id": "q0001",
    "sentence": "Birds fly.",
    "level": 1,
    "correctPattern": 1,
    "explanationShort": "OもCもない → SV",
    "tags": ["SV"]
  },
  {
    "id": "q0002",
    "sentence": "She is tired.",
    "level": 1,
    "correctPattern": 2,
    "explanationShort": "be動詞 + 補語(C) → SVC",
    "tags": ["SVC", "be"]
  },
  {
    "id": "q0003",
    "sentence": "I like coffee.",
    "level": 1,
    "correctPattern": 3,
    "explanationShort": "目的語が1つ → SVO",
    "tags": ["SVO"]
  },
  {
    "id": "q0004",
    "sentence": "He gave me a book.",
    "level": 2,
    "correctPattern": 4,
    "explanationShort": "目的語が2つ → SVOO",
    "tags": ["SVOO", "give"]
  },
  {
    "id": "q0005",
    "sentence": "They made him angry.",
    "level": 2,
    "correctPattern": 5,
    "explanationShort": "Oの後ろが補語(C) → SVOC",
    "tags": ["SVOC", "make"]
  },
  {
    "id": "q0006",
    "sentence": "He looked at the picture.",
    "level": 3,
    "correctPattern": 1,
    "explanationShort": "at以下は修飾語(M)扱い → SV",
    "tags": ["SV", "noise:pp"]
  },
  {
    "id": "q0007",
    "sentence": "She became a doctor.",
    "level": 2,
    "correctPattern": 2,
    "explanationShort": "becomeは補語(C)を取る → SVC",
    "tags": ["SVC", "become"]
  },
  {
    "id": "q0008",
    "sentence": "We found the room clean.",
    "level": 4,
    "correctPattern": 5,
    "explanationShort": "O + 形容詞(C) → SVOC",
    "tags": ["SVOC", "find"]
  },
  {
    "id": "q0009",
    "sentence": "Please show us the way.",
    "level": 3,
    "correctPattern": 4,
    "explanationShort": "us と the way の2目的語 → SVOO",
    "tags": ["SVOO", "show"]
  },
  {
    "id": "q0010",
    "sentence": "The meeting lasted two hours.",
    "level": 4,
    "correctPattern": 1,
    "explanationShort": "two hoursは目的語ではなく補足(M) → SV",
    "tags": ["SV", "noise:np"]
  }
]
```

---

## 6) GitHub運用テンプレ（入れとけ）

### .github/PULL_REQUEST_TEMPLATE.md

```md
## What
- 

## Why
- 

## How
- 

## Checklist
- [ ] Lint passes
- [ ] Tests added/updated (if logic change)
- [ ] Spec/Docs updated (if behavior change)
```

### .github/ISSUE_TEMPLATE/bug_report.md

```md
---
name: Bug report
about: Report a bug
---

## Summary
-

## Steps to reproduce
1.
2.
3.

## Expected
-

## Actual
-

## Environment
- OS:
- App version/commit:
```

### .github/ISSUE_TEMPLATE/feature_request.md

```md
---
name: Feature request
about: Suggest an idea
---

## Problem
-

## Proposal
-

## Acceptance criteria
-
```

### .github/workflows/ci.yml（最小CI）

```yml
name: CI
on:
  pull_request:
  push:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run lint --if-present
      - run: npm test --if-present
      - run: npm run typecheck --if-present
```
コミット運用ルール
作業が1区切りつく毎にコミット
コミットメッセージをプレフィックス付きの日本語で作成する