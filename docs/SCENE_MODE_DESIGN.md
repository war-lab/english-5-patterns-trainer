# 「何が起きてる？」一文一判定トレーニング（Scene Mode）設計書

## 1. 概要

### 1.1 モード名
- **表示名**: SCENE MODE
- **サブタイトル**: 意味で見抜け
- **ルート**: `/scene`
- **内部名**: `scene`

### 1.2 目的
現在のアプリでは「文型ラベルを当てる」ことがゴールになっているが、本来の思考順序は：

```
意味理解（何が起きてる？） → 構造認識（だからこの文型） → ラベル付け（SVO等）
```

このモードは **意味理解 → 構造認識** の順を強制し、文型判定を「暗記」ではなく「理解」に昇華させる。

### 1.3 既存モードとの関係

| モード | 鍛える力 | 本モードとの違い |
|--------|---------|----------------|
| Sniper | 反射速度（ラベル即答） | 意味を飛ばしてラベル直行 |
| Parse | 構造分析（O数・C有無） | 文法用語ベースの分析 |
| Review | 弱点克服（反復） | 出題選択の違いのみ |
| Verb Focus | 動詞の多面性理解 | 動詞限定で文全体でない |
| **Scene** | **意味→構造の思考回路** | **日本語的意味理解が起点** |

---

## 2. 学習コンセプト

### 2.1 意味カテゴリ（Scene Type）

5つの「場面カテゴリ」を定義する。これらは文型ラベルではなく、**日本語で意味的に何が起きているか**を表す。

| SceneType | カテゴリ名 | 説明文（UI表示） | 対応文型 |
|-----------|-----------|----------------|---------|
| `action` | 動作・存在だけ | 主語が動いている／いるだけ。必須の対象なし | SV (1) |
| `state` | 主語の状態・性質 | 主語がどんな状態か、何者かを表している | SVC (2) |
| `affect` | 対象への働きかけ | 主語が何かに対して作用している | SVO (3) |
| `transfer` | 受け渡し・授与 | 誰かに何かを渡している／与えている | SVOO (4) |
| `transform` | 対象をどうする／どう見る | 対象を変える・保つ・そう認識する | SVOC (5) |

**`action` の補足**: 「対象なし」ではなく「必須の対象なし」としている。
副詞・前置詞句（修飾語M）は存在してよいが、動詞が必ず取る目的語は存在しない。

**`transform` の補足**: SVOCには以下の多様なパターンが含まれる:
- **状態変化**: make him angry（怒らせた）
- **状態維持**: keep the room clean（きれいに保つ）
- **認識・判断**: find the book useful（役に立つとわかった）
- **名付け・呼称**: call him a genius（天才と呼ぶ）
- **知覚**: see her dancing（踊っているのを見た）

いずれも「対象に対して、何らかの状態・評価・結果を伴う」点で共通する。
カテゴリ名を「対象の状態を操作」ではなく **「対象をどうする／どう見る」** としたのは、
変化させるだけでなく、維持する・認識する・名付けるケースもカバーするため。

### 2.2 思考フロー（ユーザー体験）

**正解ルート**:
```
[英文表示] She became a doctor.
    ↓
[SCAN] 何が起きてる？
    → 「状態・性質」を選択 ✅
    ↓
[LOCK ON] 自動導出
    → == 状態・性質 → SVC （選択不要、演出表示のみ）
    ↓
[PERFECT] 解説 + sceneDescription
```

**不正解ルート**:
```
[英文表示] She became a doctor.
    ↓
[SCAN] 何が起きてる？
    → 「対象に作用」を選択 ✗
    ↓
[RECOVER] 文型だけでも当てろ
    → SVC を選択 ✅
    ↓
[PARTIAL] 意味のズレを強調 + 正解の意味を表示
```

意味カテゴリが正しければ文型は一意に決まるため、**Step 1 が本番、Step 2 は自動導出**。
不正解時のみ文型選択をリカバリーチャンスとして提示する。

### 2.3 なぜ意味カテゴリ→文型が1:1でも教育的に有効か

「意味カテゴリを選んだ時点で文型が決まる」のは欠陥ではなく、**それが学習目標そのもの**である。

- **現状の問題**: 学習者は文型名を暗記するが、英文を見たとき「何が起きてるか」を言語化できない
- **本モードの効果**: 「意味→構造」の回路が自動化され、初見の英文でも構造が見える
- **設計意図**: Step 1 を正しく選べれば文型は自動導出される。しかし Step 1 が難しい

---

## 3. データモデルの変更

### 3.1 Question型の拡張

```typescript
// src/domain/types.ts に追加

/** 意味カテゴリ（場面タイプ） */
export type SceneType = 'action' | 'state' | 'affect' | 'transfer' | 'transform';

export interface Question {
  id: string;
  sentence: string;
  level: number;
  correctPattern: Pattern;
  explanation: {
    overall: string;
    trap?: string;
  };
  tags: string[];

  // === 新規フィールド ===
  /** Scene Mode用: この文で「何が起きているか」の日本語描写 */
  sceneDescription?: string;
}
```

### 3.2 SceneType マッピング（自動導出）

SceneTypeはPatternから一意に決まるため、**データに持たせず関数で導出する**。

```typescript
// src/domain/constants.ts に追加

export const SCENE_TYPE_MAP: Record<Pattern, SceneType> = {
  1: 'action',
  2: 'state',
  3: 'affect',
  4: 'transfer',
  5: 'transform',
};

export const SCENE_LABELS: Record<SceneType, { short: string; full: string }> = {
  action:    { short: '動作だけ',       full: '主語が動いている／いるだけ。必須の対象なし' },
  state:     { short: '状態・性質',     full: '主語がどんな状態か、何者かを表している' },
  affect:    { short: '対象に作用',     full: '主語が何かに対して作用している' },
  transfer:  { short: '渡す・与える',   full: '誰かに何かを渡している／与えている' },
  transform: { short: '対象をどうする', full: '対象を変える・保つ・そう認識する' },
};
// short: スキャンカードに表示（反復時の視認速度優先）
// full: ホバー/長押し/初回チュートリアルで表示

/** SceneType → Pattern の逆引き */
export const SCENE_TO_PATTERN: Record<SceneType, Pattern> = {
  action: 1,
  state: 2,
  affect: 3,
  transfer: 4,
  transform: 5,
};
```

### 3.3 sceneDescription データ例

既存の `questions.seed.ts` に `sceneDescription` フィールドを追加する。
全問に追加するのが理想だが、初期リリースではLevel 1〜3の問題を優先する。

```typescript
// 追加例
{
  id: "q0001", sentence: "Birds fly.", level: 1, correctPattern: 1,
  explanation: { overall: "OもCもない → SV" }, tags: ["p:SV"],
  sceneDescription: "鳥が空を飛んでいる。ただの動作"
},
{
  id: "q0030", sentence: "He looks happy.", level: 1, correctPattern: 2,
  explanation: { overall: "S=Cの関係(look) → SVC" }, tags: ["p:SVC", "v:look"],
  sceneDescription: "彼の様子・印象を描写している"
},
{
  id: "q0049", sentence: "She opened the window.", level: 1, correctPattern: 3,
  explanation: { overall: "目的語(O)が1つ → SVO" }, tags: ["p:SVO"],
  sceneDescription: "窓という対象に『開ける』という行為が向かった"
},
{
  id: "q0004", sentence: "He gave me a book.", level: 2, correctPattern: 4,
  explanation: { overall: "目的語が2つ → SVOO" }, tags: ["p:SVOO", "v:give"],
  sceneDescription: "本を私に渡している（受け渡しの場面）"
},
{
  id: "q0005", sentence: "They made him angry.", level: 2, correctPattern: 5,
  explanation: { overall: "Oの後ろが補語(C) → SVOC" }, tags: ["p:SVOC", "v:make"],
  sceneDescription: "彼を怒った状態にした（対象の状態が変わった）"
},
```

### 3.4 sceneDescription が未定義の問題の扱い

- `sceneDescription` がない問題はScene Modeの出題対象から**除外する**
- フィルタ関数でガード: `questions.filter(q => q.sceneDescription)`
- これにより、段階的にデータを充実させていける

### 3.5 アプリ独自ルール問題の Scene Mode 除外

本アプリにはSPEC.mdで定義された独自判定ルール（例: `look like + 名詞 → SV`）が存在する。
これらは文法的に議論の余地がある判定であり、**Scene Modeの教育目的と相反する**。

Scene Modeの売りは「暗記ではなく意味理解」であるため、
**アプリ独自ルールに依存する問題には `sceneDescription` を付与しない**。
これにより、自動的に出題対象から除外される。

**除外対象の具体例**:
- `q0153`: "He looks like a gentleman." — `look like + 名詞 → SV` (独自ルール)
- `q0010`: "The meeting lasted two hours." — 副詞的対格を M 扱い → SV (境界的)
- `q0198`: "The box weighs 10 kilograms." — 副詞的対格 → SV (境界的)

これらは Sniper / Review / Parse では引き続き出題される（既存動作に影響なし）。
Scene Mode だけが「英語の構造として自然に説明できる問題」のみを扱う。

---

## 4. UserAnswer型の拡張

### 4.1 Scene Mode 回答の記録

```typescript
// src/domain/types.ts

export interface UserAnswer {
  questionId: string;
  chosenPattern: Pattern;
  correctPattern: Pattern;
  isCorrect: boolean;
  timeMs: number;
  timestamp: number;

  // === 新規フィールド（オプション） ===
  /** Scene Modeの場合のみ: ユーザーが選んだ意味カテゴリ */
  chosenScene?: SceneType;
  /** Scene Modeの場合のみ: 正解の意味カテゴリ */
  correctScene?: SceneType;
  /** Scene Modeの場合のみ: 意味カテゴリの正誤 */
  isSceneCorrect?: boolean;
}
```

### 4.2 統計への影響 — 統計汚染の防止

**設計原則**: `isCorrect` は **文型の正誤のみ** で判定する（既存モードと同じ基準）。

- `isCorrect` = 文型が合っていれば `true`（PERFECT でも PARTIAL でも `true`）
- `isSceneCorrect` = Scene Mode 固有の意味カテゴリ正誤。UI上の「PERFECT」判定に使用
- 既存の `stats.ts` は `isCorrect` / `chosenPattern` / `correctPattern` のみを参照 → **破壊的変更なし**
- Home画面の正答率・混同行列は全モード横断で比較可能な状態を維持
- Scene Mode 固有の意味理解精度は `isSceneCorrect` で独立集計（将来の拡張）

---

## 5. UI/UX 詳細設計

### 5.1 ビジュアルコンセプト

Scene Modeは「意味を読み取ってから構造を確定する」2フェーズ体験。
UIの役割は **思考のギアチェンジを色で伝える** こと。装飾ではなく状態説明。

**色の役割は3つだけ**:

| 役割 | 色 | 用途 |
|------|---|------|
| **フェーズ** | 黄 `#ffdd00` / シアン `#00ccff` | SCAN / LOCK のどちらにいるか |
| **正誤** | 緑 `#00ff88` / 赤 `#ff4444` | 正解 / 不正解 |
| **特殊判定** | 紫 `#cc66ff` | PARTIAL 結果のみ（意味✗文型✓） |

これ以外の色は使わない（装飾色を採用しなかった理由は Appendix A-1 参照）。
色を見た瞬間に「今どういう状態か」が1秒で分かることが最優先。

**紫は PARTIAL 結果の専用色**。RECOVER プロンプト等の中間状態にはシアンを使う。
紫が出たら「意味がズレている」の一意シグナルとして機能させる。

### 5.2 画面遷移とステート管理

Step 1（SCAN）が本番。Step 2（LOCK）の挙動は Step 1 の正誤で分岐する。

**設計原則**: 意味カテゴリ → 文型は 1:1 で決まる。
Step 1 が正解なら文型は自明 → 自動導出して演出で見せる（選択不要）。
Step 1 が不正解なら → 文型選択をリカバリーチャンスとして提示する。

```
[英文カード表示]
     │
     ├─ phase: 'scan'
     │   意味カテゴリ5択を表示
     │   選択 → chosenScene をセット
     │
     ├─ phase: 'lock'
     │   ┌─ Step 1 正解の場合:
     │   │   自動導出アニメーション
     │   │   「(意味カテゴリ) → (文型)」を演出表示
     │   │   1.2秒後に自動で result へ遷移
     │   │
     │   └─ Step 1 不正解の場合:
     │       "RECOVER: 文型だけでも当てろ" プロンプト
     │       文型5択を表示
     │       選択 → chosenPattern をセット → 判定実行
     │
     └─ phase: 'result'
         3種のフィードバック表示 (PERFECT / PARTIAL / WRONG)
         NEXT → 次の問題 (phase: 'scan' に戻る)
```

**結果は3種に集約**:

| Step 1（意味） | Step 2（文型） | 結果 | 意味 |
|---------------|---------------|------|------|
| 正解 | 自動導出（確定） | **PERFECT** | 意味を掴めば構造は見える |
| 不正解 | 手動で正解 | **PARTIAL** | 文型は知ってるが意味理解が不正確 |
| 不正解 | 手動で不正解 | **WRONG** | 意味も構造も外した |

なお、初期設計で検討された CLOSE 判定（意味○文型✗）は採用していない（理由は Appendix A-2 参照）。

### 5.3 レイアウト全体構成

```
┌──────────────────────────────────────┐
│  ← BACK [Esc]              SCENE    │  ← ナビヘッダー
├──────────────────────────────────────┤
│                                      │
│  ┌──────────────────────────────┐   │
│  │  ● SCAN ─────── ○ LOCK      │   │  ← フェーズインジケーター
│  └──────────────────────────────┘   │
│                                      │
│  ┌──────────────────────────────┐   │
│  │                              │   │
│  │    She looked happy.         │   │  ← 問題カード
│  │                              │   │
│  └──────────────────────────────┘   │
│                                      │
│  ┌──────────────────────────────┐   │
│  │  (Step内容: 下記参照)          │   │  ← ステップエリア
│  └──────────────────────────────┘   │
│                                      │
└──────────────────────────────────────┘
```

### 5.4 フェーズインジケーター

2つの円（ドット）と接続線で構成するステップ表示。
現在のフェーズがアクティブに光り、完了フェーズはチェック表示に変わる。

**視覚仕様**:
```
[scan フェーズ]
  ◉ SCAN ──────── ○ LOCK
  黄色グロー        灰色(暗い)

[lock フェーズ]
  ✓ SCAN ──────── ◉ LOCK
  緑(完了)         シアングロー

[result フェーズ]
  ✓ SCAN ──────── ✓ LOCK
  結果色           結果色
```

**CSS仕様**:
```css
.phase-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0;
  padding: 12px 20px;
  margin-bottom: 16px;
}

.phase-dot {
  width: 12px;
  height: 12px;
  border: 2px solid;
  transition: all 0.3s ease;
}

.phase-dot.active {
  background: currentColor;
  box-shadow: 0 0 8px currentColor, 0 0 16px currentColor;
  animation: neonPulse 2s ease-in-out infinite;
}

.phase-dot.completed {
  background: var(--success-color);
  border-color: var(--success-color);
}

.phase-dot.pending {
  background: transparent;
  border-color: #333355;
}

.phase-line {
  flex: 1;
  height: 2px;
  background: #333355;
  margin: 0 8px;
  max-width: 120px;
  position: relative;
}

/* 完了時: ラインが光って埋まるアニメーション */
.phase-line.filled::after {
  content: '';
  position: absolute;
  top: 0; left: 0;
  height: 100%;
  background: var(--success-color);
  box-shadow: 0 0 6px var(--success-color);
  animation: lineFill 0.4s ease forwards;
}

@keyframes lineFill {
  from { width: 0; }
  to { width: 100%; }
}

.phase-label {
  font-family: var(--font-pixel);
  font-size: 0.55rem;
  margin-top: 4px;
  letter-spacing: 0.1em;
}
```

### 5.5 Phase 1: SCAN — 意味カテゴリ選択

**ヘッダープロンプト**:
```
┌──────────────────────────────────────┐
│        WHAT'S HAPPENING?             │  ← ピクセルフォント, ネオンイエロー
│        何が起きてる？                  │  ← DotGothic16, 小さめサブテキスト
└──────────────────────────────────────┘
```

**意味カテゴリボタン — 「スキャンカード」デザイン**:

カード型ボタン。左にASCIIアイコン、右に**1行ラベルのみ**。
説明文は省略し、回転率を優先する。初回チュートリアル or ホバーで詳細を補足可能。

```
┌─ [1] ──────────────────┐
│  >>   動作だけ           │
└────────────────────────┘
┌─ [2] ──────────────────┐
│  ==   状態・性質         │
└────────────────────────┘
┌─ [3] ──────────────────┐
│  ->   対象に作用         │
└────────────────────────┘
┌─ [4] ──────────────────┐
│  =>   渡す・与える       │
└────────────────────────┘
┌─ [5] ──────────────────┐
│  <>   対象をどうする     │
└────────────────────────┘
```

**ASCIIアイコンの意図**:
| SceneType | アイコン | 視覚メタファー |
|-----------|---------|--------------|
| action | `>>` | 前方への動き（動作のみ） |
| state | `==` | イコール（主語=状態） |
| affect | `->` | 矢印（対象へ向かう） |
| transfer | `=>` | 太矢印（物が人へ移動） |
| transform | `<>` | 変換・認識（対象に結果を伴う） |

**各ラベルの完全版（ホバー/長押し時に表示）**:
| 短縮ラベル | 完全版 |
|-----------|--------|
| 動作だけ | 主語が動いている／いるだけ。必須の対象なし |
| 状態・性質 | 主語がどんな状態か、何者かを表している |
| 対象に作用 | 主語が何かに対して作用している |
| 渡す・与える | 誰かに何かを渡している／与えている |
| 対象をどうする | 対象を変える・保つ・そう認識する |

**スキャンカードのCSS仕様**:
```css
.scene-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: var(--surface-color);
  border: 2px solid var(--surface-border);
  border-left: 3px solid transparent;
  cursor: pointer;
  transition: all 0.15s ease;
  width: 100%;
  box-sizing: border-box;
}

.scene-card:hover {
  border-color: var(--warning-color);
  border-left-color: var(--warning-color);
  background: var(--surface-light);
}

.scene-card-icon {
  font-family: var(--font-pixel);
  font-size: 0.75rem;
  color: var(--warning-color);
  min-width: 28px;
  text-align: center;
}

.scene-card-name {
  font-weight: bold;
  font-size: 0.95rem;
  color: var(--text-color);
  flex: 1;
}

.scene-card-key {
  font-family: var(--font-pixel);
  font-size: 0.5rem;
  color: #555577;
}

.scene-card.selected {
  border-color: var(--warning-color);
  border-left-color: var(--warning-color);
  background: rgba(255, 221, 0, 0.08);
}
```

### 5.6 Phase 2: LOCK — 正解時は自動導出、不正解時はリカバリー

Phase 2 は Step 1 の正誤で**体験が完全に分岐**する。

---

#### 5.6.1 Step 1 正解時: 自動導出演出「LOCK ON」

Step 1 が正解の場合、文型は一意に決まるため**ユーザーに選ばせない**。
代わりに、意味→構造の接続を視覚的に演出する。

**演出フロー** (約1.5秒):
1. 選択したスキャンカードが上部にロック表示 (0.3s)
2. フェーズラインが `lineFill` で光る (0.4s)
3. 導出された文型が中央に大きく出現: `→ SVC` (0.4s, `popScale`)
4. 0.4s 後に自動で result (PERFECT) へ遷移

> **UX改善余地**: 自動遷移の速度は連続学習に最適化しているが、初回ユーザーや英語初学者には速い可能性がある。改善オプションは 12.5 節を参照。

```
┌──────────────────────────────────────┐
│  SCAN ✓  == 主語の状態・性質          │  ← ロック済み表示（グリーン枠）
├──────────────────────────────────────┤
│                                      │
│           LOCK ON                    │  ← ピクセルフォント, シアン
│                                      │
│         ┌──────────┐                │
│         │          │                │
│         │   SVC    │                │  ← パターンカラーで大きく表示
│         │          │                │     popScale アニメーション
│         └──────────┘                │
│                                      │
│    == 主語の状態 → SVC               │  ← 接続を言語化
│                                      │
└──────────────────────────────────────┘
```

**自動導出のCSS**:
```css
.lock-on-pattern {
  font-family: var(--font-pixel);
  font-size: 2rem;
  font-weight: bold;
  text-align: center;
  padding: 20px;
  animation: popScale 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.lock-on-connection {
  text-align: center;
  font-size: 0.85rem;
  color: var(--text-secondary);
  margin-top: 8px;
}

.lock-on-connection .scene-icon {
  color: var(--warning-color);
  font-family: var(--font-pixel);
}

.lock-on-connection .arrow {
  color: var(--text-secondary);
  margin: 0 8px;
}

.lock-on-connection .pattern-name {
  font-family: var(--font-pixel);
  font-weight: bold;
}
```

---

#### 5.6.2 Step 1 不正解時: リカバリーチャンス「RECOVER」

Step 1 が不正解の場合、文型選択を**リカバリー機会**として提示する。
「意味は外したが、文型だけでも当てられるか？」というサブチャレンジ。

**プロンプト**:
```
┌──────────────────────────────────────┐
│  SCAN ✗  -> 対象への働きかけ          │  ← レッド枠（不正解表示）
├──────────────────────────────────────┤
│                                      │
│           RECOVER                    │  ← ピクセルフォント, ネオンシアン
│        文型だけでも当てろ             │  ← サブテキスト
│                                      │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐  │
│  │ SV  │ │ SVC │ │ SVO │ │SVOO │ │SVOC │  │
│  │ [1] │ │ [2] │ │ [3] │ │ [4] │ │ [5] │  │
│  └─────┘ └─────┘ └─────┘ └─────┘ └─────┘  │
│                                      │
└──────────────────────────────────────┘
```

**RECOVER プロンプトのCSS**:
```css
.recover-prompt {
  font-family: var(--font-pixel);
  font-size: 0.7rem;
  color: var(--secondary-color);  /* シアン: LOCKフェーズ色 */
  text-shadow: 0 0 6px rgba(0, 204, 255, 0.4);
  text-align: center;
  letter-spacing: 0.1em;
  margin-bottom: 4px;
}

.recover-sub {
  font-size: 0.85rem;
  color: var(--text-secondary);
  text-align: center;
  margin-bottom: 16px;
}
```

**不正解ロック表示のCSS**:
```css
.scene-locked.wrong {
  background: rgba(255, 68, 68, 0.05);
  border-color: rgba(255, 68, 68, 0.3);
}

.scene-locked.wrong .scene-locked-badge {
  color: var(--error-color);
}
```

**パターンボタン**:
既存の `.pattern-grid` / `.pattern-btn` をそのまま再利用。

```
┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐
│ SV  │ │ SVC │ │ SVO │ │SVOO │ │SVOC │
│ [1] │ │ [2] │ │ [3] │ │ [4] │ │ [5] │
└─────┘ └─────┘ └─────┘ └─────┘ └─────┘
```

---

#### 5.6.3 共通: ロック済み表示

```css
.scene-locked {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 14px;
  margin-bottom: 14px;
  font-size: 0.85rem;
  border: 1px solid;
}

.scene-locked.correct {
  background: rgba(0, 255, 136, 0.05);
  border-color: rgba(0, 255, 136, 0.3);
}

.scene-locked-badge {
  font-family: var(--font-pixel);
  font-size: 0.5rem;
  text-shadow: 0 0 4px currentColor;
}

.scene-locked-icon {
  font-family: var(--font-pixel);
  font-size: 0.65rem;
  color: var(--warning-color);
}

.scene-locked-name {
  color: var(--text-color);
  font-weight: bold;
}
```

### 5.7 Phase 3: RESULT — 軽量フィードバック

**設計原則: 間違えた場所だけを主役にする。毎回全部出さない。**

反復学習UIでは、1問に対して**1つだけ強く印象づける**ほうが定着する。
PERFECT時は最小表示で次へ行く快感を優先。不正解時のみ解説を出す。

#### 5.7.1 判定結果テーブル

| 判定 | 条件 | 表示ボリューム |
|------|------|-------------|
| **PERFECT** | 意味✅ | **最小**: タイトル + scene一言 + NEXT |
| **PARTIAL** | 意味❌ 文型✅ | **中**: SCAN不正解を強調 + 正解の意味 |
| **WRONG** | 意味❌ 文型❌ | **大**: 両方の正解 + HINT + TRAP |

#### 5.7.2 PERFECT — 最速で次へ

連続正解時のテンポが命。演出は控えめ、次へ行ける快感を優先。

```
┌──────────────────────────────────────┐
│                                      │
│          PERFECT!                    │  ← ネオングリーン, correctBlink
│                                      │
│   == 状態・性質 → SVC                │  ← 接続を1行で表示
│                                      │
│   「彼の様子・印象を描写している」     │  ← sceneDescription（小さめ）
│                                      │
│   [        NEXT [Enter]        ]     │
│                                      │
└──────────────────────────────────────┘
```

背景: `#0a2a1a` (深緑)、枠: `#00ff88`。
SCAN行・LOCK行・HINT・TRAPは**表示しない**。正解なら不要。

#### 5.7.3 PARTIAL — 意味のズレだけを強調

文型は当たったが意味理解がズレている。**SCANの誤りだけを主役にする。**
例は `She became a doctor.`（SVC）で、意味を「対象に作用」と誤認したケース。

```
┌──────────────────────────────────────┐
│                                      │
│          PARTIAL...                  │  ← ネオンパープル, neonPulse
│                                      │
│   あなた: -> 対象に作用               │  ← あなたの選択（赤）
│   正解:   == 状態・性質               │  ← 正解（緑）
│                                      │
│   「彼女が医者になった（状態変化）」   │  ← sceneDescription
│                                      │
│   HINT: S=Cの関係(become) → SVC     │
│                                      │
│   [        NEXT [Enter]        ]     │
│                                      │
└──────────────────────────────────────┘
```

背景: `#1a0a2a` (深紫)、枠: `#cc66ff`。
LOCK行は**表示しない**（文型は合っているので言及不要）。
教育メッセージも1行に圧縮: タイトル「PARTIAL...」が十分に意図を伝える。

#### 5.7.4 WRONG — 両方の正解を表示

意味も文型も外した。ここだけフル表示で正解を見せる。
例は `They made him angry.`（SVOC）で、`She opened the window.`（SVO）と混同したケース。

```
┌──────────────────────────────────────┐
│                                      │
│         WRONG...                     │  ← ネオンレッド, incorrectShake
│                                      │
│   意味  あなた: -> 対象に作用         │
│         正解:   <> 対象をどうする     │
│                                      │
│   文型  あなた: SVO                   │
│         正解:   SVOC                  │
│                                      │
│   「彼を怒った状態にした」            │  ← sceneDescription
│                                      │
│   HINT: O(him)=C(angry)の関係 → SVOC │
│   TRAP: make O(物) = SVO との混同注意 │
│                                      │
│   [        NEXT [Enter]        ]     │
│                                      │
└──────────────────────────────────────┘
```

背景: `#2a0a0a` (深赤)、枠: `#ff4444`。
WRONG のみ HINT + TRAP をフル表示。間違いが大きいときだけ解説が出る。

### 5.8 フィードバック内の共通パーツ

**sceneDescription 表示**: 全結果で共通。装飾は最小限。
```css
.scene-hint {
  font-size: 0.9rem;
  color: var(--text-secondary);
  font-style: italic;
  padding: 8px 0;
  border-top: 1px solid var(--surface-border);
  margin-top: 8px;
}
```

**正誤比較行**: PARTIAL / WRONG で使用。「あなた → 正解」を1行で示す。
```css
.answer-compare {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 0;
  font-size: 0.9rem;
}

.answer-compare-label {
  color: var(--text-secondary);
  font-size: 0.8rem;
  min-width: 48px;
}

.answer-compare-wrong {
  color: var(--error-color);
  text-decoration: line-through;
  opacity: 0.7;
}

.answer-compare-correct {
  color: var(--success-color);
  font-weight: bold;
}
```

### 5.9 キーボードショートカット

| キー | フェーズ | アクション |
|------|---------|----------|
| `1`〜`5` | scan | 意味カテゴリ選択 → lock へ遷移 |
| `1`〜`5` | lock（不正解時のみ） | 文型選択 → result へ遷移 |
| *(なし)* | lock（正解時） | 自動導出アニメーション → 自動で result へ遷移 |
| `Enter` | result | 次の問題へ |
| `Esc` | 全フェーズ | Homeに戻る |

### 5.10 アニメーション

新規追加は `lineFill` のみ。他は既存アニメーションを再利用する。

```css
/* フェーズインジケーターのライン充填 */
@keyframes lineFill {
  from { width: 0; }
  to { width: 100%; }
}
```

**既存アニメーションの再利用**:
| アニメーション | 用途 |
|-------------|------|
| `correctBlink` | PERFECT タイトル |
| `incorrectShake` | WRONG タイトル |
| `neonPulse` | PARTIAL タイトル、フェーズドットのアクティブ状態 |
| `pixelFadeIn` | Phase 遷移時の要素出現 |
| `popScale` | LOCK ON 時の文型表示 |

### 5.11 モバイル対応

```css
@media (max-width: 600px) {
  .scene-card {
    padding: 10px 12px;
    gap: 8px;
  }

  .scene-card-name {
    font-size: 0.85rem;
  }

  .phase-indicator {
    padding: 8px 12px;
  }

  .phase-label {
    font-size: 0.45rem;
  }
}
```

### 5.12 Home画面メニューデザイン

他メニューと同じ `.menu-item` を使用。h3 の色だけネオンイエローで差別化する。

```html
<Link to="/scene" className="menu-item">
  <h3 style={{ color: 'var(--warning-color)', textShadow: '...' }}>SCENE MODE</h3>
  <span>意味で見抜け</span>
</Link>
```

---

## 6. ロジック設計

### 6.1 出題ロジック — ランダム + 誤分類ペア追撃

Scene Mode は意味カテゴリの**混同**が最大の学習ポイント。
完全ランダムだけでは「分かった気になる」可能性があるため、
**ユーザーが実際に間違えた誤分類ペア**を追撃する仕組みを持つ。

事前定義の近接ペアではなく、直前の誤答データ（`chosenScene`）から
「何を何と間違えたか」を導出し、その2パターンから出題する。
学習者ごとに混同パターンは異なるため、こちらのほうが精度が高い。

**よくある誤分類ペアの例**（参考情報。コードには埋め込まない）:

| ペア | なぜ混同する |
|------|------------|
| SV ↔ SVC | "She smiled." vs "She became quiet."。動作か状態変化か |
| SVO ↔ SVOC | "found the key" vs "found the book easy"。対象の後に補語があるか |
| SVO ↔ SVOO | "made a cake" vs "made him a cake"。対象が1つか2つか |
| SV ↔ SVO | "run fast" vs "run a hotel"。自動詞か他動詞か |

```typescript
// src/logic/sceneLogic.ts

import { questions } from '../data/questions.seed';
import type { Question, Pattern, SceneType } from '../domain/types';
import { SCENE_TO_PATTERN } from '../domain/constants';

/** Scene Mode対象の問題（モジュール読み込み時に1回だけフィルタし、以降はキャッシュを返す） */
const sceneQuestions: Question[] = questions.filter(
  q => typeof q.sceneDescription === 'string'
    && q.sceneDescription.trim().length > 0
);

export function getSceneQuestions(): Question[] {
  return sceneQuestions;
}

/** 直近の誤答情報 */
interface LastMistake {
  correctPattern: Pattern;   // 正解だったパターン
  chosenScene: SceneType;    // ユーザーが選んだ意味カテゴリ
}

/**
 * 次の問題を取得する。
 *
 * 優先順位:
 * 1. 直前に間違えた場合 → 誤分類ペア（正解 vs 誤選択）の両方から出題 (50%)
 * 2. それ以外 → ランダム (100%)
 *
 * 除外: 直近5問は再出題しない（同じ文の早期リピートを防止）
 */
export function getNextSceneQuestion(
  recentIds: string[],       // 直近5問のID（新しい順）
  lastMistake?: LastMistake  // 直前の誤答情報（正解時は undefined）
): Question {
  const pool = getSceneQuestions().filter(
    q => !recentIds.includes(q.id)
  );

  // フォールバック: 除外しすぎて空になった場合は除外幅を緩める
  const safePool = pool.length > 0
    ? pool
    : getSceneQuestions().filter(q => q.id !== recentIds[0]);

  // 直前に間違えた場合: 50% で誤分類ペアから出題
  if (lastMistake && Math.random() < 0.5) {
    const { correctPattern, chosenScene } = lastMistake;

    // ユーザーが選んだ意味カテゴリに対応するパターンを導出
    // 例: affect を選んだ → SVO (3) と誤認していた
    const mistakenPattern = SCENE_TO_PATTERN[chosenScene];

    // 誤分類ペアの両側から出題する
    // 例: 正解 SVC(2) を SVO(3) と誤認 → 次は SVC か SVO の問題
    const targetPatterns = [correctPattern, mistakenPattern];
    const mistakePool = safePool.filter(
      q => targetPatterns.includes(q.correctPattern)
    );

    if (mistakePool.length > 0) {
      return mistakePool[Math.floor(Math.random() * mistakePool.length)];
    }
  }

  // デフォルト: ランダム
  return safePool[Math.floor(Math.random() * safePool.length)];
}
```

**設計意図**:
- **誤分類ペア追撃**: `chosenScene` から「ユーザーが何と間違えたか」を導出し、
  **正解パターンと誤選択パターンの両方**から次を出す。
  例: SVC の問題で `affect`（SVO）を選んだ → 次は SVC か SVO が出やすい。
  これにより、ユーザーが実際に混同している境界を繰り返し突ける
- **実データ駆動**: 事前定義の近接ペアではなく、実際の誤答データを使う（近接ペア方式を採用しなかった理由は Appendix A-3 参照）
- **50%混合**: 100%追撃だとメタ読みされる。50%で追撃、50%でランダム
- **直近5問除外**: 問題数60前後だと1問除外では同じ文がすぐ戻る。5問バッファで自然な間隔を確保
- **正解時はランダム**: 正解が続いている間は偏りなく幅広く出題

### 6.2 判定ロジック

```typescript
// src/logic/sceneLogic.ts

import type { Question, Pattern, SceneType } from '../domain/types';
import { SCENE_TYPE_MAP, SCENE_TO_PATTERN } from '../domain/constants';

export interface SceneJudgeResult {
  isSceneCorrect: boolean;           // Step 1 の正誤（意味カテゴリが合っていれば文型も自動で正解）
  isPatternCorrect: boolean;         // 文型の正誤（自動導出 or 手動選択）
  resultType: 'perfect' | 'partial' | 'wrong';
  correctScene: SceneType;
  correctPattern: Pattern;
  derivedPattern: Pattern;           // chosenScene から導出された文型
}

export function judgeScene(
  question: Question,
  chosenScene: SceneType,
  chosenPattern: Pattern | null       // Step 1 正解時は null（自動導出）
): SceneJudgeResult {
  const correctScene = SCENE_TYPE_MAP[question.correctPattern];
  const isSceneCorrect = chosenScene === correctScene;
  const derivedPattern = SCENE_TO_PATTERN[chosenScene];

  // Step 1 正解時: 文型は自動導出（必ず正解）
  // Step 1 不正解時: chosenPattern で判定
  const actualPattern = isSceneCorrect ? derivedPattern : chosenPattern!;
  const isPatternCorrect = actualPattern === question.correctPattern;

  let resultType: SceneJudgeResult['resultType'];
  if (isSceneCorrect)                         resultType = 'perfect';
  else if (!isSceneCorrect && isPatternCorrect) resultType = 'partial';
  else                                          resultType = 'wrong';

  return {
    isSceneCorrect,
    isPatternCorrect,
    resultType,
    correctScene,
    correctPattern: question.correctPattern,
    derivedPattern,
  };
}
```

### 6.3 回答記録 — 統計汚染の防止

**設計原則**: `isCorrect` は **文型の正誤のみ** で判定する（既存モードと同じ基準）。
Scene 固有の「意味理解精度」は `isSceneCorrect` で独立集計する。

これにより:
- Home 画面の正答率・混同行列は、既存モードと比較可能な状態を維持する
- Scene Mode の厳しい基準（意味+文型の両方正解）は別軸で管理する

```typescript
// SceneGame コンポーネント内

const answer: UserAnswer = {
  questionId: question.id,
  chosenPattern: result.isSceneCorrect
    ? result.derivedPattern     // 自動導出された文型
    : chosenPattern!,            // 手動選択した文型
  correctPattern: question.correctPattern,
  isCorrect: result.isPatternCorrect,  // ★ 文型のみで判定（既存互換）
  timeMs: elapsedMs,
  timestamp: Date.now(),
  // Scene Mode固有フィールド
  chosenScene,
  correctScene: result.correctScene,
  isSceneCorrect: result.isSceneCorrect,
};
store.appendAnswer(answer);
```

**統計の使い分け**:

| 指標 | 参照フィールド | 用途 |
|------|--------------|------|
| Home画面の全体正答率 | `isCorrect`（文型のみ） | 全モード横断で比較可能 |
| Home画面の混同行列 | `chosenPattern` vs `correctPattern` | 文型ペアの混同分析 |
| Scene固有: 意味理解精度（PERFECT率） | `isSceneCorrect` | Scene Modeの本質的な成果。意味→構造パイプラインの定着度 |

---

## 7. ファイル構成

### 7.1 新規作成ファイル

| ファイル | 役割 |
|---------|------|
| `src/pages/Scene.tsx` | Scene Mode入口ページ |
| `src/ui/SceneGame.tsx` | Scene Modeメインゲームコンポーネント |
| `src/logic/sceneLogic.ts` | 出題・判定ロジック |

### 7.2 変更ファイル

| ファイル | 変更内容 |
|---------|---------|
| `src/domain/types.ts` | `SceneType` 型追加、`Question.sceneDescription` 追加、`UserAnswer` 拡張 |
| `src/domain/constants.ts` | `SCENE_TYPE_MAP`, `SCENE_LABELS`, `SCENE_TO_PATTERN` 追加 |
| `src/data/questions.seed.ts` | 各問題に `sceneDescription` フィールド追加 |
| `src/pages/Home.tsx` | メニューに SCENE MODE 追加 |
| `src/App.tsx` | `/scene` ルート追加 |

---

## 8. Home画面メニュー追加

### 8.1 配置

SNIPER MODE は既存ユーザーの看板モードとして**先頭固定**する。
SCENE MODE はその直下に配置し、★NEW バッジで視認性を確保する。

学習思想上の理想順序は `SCENE → PARSE → SNIPER` だが、
既存ユーザーの導線を壊さないことを優先する。
代わりにScene Modeの説明文で「まずここから始めよう」というニュアンスを含める。

```
1. SNIPER MODE      （反射）       ← 看板モード、先頭固定
2. SCENE MODE  ★NEW （意味理解）   ← 新規追加
3. PARSE MODE       （構造分析）
4. REVIEW MODE      （復習）
5. VERB FOCUS       （動詞深掘り）
6. COLLECTION       （図鑑）
```

### 8.2 メニューアイテムデザイン

```
┌──────────────────────────────┐
│  SCENE MODE            ★NEW │
│  意味で見抜け                 │
└──────────────────────────────┘
```

- カラー: `#ffdd00`（ネオンイエロー / warning-color）をアクセントに
- ★NEW バッジは一定期間後に削除

---

## 9. データ追加方針: sceneDescription

### 9.1 作成ガイドライン

`sceneDescription` は以下の原則で作成する：

1. **文法用語を使わない**: 「目的語」「補語」「SVC」等は禁止
2. **日本語で場面を描写する**: 実際に何が起きているかを自然な日本語で
3. **動詞の意味を活かす**: 動詞が示す動作・状態を中心に据える
4. **短く具体的に**: 1〜2文、30文字以内を目安

### 9.2 パターン別テンプレート

**Pattern 1 (SV)**:
- 「〜が[動詞]している。ただそれだけ」
- 「[主語]の動き。向かう先も対象もない」
- 例: "鳥が飛んでいる。ただの動作" / "彼女が微笑んだ。視線の先があるだけ"

**Pattern 2 (SVC)**:
- 「[主語]の状態・様子を表している」
- 「[主語]が[どんな状態]かを説明」
- 例: "彼女は疲れた状態にある" / "このスープの味わいを描写"

**Pattern 3 (SVO)**:
- 「[主語]が[対象]に働きかけている」
- 「[動詞]という行為が[対象]に向かった」
- 例: "窓を開けるという行為" / "コーヒーへの好みを表現"

**Pattern 4 (SVOO)**:
- 「[誰か]に[何か]を渡している」
- 「[人]に向けて[物]が動いた」
- 例: "私に本を渡す場面" / "彼に仕事を見つけてあげる"

**Pattern 5 (SVOC)**:
- 「[対象]を[ある状態]にした/にしている」（変化・維持）
- 「[対象]を[〜だ]と判断した/呼んだ」（認識・呼称）
- 「[対象]が[〜している]のを見た/聞いた」（知覚）
- 例: "彼を怒った状態にした" / "部屋をきれいに保っている" / "その本が面白いとわかった" / "彼女が踊っているのを見た"

### 9.3 レビュー基準（品質チェックリスト）

`sceneDescription` はこのモードの実力そのもの。雑な文面はモード全体を弱くする。
全問に対して以下の4項目をチェックする。

| # | チェック項目 | NG例 | OK例 |
|---|------------|------|------|
| 1 | **文法用語が混じっていないか** | "目的語が1つある" | "窓に対して開ける行為" |
| 2 | **構造の言い換えではなく場面描写か** | "S=Cの関係" | "彼女が疲れた状態にある" |
| 3 | **30文字以内で一読理解できるか** | "主語である彼が対象となる窓を開けるという行為を行っている場面" | "窓を開けた" |
| 4 | **近接カテゴリとの差が出ているか** | SV/SVC 両方で「動いている」 | SV: "走っている、ただそれだけ" / SVC: "疲れた状態にある" |

特にチェック4が重要。近接カテゴリの `sceneDescription` が似すぎると、
ユーザーが意味で判断できず、結局ラベル暗記に戻ってしまう。

### 9.4 初期リリースでのデータ量

- **最低ライン**: Level 1〜2 の全問題（約60問）に `sceneDescription` を付与
- **推奨ライン**: Level 1〜3 の全問題（約100問）に付与
- **将来**: 全問題（約230問）に付与

---

## 10. コレクション連携と経験値設計

### 10.1 結果別の経験値

| 結果 | 文型正誤 | 経験値 | 理由 |
|------|---------|--------|------|
| **PERFECT** | 正解 | **+10 XP** (フル) | 意味も構造も正解。完全な理解 |
| **PARTIAL** | 正解 | **+5 XP** (半分) | 文型は合ったが意味が違う。半分の理解 |
| **WRONG** | 不正解 | **0 XP** | 文型も外した |

**UIでの表示**: PARTIAL 時に `+5 XP` と小さく表示し、
「意味も合わせれば満額もらえる」ことを暗に伝える。
PERFECT 時の `+10 XP` は通常通り表示。

### 10.2 実装

SniperGame.tsx のコレクション連携コードをベースに、経験値量を分岐させる。

```typescript
// SceneGame.tsx 内
const verbTag = question.tags.find(t => t.startsWith('v:'));
if (verbTag && result.isPatternCorrect) {
  const verbId = verbTag.substring(2);
  const expAmount = result.isSceneCorrect ? 10 : 5;  // PERFECT=10, PARTIAL=5
  collectionStore.addProgress(verbId, true, expAmount);
}
```

---

## 11. Scene 内セッション統計

### 11.1 なぜ MVP で必要か

Scene Mode の核心指標は「意味理解精度」(`isSceneCorrect`)。
しかし Home 画面には文型正答率しか表示されないため、
**Scene 画面内に小さなセッション統計を出す**ことで、成長を実感させる。

Home 改修は Phase 3 で十分。Scene 画面内だけで完結させる。

### 11.2 表示内容

ゲーム画面の上部（フェーズインジケーターの横）に、セッション中の統計を小さく表示。

```
┌──────────────────────────────────────────┐
│  ● SCAN ─── ○ LOCK           3/5 (60%)  │
│                                PERFECT 2  │
└──────────────────────────────────────────┘
```

| 表示 | 内容 |
|------|------|
| `3/5 (60%)` | 意味正答数 / 回答数（意味正答率） |
| `PERFECT 2` | 連続PERFECT数（0のときは非表示） |

**CSS**: 既存の `.verb-focus-progress` と同じスタイルを流用。
ピクセルフォント、小さめ、シアンカラー。

### 11.3 セッション統計のステート

```typescript
// SceneGame 内の state
const [sessionStats, setSessionStats] = useState({
  total: 0,
  sceneCorrect: 0,
  perfectStreak: 0,
});
```

PERFECT で `perfectStreak++`、それ以外で `perfectStreak = 0`。
セッション = Scene Mode に入ってから Home に戻るまでの期間。

---

## 12. 将来の拡張余地

### 12.1 Scene Review Mode

Scene Modeの回答データ（`chosenScene`, `isSceneCorrect`）を蓄積することで、
**意味カテゴリの混同行列**（例: "state を affect と間違えやすい"）を算出し、
苦手な意味カテゴリを重点出題するReview変種を作れる。

### 12.2 ③ シャッフル即断トレ への発展

Scene Modeの意味理解ステップを制限時間付きにすることで、③の機能を実現できる。
- Step 1（SCAN）に3秒制限 → 意味の即断
- Step 1 正解時は自動導出が走るので、体験は「3秒で意味を掴む」のみ
- 「Scene Sniper」としての変種

### 12.3 ⑤ 文型否定トレーニング への発展

フィードバック画面に「他の文型ではダメな理由」を表示する拡張。
Scene Modeの意味カテゴリ選択が基盤となる。

### 12.4 自由記述モード

将来的に、意味カテゴリの選択ではなく、ユーザーが自分の言葉で「何が起きてるか」をテキスト入力するモードも検討可能。AI判定との組み合わせが必要になるため、優先度は低い。

### 12.5 LOCK ON 自動遷移のUX改善

現状の LOCK ON 演出は約1.5秒で自動遷移し、連続学習のテンポを優先している。
ただし初回ユーザーや英語初学者にとっては「何が起きたか理解する前に次へ進む」リスクがある。

**改善オプション**（いずれか、または組み合わせ）:

| オプション | 内容 | メリット | コスト |
|-----------|------|---------|-------|
| **初回スロー** | セッション最初の3〜5問だけ遷移を遅くする（例: 2.5秒） | 初見の理解を助けつつ、慣れたら通常速度 | ステート管理が少し増える |
| **クリック/Enter スキップ** | 自動遷移を待たず、クリックやEnterで即座にresultへ飛ばせる | 慣れたユーザーが自分のペースで加速可能 | 実装が軽い。既存のEnterハンドラ拡張で済む |
| **Reduce Motion 対応** | `prefers-reduced-motion` メディアクエリで演出を短縮/省略 | アクセシビリティ対応 | アニメーション分岐が必要 |

MVP ではクリック/Enterスキップが最もコストパフォーマンスが高い。
初回スローと Reduce Motion は Phase 2 以降で検討する。

---

## 13. 実装優先順位

### Phase 1: コア実装（MVP）
1. `types.ts` に `SceneType` 型と `Question.sceneDescription` 追加
2. `constants.ts` に意味カテゴリ定数追加（`SCENE_LABELS` は `short` / `full` の2段構成）
3. `questions.seed.ts` のLevel 1〜2問題に `sceneDescription` 追加
   - レビュー基準（9.3節）に基づく品質チェック必須
   - 独自ルール問題（3.5節）は除外
4. `sceneLogic.ts` 新規作成（弱点追撃型出題・判定ロジック）
5. `SceneGame.tsx` 新規作成（メインUI + セッション統計表示）
6. `Scene.tsx` 新規作成（入口ページ）
7. `App.tsx` にルート追加
8. `Home.tsx` にメニュー追加

### Phase 2: データ充実
9. Level 3〜5 の問題に `sceneDescription` 追加（残り約170問）
10. レビュー基準によるデータ品質レビュー

### Phase 3: 統計拡張
11. Scene Mode固有の統計（意味カテゴリ正答率）をHome画面に追加
12. 意味カテゴリの混同行列を実装

---

## 14. 非機能要件

### 14.1 パフォーマンス
- `sceneDescription` フィルタはモジュールスコープで1回のみ実行し、結果をキャッシュ（6.1節 `sceneQuestions` 定数）
- 既存の問題数（230問程度）であれば性能問題は発生しない

### 14.2 後方互換性
- `sceneDescription` は Optional フィールドのため、既存データとの互換性を維持
- `UserAnswer` の新規フィールドも Optional のため、既存の回答データに影響なし
- localStorage のスキーマバージョンアップは不要

### 14.3 UIレスポンシブ
- 既存のレトロアーケードテーマをそのまま踏襲
- 意味カテゴリボタンはモバイルでタップしやすいサイズ（min-height: 56px）
- STEP間のアニメーションは `pixelFadeIn` を使用（既存CSS）

---

## Appendix A. 検討事項と不採用理由

設計過程で検討したが採用しなかった案を記録する。将来の再検討時に同じ議論を繰り返さないための参照用。

### A-1. 金色ストリーク等の装飾色

**検討内容**: 連続正解時に金色のストリークエフェクトや、達成度に応じた装飾色を導入する案。

**不採用の理由**: Scene Mode の色は「今どのフェーズにいるか」「正解か不正解か」を1秒で伝えるためのものであり、役割は3つ（フェーズ色・正誤色・PARTIAL専用色）に限定した。装飾色を加えると色の意味が曖昧になり、状態伝達の即時性が損なわれる。既存モードとのビジュアル差別化は色数ではなく、2フェーズ構造そのもので十分に達成できる。

### A-2. CLOSE 判定（意味カテゴリ正解・文型不正解）

**検討内容**: 初期設計では結果を4種（PERFECT / CLOSE / PARTIAL / WRONG）としていた。CLOSE は「意味は合ったが文型を外した」ケースを表す。

**不採用の理由**: 意味カテゴリと文型は1:1で対応するため、意味カテゴリが正しければ文型は自動導出で必ず正解になる。つまり「意味○文型✗」の組み合わせは論理的に発生しない。結果を3種（PERFECT / PARTIAL / WRONG）に集約したことで、判定ロジックとUI分岐の両方がシンプルになった。

### A-3. ADJACENT_PAIRS（事前定義の近接ペアテーブル）

**検討内容**: 混同しやすい文型ペア（SV↔SVC、SVO↔SVOC 等）をコード内にテーブルとして事前定義し、不正解時にそのペアから重点出題する方式。

**不採用の理由**: 学習者ごとに混同パターンは異なる。事前定義ペアでは「設計者が想定した混同」しかカバーできず、想定外の誤答パターン（例: transfer を action と間違える等）に対応できない。代わりに、直前の誤答データ（`chosenScene`）から「ユーザーが実際に何を何と間違えたか」をリアルタイムに導出し、正解パターンと誤選択パターンの両方から出題する方式を採用した。これにより、学習者固有の弱点に自動適応する出題が可能になる。
