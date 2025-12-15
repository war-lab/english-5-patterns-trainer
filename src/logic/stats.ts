import type { UserAnswer, StatsSummary, Pattern } from '../domain/types';

export function calculateStats(answers: UserAnswer[]): StatsSummary {
  const totalQuestions = answers.length;
  if (totalQuestions === 0) {
    return {
      totalQuestions: 0,
      correctCount: 0,
      accuracy: 0,
      avgTimeMs: 0,
      patternStats: {
        1: { correct: 0, total: 0 },
        2: { correct: 0, total: 0 },
        3: { correct: 0, total: 0 },
        4: { correct: 0, total: 0 },
        5: { correct: 0, total: 0 },
      },
      confusionMatrix: {},
    };
  }

  let correctCount = 0;
  let totalTimeMs = 0;

  const patternStats: Record<Pattern, { correct: number; total: number }> = {
    1: { correct: 0, total: 0 },
    2: { correct: 0, total: 0 },
    3: { correct: 0, total: 0 },
    4: { correct: 0, total: 0 },
    5: { correct: 0, total: 0 },
  };

  const confusionMatrix: Record<string, number> = {};

  for (const ans of answers) {
    if (ans.isCorrect) correctCount++;
    totalTimeMs += ans.timeMs;

    // Pattern stats using correctPattern which is now in UserAnswer
    const p = ans.correctPattern;
    if (patternStats[p]) {
      patternStats[p].total++;
      if (ans.isCorrect) patternStats[p].correct++;
    }

    // Confusion matrix
    if (!ans.isCorrect) {
      const key = `${ans.correctPattern}:${ans.chosenPattern}`;
      confusionMatrix[key] = (confusionMatrix[key] || 0) + 1;
    }
  }

  return {
    totalQuestions,
    correctCount,
    accuracy: correctCount / totalQuestions,
    avgTimeMs: Math.round(totalTimeMs / totalQuestions),
    patternStats,
    confusionMatrix
  };
}
