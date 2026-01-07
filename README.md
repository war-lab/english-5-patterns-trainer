# 英語5文型トレーナー (English 5 Patterns Trainer)

英文を見た瞬間に「第1〜第5文型 (SV, SVC, SVO, SVOO, SVOC)」を判定できるようにする学習アプリケーションです。
タイムアタック形式の反射神経トレーニングと、要素分解による論理的解析トレーニングを組み合わせ、日本人が苦手とする「文型」を直感レベルまで落とし込むことを目指しています。

## 🌟 特徴

*   **Sniper Mode (スナイパーモード)**: 2秒以内に文型を即座に判定する反射トレーニング。
*   **Parse Mode (解析モード)**: 「目的語(O)の数は？」「補語(C)はある？」という順序で要素を選び、論理的に文型を導き出すモード。
*   **Review Priority (重点復習)**: 苦手な文型、特に「混同しやすいペア（例: SVOとSVOC）」を自動的に分析し、優先的に出題するアルゴリズムを搭載。
*   **Detailed Feedback**: 単なる正誤だけでなく、「なぜその文型なのか」「どこが引っかけポイントか」を構造化して解説。
*   **Verb Collection (動詞図鑑)**: 学習した動詞をカードとして収集し、レベルアップさせるゲーミフィケーション要素。動詞ごとの習熟度を可視化。

## 🏗️ フォルダ構成

```
english-5-patterns-trainer/
  src/
    data/         # 問題データ (questions.seed.ts)
    domain/       # 型定義 (types.ts)
    logic/        # アプリケーションロジック
      judge.ts      # 判定ロジック
      scheduler.ts  # 出題アルゴリズム (重み付け抽選)
      stats.ts      # 成績・混同行列計算
    pages/        # 画面コンポーネント (Home, Parseなど)
    storage/      # localStorage管理 (バージョニング対応)
    ui/           # 共通UIコンポーネント (SniperGameなど)
  docs/           # ドキュメント (仕様書、データスキーマ)
  .github/        # GitHub Actions設定 (デプロイフロー)
```

## 🎨 設計思想 (Design Philosophy)

1.  **Direct & Visceral (直感的かつ身体的)**
    *   キーボードショートカット (1-5, Enter, Esc) を完備し、マウス操作なしで高速に周回できる「指で覚える」UIを採用しています。
2.  **Feedback Loop (即時フィードバック)**
    *   回答直後に正誤だけでなく、「S=Cの関係」「Oが2つ」といった簡潔な根拠を表示し、思考の修正を促します。
3.  **Data-Driven Review (データ駆動の復習)**
    *   「なんとなく間違えた」を放置せず、混同行列 (Confusion Matrix) を用いて「SVOとSVOOを間違えやすい」といった傾向を可視化し、アルゴリズムが弱点を重点的に攻撃します。
4.  **Localized & Accessible (日本語準拠)**
    *   日本人の英語学習者に特化し、UIテキストから解説、ドキュメントに至るまで完全日本語化を行っています。

## 🚀 始め方 (Getting Started)

### 開発環境のセットアップ

```bash
npm install
npm run dev
```

### ビルドとデプロイ

GitHub Actionsにより、`main` ブランチへのプッシュ時に自動的に GitHub Pages へデプロイされます。

## 📝 データ拡張

*   `src/data/questions.seed.ts` に問題を追加することで、簡単に出題数を増やせます。
*   データの仕様は `docs/DATA_SCHEMA.md` を参照してください。

## 📜 ライセンス

MIT License
