import type { Pattern } from './types';

// 文型のラベル（共通定数）
export const PATTERN_LABELS: Record<Pattern, string> = {
  1: 'SV',
  2: 'SVC',
  3: 'SVO',
  4: 'SVOO',
  5: 'SVOC'
};

// 文型カラーコード（全画面統一）
export const PATTERN_COLORS: Record<Pattern, string> = {
  1: '#4A90E2', // SV — 青（シンプル）
  2: '#2ecc71', // SVC — 緑（補語）
  3: '#F5A623', // SVO — 橙（目的語）
  4: '#9B59B6', // SVOO — 紫（二重目的語）
  5: '#e74c3c', // SVOC — 赤（目的語+補語）
};

// レアリティの表示順ソート用（高い方が先）
export const RARITY_ORDER: Record<string, number> = {
  SR: 3,
  R: 2,
  N: 1,
};
