# 問題データスキーマ (Question Data Schema)

アプリケーションで使用される問題データ (`Question` 型) の定義です。

## Question オブジェクト

| プロパティ名 | 型 | 説明 |
| :--- | :--- | :--- |
| `id` | `string` | 一意のID (例: `q0001`) |
| `sentence` | `string` | 出題される英文 |
| `level` | `number` | 難易度 (1:簡単 〜 5:難しい) |
| `correctPattern` | `1 \| 2 \| 3 \| 4 \| 5` | 正解の文型 (SV, SVC, SVO, SVOO, SVOC) |
| `explanation` | `object` | 解説オブジェクト |
| `explanation.overall` | `string` | 文型判定の根拠 (例: "S=Cの関係なのでSVC") |
| `explanation.trap` | `string` (optional) | 間違えやすいポイントや引っかけ (例: "副詞はOにならない") |
| `tags` | `string[]` | タグ (例: `["SVO", "make", "noise:adv"]`) |

## 補足: タグの運用ルール

*   **文型タグ**: `SV`, `SVC`, ... (必須)
*   **動詞タグ**: `make`, `get`, `find` ... (重要動詞はタグ付け推奨)
*   **ノイズタグ**: 文型判定を惑わせる要素
    *   `noise:adv`: 副詞 (adverb)
    *   `noise:pp`: 前置詞句 (prepositional phrase)
    *   `noise:np`: 副詞的名詞句 (noun phrase acting as adverb e.g., "last night")
