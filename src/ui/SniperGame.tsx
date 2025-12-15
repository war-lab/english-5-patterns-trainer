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

const PATTERN_LABELS: Record<Pattern, string> = {
  1: 'SV',
  2: 'SVC',
  3: 'SVO',
  4: 'SVOO',
  5: 'SVOC'
};

export default function SniperGame({ mode }: SniperGameProps) {
  // Lazy init to avoid effect state update
  const [question, setQuestion] = useState<Question | null>(() => {
    const answers = store.getAnswers();
    if (mode === 'sniper') {
      return questions[Math.floor(Math.random() * questions.length)];
    }
    return getNextQuestion(questions, answers);
  });

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
    setFeedback({ isCorrect: false, msg: `時間切れ! 正解: ${PATTERN_LABELS[question?.correctPattern as Pattern]}` });

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
      msg: result.isCorrect ? "正解!" : `不正解... ${result.explanation}`
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

  if (!question) return <div>読み込み中...</div>;

  return (
    <div className="game-container">
      <div className="nav-header">
        <Link to="/" className="nav-link">← 戻る</Link>
        <span style={{ fontWeight: 'bold', color: '#666' }}>モード: {mode === 'sniper' ? 'スナイパー' : '復習'}</span>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <div style={{ height: '8px', background: '#eee', borderRadius: '4px', overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${(timeLeft / 2000) * 100}%`,
            background: timeLeft < 500 ? 'var(--error-color)' : 'var(--success-color)',
            transition: 'width 0.1s linear'
          }} />
        </div>
      </div>

      <div className="card question-card">
        {question.sentence}
      </div>

      {feedback && (
        <div className="feedback-overlay" style={{
          backgroundColor: feedback.isCorrect ? 'rgba(46, 204, 113, 0.95)' : 'rgba(231, 76, 60, 0.95)'
        }}>
          {feedback.msg}
        </div>
      )}

      <div className="pattern-grid">
        {([1, 2, 3, 4, 5] as const).map(p => (
          <button key={p} onClick={() => handleAnswer(p)} className="pattern-btn">
            {PATTERN_LABELS[p]}
          </button>
        ))}
      </div>
    </div>
  );
}
