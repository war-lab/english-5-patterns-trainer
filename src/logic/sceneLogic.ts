import { questions } from '../data/questions.seed';
import type { Question, Pattern, SceneType } from '../domain/types';
import { SCENE_TYPE_MAP, SCENE_TO_PATTERN } from '../domain/constants';

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
    const mistakenPattern = SCENE_TO_PATTERN[chosenScene];

    // 誤分類ペアの両側から出題する
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

// --- 判定ロジック ---

export interface SceneJudgeResult {
  isSceneCorrect: boolean;           // Step 1 の正誤
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
  if (isSceneCorrect)                          resultType = 'perfect';
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
