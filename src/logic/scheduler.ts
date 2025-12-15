import type { Question, UserAnswer, Pattern } from '../domain/types';

export function getNextQuestion(allQuestions: Question[], answers: UserAnswer[]): Question {
  // Simple weighted random implementation
  // 1. Identify patterns with low accuracy (last 10 answers)
  // 2. Identify confusion pairs
  // 3. Weight questions: 
  //    - Base weight: 1
  //    - Recent wrong pattern: +2
  //    - Part of confusion pair: +2

  if (allQuestions.length === 0) {
    throw new Error("No questions available");
  }

  // If no answers yet, return random
  if (answers.length === 0) {
    return allQuestions[Math.floor(Math.random() * allQuestions.length)];
  }

  const recentAnswers = answers.slice(-20); // Last 20
  const wrongPatterns = new Set<Pattern>();

  for (const ans of recentAnswers) {
    if (!ans.isCorrect) {
      wrongPatterns.add(ans.correctPattern);
    }
  }

  // Calculate weights
  const weightedQuestions = allQuestions.map(q => {
    let weight = 1;
    if (wrongPatterns.has(q.correctPattern)) {
      weight += 2;
    }
    // Boost if it's a high level question? Maybe later.
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
  return allQuestions[allQuestions.length - 1];
}
