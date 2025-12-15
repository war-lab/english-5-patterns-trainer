import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { questions } from '../data/questions.seed';
import { getNextQuestion } from '../logic/scheduler';
import { judge } from '../logic/judge';
import { store } from '../storage/store';
import type { Question, Pattern, UserAnswer } from '../domain/types';

interface SniperGameProps {
  mode: 'sniper' | 'review';
}

export default function SniperGame({ mode }: SniperGameProps) {
  // Lazy init to avoid effect state update
  const [question, setQuestion] = useState<Question | null>(() => {
    const answers = store.getAnswers();
    if (mode === 'sniper') {
      return questions[Math.floor(Math.random() * questions.length)];
    }
    return getNextQuestion(questions, answers);
  });

  // Lazy init starts
  const [feedback, setFeedback] = useState<{ isCorrect: boolean; msg: string } | null>(null);
  const [timeLeft, setTimeLeft] = useState(2000);
  const [isRunning, setIsRunning] = useState(true);
  const [startTime, setStartTime] = useState(() => Date.now());

  const saveResult = useCallback((isCorrect: boolean, timeMs: number, chosen: Pattern) => {
    if (!question) return;
    // eslint-disable-next-line react-hooks/purity
    const timestamp = Date.now();
    const answer: UserAnswer = {
      questionId: question.id,
      chosenPattern: chosen,
      correctPattern: question.correctPattern,
      isCorrect,
      timeMs,
      timestamp
    };
    store.appendAnswer(answer);
  }, [question]);

  const loadNextQuestion = useCallback(() => {
    const answers = store.getAnswers();
    let q: Question;
    if (mode === 'sniper') {
      q = questions[Math.floor(Math.random() * questions.length)];
    } else {
      q = getNextQuestion(questions, answers);
    }
    setQuestion(q);
    setFeedback(null);
    setTimeLeft(2000);
    setStartTime(Date.now());
    setIsRunning(true);
  }, [mode]);

  const handleTimeout = useCallback(() => {
    setIsRunning(false);
    saveResult(false, 2000, 1 as Pattern);
    setFeedback({ isCorrect: false, msg: `Time's up! Pattern: ${question?.correctPattern}` });

    setTimeout(() => {
      loadNextQuestion();
    }, 800);
  }, [question, loadNextQuestion, saveResult]);

  const handleAnswer = useCallback((p: Pattern) => {
    if (!isRunning || !question) return;
    setIsRunning(false);
    // eslint-disable-next-line react-hooks/purity
    const timeTaken = Date.now() - startTime;
    const result = judge(question, p);

    saveResult(result.isCorrect, timeTaken, p);

    setFeedback({
      isCorrect: result.isCorrect,
      msg: result.isCorrect ? "Great!" : `Miss! ${result.explanation}`
    });

    setTimeout(() => {
      loadNextQuestion();
    }, 800);
  }, [isRunning, question, startTime, saveResult, loadNextQuestion]);

  // Timer
  useEffect(() => {
    if (!isRunning) return;
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 100) {
          handleTimeout();
          return 0;
        }
        return prev - 100;
      });
    }, 100);
    return () => clearInterval(interval);
  }, [isRunning, handleTimeout]);

  if (!question) return <div>Loading...</div>;

  return (
    <div className="game-container" style={{ padding: '20px', textAlign: 'center' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <Link to="/">Back</Link>
        <span>Mode: {mode.toUpperCase()}</span>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <div style={{ height: '10px', background: '#eee', borderRadius: '5px' }}>
          <div style={{
            height: '100%',
            width: `${(timeLeft / 2000) * 100}%`,
            background: timeLeft < 500 ? 'red' : 'green',
            transition: 'width 0.1s linear'
          }} />
        </div>
      </div>

      <div className="card" style={{ padding: '40px', fontSize: '1.5rem', background: '#fff', boxShadow: '0 2px 5px rgba(0,0,0,0.1)', marginBottom: '30px', minHeight: '150px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {question.sentence}
      </div>

      {feedback && (
        <div style={{
          position: 'absolute', top: '40%', left: '50%', transform: 'translate(-50%, -50%)',
          background: feedback.isCorrect ? 'rgba(0, 255, 0, 0.9)' : 'rgba(255, 0, 0, 0.9)',
          color: '#fff', padding: '20px', borderRadius: '10px', fontSize: '2rem',
          width: '80%', textAlign: 'center'
        }}>
          {feedback.msg}
        </div>
      )}

      <div className="buttons-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px' }}>
        {([1, 2, 3, 4, 5] as const).map(p => (
          <button key={p} onClick={() => handleAnswer(p)} style={{
            padding: '20px', fontSize: '1.2rem', cursor: 'pointer',
            backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px'
          }}>
            P{p}
          </button>
        ))}
      </div>
    </div>
  );
}
