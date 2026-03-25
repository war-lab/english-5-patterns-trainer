import type { Pattern } from './types';

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
