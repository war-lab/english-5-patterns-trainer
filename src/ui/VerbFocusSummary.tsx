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
          padding: '20px',
          textAlign: 'center',
          marginBottom: '16px',
        }}
      >
        <div style={{
          fontSize: '0.55rem',
          color: rarity === 'SR' ? '#FFD700' : rarity === 'R' ? '#C0C0C0' : 'var(--text-secondary)',
          textTransform: 'uppercase',
          fontFamily: 'var(--font-pixel)',
          letterSpacing: '0.1em',
          textShadow: rarity === 'SR' ? '0 0 6px rgba(255, 215, 0, 0.5)' : 'none'
        }}>
          {rarity === 'SR' ? 'SUPER RARE' : rarity === 'R' ? 'RARE' : 'NORMAL'}
        </div>
        <h2 style={{
          fontSize: '1.6rem',
          margin: '8px 0',
          fontFamily: 'var(--font-pixel)',
          color: 'var(--primary-color)',
          textShadow: '0 0 10px rgba(0, 255, 136, 0.5)'
        }}>{verbId}</h2>
        <div style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>{meaning}</div>
      </div>

      {/* 正答率 */}
      <div
        className="card"
        style={{
          padding: '16px',
          textAlign: 'center',
          marginBottom: '16px',
          background: isPerfect ? 'rgba(0, 255, 136, 0.05)' : 'var(--surface-color)',
          borderColor: isPerfect ? 'var(--success-color)' : 'var(--surface-border)',
          boxShadow: isPerfect ? 'var(--glow-green)' : 'var(--box-shadow)',
        }}
      >
        {isPerfect && (
          <div style={{
            fontSize: '0.65rem',
            marginBottom: '8px',
            color: 'var(--warning-color)',
            fontFamily: 'var(--font-pixel)',
            textShadow: '0 0 6px rgba(255, 221, 0, 0.5)',
            animation: 'neonPulse 2s ease-in-out infinite'
          }}>
            PERFECT CLEAR!
          </div>
        )}
        <div style={{
          fontSize: '2rem',
          fontWeight: 'bold',
          fontFamily: 'var(--font-pixel)',
          color: isPerfect ? 'var(--success-color)' : 'var(--secondary-color)',
          textShadow: isPerfect ? '0 0 10px rgba(0, 255, 136, 0.5)' : '0 0 8px rgba(0, 204, 255, 0.3)'
        }}>
          {correctCount}/{total}
        </div>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>ACCURACY {accuracy}%</div>
      </div>

      {/* パターンマップ */}
      <PatternMap allPatterns={allPatterns} answeredPatterns={patternMap} />

      {/* パターン別意味まとめ */}
      <div className="card" style={{ padding: '14px', margin: '14px 0' }}>
        <h3 style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: 'var(--secondary-color)' }}>
          {verbId} PATTERN MAP
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
              borderBottom: '1px solid var(--surface-border)',
            }}>
              <span style={{
                flexShrink: 0,
                padding: '2px 8px',
                fontSize: '0.6rem',
                fontFamily: 'var(--font-pixel)',
                fontWeight: 'bold',
                background: patternMap[p] === 'correct' ? PATTERN_COLORS[p] :
                  patternMap[p] === 'wrong' ? 'var(--error-color)' : `${PATTERN_COLORS[p]}20`,
                color: patternMap[p] === 'unanswered' ? PATTERN_COLORS[p] : 'var(--background-color)',
                minWidth: '48px',
                textAlign: 'center',
                textShadow: patternMap[p] === 'unanswered' ? `0 0 4px ${PATTERN_COLORS[p]}66` : 'none',
              }}>
                {PATTERN_LABELS[p]}
              </span>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-color)' }}>
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
              <div style={{ fontSize: '0.9rem', color: 'var(--text-color)' }}>{r.question.sentence}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                正解: <span style={{ color: PATTERN_COLORS[r.question.correctPattern], fontWeight: 'bold', fontFamily: 'var(--font-pixel)', fontSize: '0.55rem' }}>{PATTERN_LABELS[r.question.correctPattern]}</span>
                {!r.isCorrect && (
                  <span style={{ color: 'var(--error-color)', marginLeft: '8px' }}>
                    回答: <span style={{ fontFamily: 'var(--font-pixel)', fontSize: '0.55rem' }}>{PATTERN_LABELS[r.chosenPattern]}</span>
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* アクションボタン */}
      <div className="summary-actions">
        <button onClick={onRetry} className="btn" style={{ background: 'var(--primary-color)', borderColor: '#66ffbb #005533 #005533 #66ffbb', color: 'var(--background-color)' }}>
          RETRY
        </button>
        <button onClick={onSelectNew} className="btn btn-accent">
          CHANGE
        </button>
        <button onClick={onGoHome} className="btn" style={{ background: 'var(--text-secondary)', borderColor: '#aaa #555 #555 #aaa', color: 'var(--background-color)' }}>
          HOME
        </button>
      </div>
    </div>
  );
}
