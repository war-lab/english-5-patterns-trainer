import { useState } from 'react';
import { Link } from 'react-router-dom';
import { questions } from '../data/questions.seed';
import { judge } from '../logic/judge';
import { store } from '../storage/store';
import type { Question, Pattern, UserAnswer } from '../domain/types';
import { PATTERN_LABELS, PATTERN_COLORS } from '../domain/constants';

export default function Parse() {
  const [question, setQuestion] = useState<Question | null>(() => questions[Math.floor(Math.random() * questions.length)]);
  const [oCount, setOCount] = useState<number | null>(null);
  const [cCount, setCCount] = useState<number | null>(null);
  const [result, setResult] = useState<{ isCorrect: boolean; explanation: { overall: string; trap?: string }; pattern: Pattern } | null>(null);

  const loadNext = () => {
    const q = questions[Math.floor(Math.random() * questions.length)];
    setQuestion(q);
    setOCount(null);
    setCCount(null);
    setResult(null);
  };

  const handleOSel = (n: number) => setOCount(n);
  const handleCSel = (n: number) => setCCount(n);

  const checkAnswer = () => {
    if (!question || oCount === null || cCount === null) return;

    let p: Pattern | 0 = 0;
    if (oCount === 0 && cCount === 0) p = 1;
    else if (oCount === 0 && cCount === 1) p = 2;
    else if (oCount === 1 && cCount === 0) p = 3;
    else if (oCount === 2 && cCount === 0) p = 4;
    else if (oCount === 1 && cCount === 1) p = 5;

    if (p === 0) {
      setResult({ isCorrect: false, explanation: { overall: "無効な組み合わせ" }, pattern: 1 });
      return;
    }

    const { isCorrect, explanation } = judge(question, p as Pattern);
    setResult({ isCorrect, explanation, pattern: p as Pattern });

    const ans: UserAnswer = {
      questionId: question.id,
      chosenPattern: p as Pattern,
      correctPattern: question.correctPattern,
      isCorrect,
      timeMs: 0,
      timestamp: Date.now()
    };
    store.appendAnswer(ans);
  };

  if (!question) return <div style={{ color: 'var(--text-secondary)' }}>Loading...</div>;

  return (
    <div className="parse-container">
      <div className="nav-header">
        <Link to="/" className="nav-link">← BACK</Link>
        <span style={{ fontWeight: 'bold', color: 'var(--secondary-color)', fontFamily: 'var(--font-pixel)', fontSize: '0.7rem', textShadow: '0 0 6px rgba(0, 204, 255, 0.3)' }}>PARSE</span>
      </div>

      <div className="card question-card" style={{ marginBottom: '16px' }}>
        {question.sentence}
      </div>

      {!result ? (
        <div className="card" style={{ textAlign: 'center' }}>
          <div style={{ marginBottom: '2rem' }}>
            <p style={{ fontWeight: 'bold', marginBottom: '1rem', color: 'var(--secondary-color)' }}>STEP 1: 目的語 (O) の数は？</p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
              {[0, 1, 2].map(n => (
                <button key={n} onClick={() => handleOSel(n)} className="btn"
                  style={{
                    background: oCount === n ? 'var(--primary-color)' : 'var(--surface-light)',
                    color: oCount === n ? 'var(--background-color)' : 'var(--text-color)',
                    borderColor: oCount === n ? undefined : 'var(--surface-border) var(--surface-border) var(--surface-border) var(--surface-border)',
                    boxShadow: oCount === n ? 'var(--glow-green)' : 'none',
                    minWidth: '60px'
                  }}>
                  {n}
                </button>
              ))}
            </div>
          </div>

          {oCount !== null && (
            <div style={{ marginBottom: '2rem', animation: 'pixelFadeIn 0.3s ease' }}>
              <p style={{ fontWeight: 'bold', marginBottom: '1rem', color: 'var(--secondary-color)' }}>STEP 2: 補語 (C) はある？</p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                {[0, 1].map(n => (
                  <button key={n} onClick={() => handleCSel(n)} className="btn"
                    style={{
                      background: cCount === n ? 'var(--primary-color)' : 'var(--surface-light)',
                      color: cCount === n ? 'var(--background-color)' : 'var(--text-color)',
                      borderColor: cCount === n ? undefined : 'var(--surface-border) var(--surface-border) var(--surface-border) var(--surface-border)',
                      boxShadow: cCount === n ? 'var(--glow-green)' : 'none',
                      minWidth: '80px'
                    }}>
                    {n === 1 ? 'YES' : 'NO'}
                  </button>
                ))}
              </div>
            </div>
          )}

          {oCount !== null && cCount !== null && (
            <button onClick={checkAnswer} className="btn" style={{
              background: 'var(--accent-color)',
              borderColor: '#ff99bb #993355 #993355 #ff99bb',
              width: '100%',
              padding: '1rem',
              fontSize: '1.1rem'
            }}>
              JUDGE!
            </button>
          )}
        </div>
      ) : (
        <div className="card" style={{
          background: result.isCorrect ? 'rgba(0, 255, 136, 0.05)' : 'rgba(255, 68, 68, 0.05)',
          border: `3px solid ${result.isCorrect ? 'var(--success-color)' : 'var(--error-color)'}`,
          boxShadow: result.isCorrect ? 'var(--glow-green)' : '0 0 12px rgba(255, 68, 68, 0.3)'
        }}>
          <h2 style={{
            color: result.isCorrect ? 'var(--success-color)' : 'var(--error-color)',
            textShadow: result.isCorrect ? '0 0 8px rgba(0, 255, 136, 0.4)' : '0 0 8px rgba(255, 68, 68, 0.4)',
            fontFamily: 'var(--font-jp)'
          }}>
            {result.isCorrect ? "CORRECT!" : "WRONG!"}
          </h2>
          <div style={{ textAlign: 'left', margin: '1rem 0' }}>
            <p>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>あなたの回答:</span>{' '}
              <span style={{ color: PATTERN_COLORS[result.pattern], fontWeight: 'bold', fontFamily: 'var(--font-pixel)', fontSize: '0.8rem', textShadow: `0 0 6px ${PATTERN_COLORS[result.pattern]}66` }}>{PATTERN_LABELS[result.pattern]}</span>
            </p>
            <p>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>正解:</span>{' '}
              <span style={{ color: PATTERN_COLORS[question.correctPattern], fontWeight: 'bold', fontFamily: 'var(--font-pixel)', fontSize: '0.8rem', textShadow: `0 0 6px ${PATTERN_COLORS[question.correctPattern]}66` }}>{PATTERN_LABELS[question.correctPattern]}</span>
            </p>
            <div style={{ marginTop: '1rem', padding: '1rem', background: 'var(--surface-light)', border: '1px solid var(--surface-border)' }}>
              <div style={{ color: 'var(--text-color)' }}><strong style={{ color: 'var(--secondary-color)' }}>HINT:</strong> {result.explanation.overall}</div>
              {result.explanation.trap && (
                <div style={{ marginTop: '0.5rem', color: 'var(--error-color)' }}><strong>TRAP:</strong> {result.explanation.trap}</div>
              )}
            </div>
          </div>
          <button onClick={loadNext} className="next-btn" style={{ width: '100%', marginTop: '1rem' }}>NEXT</button>
        </div>
      )}
    </div>
  );
}
