export type Pattern = 1 | 2 | 3 | 4 | 5;

export interface Question {
  id: string;
  sentence: string;
  level: number; // 1..5 (difficulty)
  correctPattern: Pattern;
  explanation: {
    overall: string; // The main explanation text (old explanationShort)
    trap?: string;   // Potential trap or confusion point
  };
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

// --- Collection Mode Types ---

export interface VerbCard {
  id: string; // e.g. "give"
  baseForm: string; // e.g. "give"
  meaning: string; // e.g. "与える"
  typicalPattern: Pattern; // The pattern users should learn first (e.g. 4 for SVOO)
  allPatterns: Pattern[]; // All patterns this verb takes in the app
  questionIds: string[]; // List of question IDs that feature this verb
  rarity: 'N' | 'R' | 'SR';
}

export interface CardProgress {
  level: number; // 1..MAX
  exp: number;
  unlockedPatternIds: Pattern[]; // IDs of patterns explicitly unlocked/learned
  history: {
    correct: number;
    wrong: number;
    lastPlayed: number; // timestamp
  };
}

export type VerbCardCollection = Record<string, CardProgress>;
