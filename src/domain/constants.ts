import type { Pattern, SceneType } from './types';

// 文型のラベル（共通定数）
export const PATTERN_LABELS: Record<Pattern, string> = {
  1: 'SV',
  2: 'SVC',
  3: 'SVO',
  4: 'SVOO',
  5: 'SVOC'
};

// 文型カラーコード — ネオンアーケードパレット
export const PATTERN_COLORS: Record<Pattern, string> = {
  1: '#4488ff', // SV — ネオンブルー
  2: '#00ff88', // SVC — ネオングリーン
  3: '#ffaa00', // SVO — ネオンオレンジ
  4: '#cc66ff', // SVOO — ネオンパープル
  5: '#ff4466', // SVOC — ネオンレッド
};

// レアリティの表示順ソート用（高い方が先）
export const RARITY_ORDER: Record<string, number> = {
  SR: 3,
  R: 2,
  N: 1,
};

// --- Scene Mode 定数 ---

/** Pattern → SceneType マッピング（自動導出用） */
export const SCENE_TYPE_MAP: Record<Pattern, SceneType> = {
  1: 'action',
  2: 'state',
  3: 'affect',
  4: 'transfer',
  5: 'transform',
};

/** 関係の骨格ラベル定義（主: 骨格、従: 意味） */
export const SCENE_LABELS: Record<SceneType, { short: string; full: string }> = {
  action:    { short: '主語が動く・起こる',   full: '主語が動く・起こるだけ。対象は必須でない' },
  state:     { short: '主語の説明になる',     full: '主語がどんな状態か、何者かを説明している' },
  affect:    { short: '対象にはたらく',       full: '主語の動作が対象にはたらいている' },
  transfer:  { short: '相手と物の2つへ',     full: '相手と物の2つに向かっている（渡す・教える・見せる）' },
  transform: { short: '対象に説明がつく',     full: '対象にさらに説明（状態・名前・認識）がつく' },
};

/** SceneType → Pattern の逆引き */
export const SCENE_TO_PATTERN: Record<SceneType, Pattern> = {
  action: 1,
  state: 2,
  affect: 3,
  transfer: 4,
  transform: 5,
};

/** 関係の骨格図アイコン */
export const SCENE_ICONS: Record<SceneType, string> = {
  action:    'S\u2500V',
  state:     'S=C',
  affect:    'S\u2192O',
  transfer:  'S\u2192O+O',
  transform: 'S\u2192O=C',
};
