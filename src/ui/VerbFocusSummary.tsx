import type { Pattern, Question } from '../domain/types';
import { PATTERN_LABELS, PATTERN_COLORS } from '../domain/constants';
import { getRarityStyle } from './visuals';
import PatternMap from './PatternMap';

export interface SessionResult {
  question: Question;
  chosenPattern: Pattern;
  isCorrect: boolean;
}

interface VerbFocusSummaryProps {
  verbId: string;
  meaning: string;
  rarity: 'N' | 'R' | 'SR';
  results: SessionResult[];
  allPatterns: Pattern[];
  patternMap: Record<number, 'correct' | 'wrong' | 'unanswered'>;
  onRetry: () => void;
  onSelectNew: () => void;
  onGoHome: () => void;
}

/** サマリー画面 */
export default function VerbFocusSummary({
  verbId,
  meaning,
  rarity,
  results,
  allPatterns,
  patternMap,
  onRetry,
  onSelectNew,
  onGoHome,
}: VerbFocusSummaryProps) {
  const correctCount = results.filter(r => r.isCorrect).length;
  const total = results.length;
  const accuracy = total > 0 ? Math.round((correctCount / total) * 100) : 0;
  const isPerfect = correctCount === total;

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      {/* 動詞カード */}
      <div
        className="card"
        style={{
          ...getRarityStyle(rarity),
          padding: '24px',
          textAlign: 'center',
          marginBottom: '20px',
        }}
      >
        <div style={{ fontSize: '0.85rem', color: '#888', textTransform: 'uppercase' }}>
          {rarity === 'SR' ? 'SUPER RARE' : rarity === 'R' ? 'RARE' : 'NORMAL'}
        </div>
        <h2 style={{ fontSize: '2rem', margin: '8px 0' }}>{verbId}</h2>
        <div style={{ fontSize: '1.1rem', color: '#555' }}>{meaning}</div>
      </div>

      {/* 正答率 */}
      <div
        className="card"
        style={{
          padding: '20px',
          textAlign: 'center',
          marginBottom: '20px',
          background: isPerfect ? 'rgba(46, 204, 113, 0.08)' : undefined,
        }}
      >
        {isPerfect && (
          <div style={{ fontSize: '1.2rem', marginBottom: '8px' }}>
            {verbId} の全文型制覇！
          </div>
        )}
        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: isPerfect ? 'var(--success-color)' : 'var(--primary-color)' }}>
          {correctCount}/{total}
        </div>
        <div style={{ fontSize: '0.9rem', color: '#888' }}>正答率 {accuracy}%</div>
      </div>

      {/* パターンマップ */}
      <PatternMap allPatterns={allPatterns} answeredPatterns={patternMap} />

      {/* パターン別意味まとめ */}
      <div className="card" style={{ padding: '16px', margin: '16px 0' }}>
        <h3 style={{ margin: '0 0 12px 0', fontSize: '1rem' }}>
          {verbId} の文型マップ
        </h3>
        {allPatterns.map(p => {
          const questionsForPattern = results.filter(r => r.question.correctPattern === p);
          const example = questionsForPattern[0]?.question;
          return (
            <div key={p} style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: '10px',
              padding: '6px 0',
              borderBottom: '1px solid #f0f0f0',
            }}>
              <span style={{
                flexShrink: 0,
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '0.8rem',
                fontWeight: 'bold',
                background: patternMap[p] === 'correct' ? PATTERN_COLORS[p] :
                  patternMap[p] === 'wrong' ? 'var(--error-color)' : `${PATTERN_COLORS[p]}30`,
                color: patternMap[p] === 'unanswered' ? PATTERN_COLORS[p] : 'white',
                minWidth: '48px',
                textAlign: 'center',
              }}>
                {PATTERN_LABELS[p]}
              </span>
              <span style={{ fontSize: '0.9rem', color: '#555' }}>
                {example?.sentence ?? '—'}
              </span>
            </div>
          );
        })}
      </div>

      {/* 各問題の正誤一覧 */}
      <div className="summary-result-list">
        {results.map((r, i) => (
          <div key={i} className="summary-result-item">
            <span className="summary-result-icon">
              {r.isCorrect ? '\u2705' : '\u274C'}
            </span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.95rem' }}>{r.question.sentence}</div>
              <div style={{ fontSize: '0.8rem', color: '#888', marginTop: '2px' }}>
                正解: <span style={{ color: PATTERN_COLORS[r.question.correctPattern], fontWeight: 'bold' }}>{PATTERN_LABELS[r.question.correctPattern]}</span>
                {!r.isCorrect && (
                  <span style={{ color: 'var(--error-color)', marginLeft: '8px' }}>
                    あなたの回答: {PATTERN_LABELS[r.chosenPattern]}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* アクションボタン */}
      <div className="summary-actions">
        <button onClick={onRetry} className="btn" style={{ background: 'var(--primary-color)', color: 'white' }}>
          もう一度
        </button>
        <button onClick={onSelectNew} className="btn" style={{ background: 'var(--accent-color)', color: 'white' }}>
          別の動詞
        </button>
        <button onClick={onGoHome} className="btn" style={{ background: '#888', color: 'white' }}>
          ホームへ
        </button>
      </div>
    </div>
  );
}
