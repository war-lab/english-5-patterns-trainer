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

  // If no answers yet, return random Level 1 question
  if (answers.length === 0) {
    const level1Questions = allQuestions.filter(q => q.level === 1);
    return level1Questions[Math.floor(Math.random() * level1Questions.length)];
  }

  // Calculate stats to determine current level cap
  const correctCount = answers.filter(a => a.isCorrect).length;
  let maxLevel = 1;
  if (correctCount >= 100) maxLevel = 5;
  else if (correctCount >= 60) maxLevel = 4;
  else if (correctCount >= 30) maxLevel = 3;
  else if (correctCount >= 10) maxLevel = 2;

  // Filter questions by level cap
  const availableQuestions = allQuestions.filter(q => q.level <= maxLevel);
  // Fallback to all if somehow empty (e.g. no level 1 questions defined)
  const candidateQuestions = availableQuestions.length > 0 ? availableQuestions : allQuestions;

  // Use candidateQuestions for subsequent logic instead of allQuestions
  // We need to map original logic to use candidateQuestions


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
  const weightedQuestions = candidateQuestions.map(q => {
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
  return candidateQuestions[0];
}
