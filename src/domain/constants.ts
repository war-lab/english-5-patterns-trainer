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

/** 意味カテゴリのラベル定義 */
export const SCENE_LABELS: Record<SceneType, { short: string; full: string }> = {
  action:    { short: '動作だけ',       full: '主語が動いている／いるだけ。必須の対象なし' },
  state:     { short: '状態・性質',     full: '主語がどんな状態か、何者かを表している' },
  affect:    { short: '対象に作用',     full: '主語が何かに対して作用している' },
  transfer:  { short: '渡す・与える',   full: '誰かに何かを渡している／与えている' },
  transform: { short: '対象をどうする', full: '対象を変える・保つ・そう認識する' },
};

/** SceneType → Pattern の逆引き */
export const SCENE_TO_PATTERN: Record<SceneType, Pattern> = {
  action: 1,
  state: 2,
  affect: 3,
  transfer: 4,
  transform: 5,
};

/** 意味カテゴリのASCIIアイコン */
export const SCENE_ICONS: Record<SceneType, string> = {
  action:    '>>',
  state:     '==',
  affect:    '->',
  transfer:  '=>',
  transform: '<>',
};
