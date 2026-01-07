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

## 補足: タグの運用ルール (Tagging Rules)

v1.2.0より、タグの衝突を防ぐためにプレフィックス制を導入しました。

*   **文型タグ**: `p:SV`, `p:SVC`, ... (必須)
*   **動詞タグ**: `v:make`, `v:get` ... (動詞図鑑との連携に必須)
*   **ノイズタグ**:
    *   `noise:adv`: 副詞 (adverb)
    *   `noise:pp`: 前置詞句
    *   `noise:np`: 副詞的名詞句
*   **罠タグ**:
    *   `trap:svoc`: SVOCと間違えやすい
    *   `trap:lie`: lie/layの混同 など

## VerbCard オブジェクト (Collection Mode)

動詞図鑑のマスターデータ (`src/data/verbData.ts`) で定義されます。

| プロパティ | 型 | 説明 |
| :--- | :--- | :--- |
| `id` | `string` | 動詞の原形 (例: `give`) |
| `rarity` | `'N' \| 'R' \| 'SR'` | レアリティ |
| `typicalPattern` | `Pattern` | その動詞の最も代表的な文型 |
*   **ノイズタグ**: 文型判定を惑わせる要素
    *   `noise:adv`: 副詞 (adverb)
    *   `noise:pp`: 前置詞句 (prepositional phrase)
    *   `noise:np`: 副詞的名詞句 (noun phrase acting as adverb e.g., "last night")
