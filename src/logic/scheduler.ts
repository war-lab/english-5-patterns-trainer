import type { Question, UserAnswer, Pattern } from '../domain/types';

export function getNextQuestion(allQuestions: Question[], answers: UserAnswer[]): Question {
  // Weighted Random Logic
  // Base weight: 10
  // Recent wrong (last 10): +20
  // Confusion Pair (top 3): +20
  // Same as last: weight * 0.1

  if (allQuestions.length === 0) {
    throw new Error("No questions available");
  }

  // If no answers yet, return random
  if (answers.length === 0) {
    return allQuestions[Math.floor(Math.random() * allQuestions.length)];
  }

  const recentAnswers = answers.slice(-10);
  const lastAnswer = recentAnswers[recentAnswers.length - 1];

  // 1. Identify recent wrong patterns
  const recentWrongPatterns = new Set<Pattern>();
  for (const ans of recentAnswers) {
    if (!ans.isCorrect) {
      recentWrongPatterns.add(ans.correctPattern);
    }
  }

  // 2. Identify Confusion Patterns (Simple calc)
  const confusionCounts: Record<string, number> = {};
  for (const ans of answers) {
    if (!ans.isCorrect) {
      const k = `${ans.correctPattern}:${ans.chosenPattern}`;
      confusionCounts[k] = (confusionCounts[k] || 0) + 1;
    }
  }

  // Get patterns involved in top 3 confusion pairs
  // A pair "4:5" means 4 was correct but 5 was chosen.
  // We prioritize BOTH 4 (to learn it) and 5 (to distinguish it).
  const confusionPatterns = new Set<Pattern>();
  Object.entries(confusionCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .forEach(([key]) => {
      const [correct, chosen] = key.split(':').map(Number);
      confusionPatterns.add(correct as Pattern);
      confusionPatterns.add(chosen as Pattern);
    });

  // Calculate weights
  const weightedQuestions = allQuestions.map(q => {
    let weight = 10;

    // Boost for recent wrong
    if (recentWrongPatterns.has(q.correctPattern)) {
      weight += 20;
    }

    // Boost for confusion
    if (confusionPatterns.has(q.correctPattern)) {
      weight += 20;
    }

    // Penalty for consecutive pattern (avoid repetition)
    if (lastAnswer && lastAnswer.correctPattern === q.correctPattern) {
      weight = Math.max(1, Math.floor(weight * 0.1));
    }

    return { q, weight };
  });

  // Weighted random selection
  const totalWeight = weightedQuestions.reduce((sum, item) => sum + item.weight, 0);
  let randomValue = Math.random() * totalWeight;

  for (const item of weightedQuestions) {
    randomValue -= item.weight;
    if (randomValue <= 0) {
      return item.q;
    }
  }

  // Fallback
  return allQuestions[0];
}
