# 開発ガイドライン (Development Guidelines)

コードの品質を維持し、ビルドエラーを防ぐために、以下のルールを遵守してください。

## 必須チェック (Mandatory Checks)

コミットやプルリクエストを作成する前に、必ず以下のコマンドを実行し、エラーがないことを確認してください。

```bash
# TypeScriptの型チェックとビルド確認
npm run build 

# リンターによる静的解析 (未使用変数、import順序などをチェック)
npm run lint 
```

### よくあるエラーと対策

1.  **Duplicate Identifier (TS1117)**:
    *   `verbData.ts` などのオブジェクト定義で、同じキー (ID) を複数回定義してはいけません。
    *   重複が見つかった場合は、どちらか一方を削除するか、統合してください。

2.  **Unused Variables (TS6196 / no-unused-vars)**:
    *   宣言したのに使用していない変数やimportは削除してください。
    *   将来使う予定がある場合は、一時的にコメントアウトするか、`// eslint-disable-next-line` 等で明示的に抑制してください（推奨はされません）。

3.  **Type-Only Imports**:
    *   `interface` や `type` を import する際は、必ず `import type { ... }` を使用してください。
    *   Vite (esbuild) のトランスパイル時にランタイムエラーになる可能性があります。

---
**Note**: CI環境でもこれらのチェックが実行され、エラーがある場合はマージがブロックされます。
