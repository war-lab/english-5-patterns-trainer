import type { Question, Pattern } from '../domain/types';

export interface JudgeResult {
  isCorrect: boolean;
  explanation: { overall: string; trap?: string };
}

export function judge(question: Question, chosenPattern: Pattern): JudgeResult {
  const isCorrect = question.correctPattern === chosenPattern;
  return {
    isCorrect,
    explanation: question.explanation,
  };
}
