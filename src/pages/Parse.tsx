import { useState } from 'react';
import { Link } from 'react-router-dom';
import { questions } from '../data/questions.seed';
import { judge } from '../logic/judge';
import { store } from '../storage/store';
import type { Question, Pattern, UserAnswer } from '../domain/types';

const PATTERN_LABELS: Record<Pattern, string> = {
  1: 'SV',
  2: 'SVC',
  3: 'SVO',
  4: 'SVOO',
  5: 'SVOC'
};

export default function Parse() {
  const [question, setQuestion] = useState<Question | null>(() => questions[Math.floor(Math.random() * questions.length)]);
  const [oCount, setOCount] = useState<number | null>(null);
  const [cCount, setCCount] = useState<number | null>(null);
  const [result, setResult] = useState<{ isCorrect: boolean; msg: string; pattern: Pattern } | null>(null);

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

    // Logic to determine pattern from O/C
    let p: Pattern | 0 = 0;
    if (oCount === 0 && cCount === 0) p = 1;
    else if (oCount === 0 && cCount === 1) p = 2;
    else if (oCount === 1 && cCount === 0) p = 3;
    else if (oCount === 2 && cCount === 0) p = 4;
    else if (oCount === 1 && cCount === 1) p = 5;

    if (p === 0) {
      setResult({ isCorrect: false, msg: "無効な組み合わせです", pattern: 1 }); // Dummy pattern
      return;
    }

    const { isCorrect, explanation } = judge(question, p as Pattern);
    setResult({ isCorrect, msg: explanation, pattern: p as Pattern });

    // Save
    const ans: UserAnswer = {
      questionId: question.id,
      chosenPattern: p as Pattern,
      correctPattern: question.correctPattern,
      isCorrect,
      timeMs: 0, // Not timing Parse mode strictly yet
      timestamp: Date.now()
    };
    store.appendAnswer(ans);
  };

  if (!question) return <div>読み込み中...</div>;

  return (
    <div className="parse-container">
      <div className="nav-header">
        <Link to="/" className="nav-link">← 戻る</Link>
        <span style={{ fontWeight: 'bold', color: '#666' }}>モード: 解析</span>
      </div>

      <div className="card question-card" style={{ marginBottom: '20px' }}>
        {question.sentence}
      </div>

      {!result ? (
        <div className="card">
          <div style={{ marginBottom: '2rem' }}>
            <p style={{ fontWeight: 'bold', marginBottom: '1rem' }}>① 目的語 (O) の数は?</p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
              {[0, 1, 2].map(n => (
                <button key={n} onClick={() => handleOSel(n)} className="btn"
                  style={{ background: oCount === n ? 'var(--primary-color)' : '#eee', color: oCount === n ? '#fff' : '#333' }}>
                  {n}
                </button>
              ))}
            </div>
          </div>

          {oCount !== null && (
            <div style={{ marginBottom: '2rem', animation: 'fadeIn 0.3s' }}>
              <p style={{ fontWeight: 'bold', marginBottom: '1rem' }}>② 補語 (C) はある?</p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
                {[0, 1].map(n => (
                  <button key={n} onClick={() => handleCSel(n)} className="btn"
                    style={{ background: cCount === n ? 'var(--primary-color)' : '#eee', color: cCount === n ? '#fff' : '#333' }}>
                    {n === 1 ? 'Yes (ある)' : 'No (ない)'}
                  </button>
                ))}
              </div>
            </div>
          )}

          {oCount !== null && cCount !== null && (
            <button onClick={checkAnswer} className="btn" style={{ background: 'var(--success-color)', width: '100%', padding: '1rem' }}>
              文型を判定する
            </button>
          )}
        </div>
      ) : (
        <div className="card" style={{ background: result.isCorrect ? '#e8f8f5' : '#fdedec', border: `2px solid ${result.isCorrect ? 'var(--success-color)' : 'var(--error-color)'}` }}>
          <h2 style={{ color: result.isCorrect ? 'var(--success-color)' : 'var(--error-color)' }}>
            {result.isCorrect ? "正解!" : "不正解!"}
          </h2>
          <div style={{ textAlign: 'left', margin: '1rem 0' }}>
            <p><strong>あなたの回答:</strong> {PATTERN_LABELS[result.pattern]}</p>
            <p><strong>正解:</strong> {PATTERN_LABELS[question.correctPattern]}</p>
            <div style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(255,255,255,0.7)', borderRadius: '8px' }}>
              <strong>解説:</strong> {result.msg}
            </div>
          </div>
          <button onClick={loadNext} className="btn" style={{ width: '100%', marginTop: '1rem' }}>次の問題へ</button>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
