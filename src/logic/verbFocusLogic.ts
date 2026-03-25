import { questions } from '../data/questions.seed';
import { VERB_DATA } from '../data/verbData';
import type { Question, Pattern } from '../domain/types';

// マルチパターン動詞の情報
export interface MultiPatternVerb {
  verbId: string;
  meaning: string;
  rarity: 'N' | 'R' | 'SR';
  patterns: Pattern[];                         // この動詞が取るパターン一覧
  patternQuestions: Record<number, Question[]>; // パターン別の質問マップ
  totalQuestions: number;
}

/** 質問データをスキャンし、2つ以上の異なるパターンを持つ動詞を返す */
export function getMultiPatternVerbs(): MultiPatternVerb[] {
  // 全質問をverb tagでグループ化
  const verbMap = new Map<string, Question[]>();

  for (const q of questions) {
    const verbTag = q.tags.find(t => t.startsWith('v:'));
    if (!verbTag) continue;
    const verbId = verbTag.substring(2);
    if (!verbMap.has(verbId)) verbMap.set(verbId, []);
    verbMap.get(verbId)!.push(q);
  }

  const result: MultiPatternVerb[] = [];

  for (const [verbId, verbQuestions] of verbMap) {
    // この動詞の質問がカバーするパターンの種類
    const patternSet = new Set<Pattern>();
    const patternQuestions: Record<number, Question[]> = {};

    for (const q of verbQuestions) {
      patternSet.add(q.correctPattern);
      if (!patternQuestions[q.correctPattern]) {
        patternQuestions[q.correctPattern] = [];
      }
      patternQuestions[q.correctPattern].push(q);
    }

    // 2パターン以上ある動詞のみ対象
    if (patternSet.size >= 2) {
      const verbData = VERB_DATA[verbId];
      result.push({
        verbId,
        meaning: verbData?.meaning ?? '不明',
        rarity: verbData?.rarity ?? 'N',
        patterns: Array.from(patternSet).sort() as Pattern[],
        patternQuestions,
        totalQuestions: verbQuestions.length,
      });
    }
  }

  // ソート: パターン数の多い順 → レアリティ順（SR > R > N）
  const rarityOrder: Record<string, number> = { SR: 0, R: 1, N: 2 };
  result.sort((a, b) => {
    if (b.patterns.length !== a.patterns.length) return b.patterns.length - a.patterns.length;
    return (rarityOrder[a.rarity] ?? 2) - (rarityOrder[b.rarity] ?? 2);
  });

  return result;
}

/** セッション用の質問配列を生成（シャッフル済み） */
export function buildSession(verb: MultiPatternVerb): Question[] {
  const allQuestions = Object.values(verb.patternQuestions).flat();
  return shuffleArray(allQuestions);
}

/** 指定動詞の「他のパターン」の代表例文を返す（比較表示用） */
export function getComparisonExamples(
  verb: MultiPatternVerb,
  excludePattern: Pattern
): { pattern: Pattern; example: Question }[] {
  return verb.patterns
    .filter(p => p !== excludePattern)
    .map(p => ({
      pattern: p,
      example: verb.patternQuestions[p][0]
    }));
}

function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
