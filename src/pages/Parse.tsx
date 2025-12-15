import { useState } from 'react';
import { Link } from 'react-router-dom';
import { questions } from '../data/questions.seed';
import { judge } from '../logic/judge';
import { store } from '../storage/store';
import type { Question, Pattern, UserAnswer } from '../domain/types';

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
      setResult({ isCorrect: false, msg: "Invalid Combination (Not 1-5)", pattern: 1 }); // Dummy pattern
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

  if (!question) return <div>Loading...</div>;

  return (
    <div className="parse-container" style={{ padding: '20px', textAlign: 'center' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <Link to="/">Back</Link>
        <span>Mode: PARSE</span>
      </div>

      <div className="card" style={{ padding: '30px', fontSize: '1.5rem', background: '#fff', border: '1px solid #ccc', marginBottom: '20px' }}>
        {question.sentence}
      </div>

      {!result ? (
        <div>
          <div style={{ marginBottom: '20px' }}>
            <p>How many **Objects (O)**?</p>
            {[0, 1, 2].map(n => (
              <button key={n} onClick={() => handleOSel(n)}
                style={{ ...btnStyle, background: oCount === n ? '#007bff' : '#eee', color: oCount === n ? '#fff' : '#000' }}>
                {n}
              </button>
            ))}
          </div>

          {oCount !== null && (
            <div style={{ marginBottom: '20px' }}>
              <p>Is there a **Complement (C)**?</p>
              {[0, 1].map(n => (
                <button key={n} onClick={() => handleCSel(n)}
                  style={{ ...btnStyle, background: cCount === n ? '#007bff' : '#eee', color: cCount === n ? '#fff' : '#000' }}>
                  {n === 1 ? 'Yes (1)' : 'No (0)'}
                </button>
              ))}
            </div>
          )}

          {oCount !== null && cCount !== null && (
            <button onClick={checkAnswer} style={{ ...btnStyle, background: '#28a745', color: '#fff', width: '100%' }}>
              Check Pattern
            </button>
          )}
        </div>
      ) : (
        <div>
          <div style={{
            background: result.isCorrect ? '#d4edda' : '#f8d7da',
            color: result.isCorrect ? '#155724' : '#721c24',
            padding: '20px', borderRadius: '5px', marginBottom: '20px'
          }}>
            <h2>{result.isCorrect ? "Correct!" : "Wrong!"}</h2>
            <p>Your Pattern: P{result.pattern}</p>
            <p>Correct: P{question.correctPattern}</p>
            <p>Hint: {result.msg}</p>
          </div>
          <button onClick={loadNext} style={{ ...btnStyle, background: '#007bff', color: '#fff' }}>Next Question</button>
        </div>
      )}
    </div>
  );
}

const btnStyle = {
  padding: '10px 20px',
  margin: '5px',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '1rem'
};
