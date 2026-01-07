import { questions } from '../data/questions.seed';
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

  // Create a map for fast lookup
  const questionMap = new Map(questions.map(q => [q.id, q]));

  for (const ans of answers) {
    if (ans.isCorrect) correctCount++;
    totalTimeMs += ans.timeMs;

    // Pattern stats using correctPattern. 
    // Fallback: lookup in question data if missing (legacy data)
    let p = ans.correctPattern;
    if (!p) {
      const q = questionMap.get(ans.questionId);
      if (q) p = q.correctPattern;
    }

    if (p && patternStats[p]) {
      patternStats[p].total++;
      if (ans.isCorrect) patternStats[p].correct++;
    }

    // Confusion matrix
    if (!ans.isCorrect) {
      const chosen = ans.chosenPattern;
      if (p && chosen) {
        const key = `${p}:${chosen}`;
        confusionMatrix[key] = (confusionMatrix[key] || 0) + 1;
      }
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
