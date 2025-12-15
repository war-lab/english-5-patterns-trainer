export type Pattern = 1 | 2 | 3 | 4 | 5;

export interface Question {
  id: string;
  sentence: string;
  level: number; // 1..5 (difficulty)
  correctPattern: Pattern;
  explanationShort: string;
  tags: string[];
}

export interface UserAnswer {
  questionId: string;
  chosenPattern: Pattern;
  correctPattern: Pattern;
  isCorrect: boolean;
  timeMs: number;
  timestamp: number;
}

export interface Settings {
  soundEnabled: boolean;
  // Add more settings here as needed
}

export interface StatsSummary {
  totalQuestions: number;
  correctCount: number;
  accuracy: number;
  avgTimeMs: number;
  patternStats: Record<Pattern, { correct: number; total: number }>;
  confusionMatrix: Record<string, number>; // key: "correct:chosen" (e.g. "4:5") -> count
}
