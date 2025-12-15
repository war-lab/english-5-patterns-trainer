import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
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
  const navigate = useNavigate();

  // Lazy init to avoid effect state update
  const [question, setQuestion] = useState<Question | null>(() => {
    const answers = store.getAnswers();
    if (mode === 'sniper') {
      return questions[Math.floor(Math.random() * questions.length)];
    }
    return getNextQuestion(questions, answers);
  });

  const [feedback, setFeedback] = useState<{
    isCorrect: boolean;
    explanation: { overall: string; trap?: string };
    correctPattern: Pattern
  } | null>(null);

  const location = useLocation();
  const limitMs = (location.state as { limitMs?: number })?.limitMs ?? 2000;
  const [timeLeft, setTimeLeft] = useState(limitMs);
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
    setTimeLeft(limitMs);
    setStartTime(Date.now());
    setIsRunning(true);
  }, [mode, limitMs]);

  const handleTimeout = useCallback(() => {
    setIsRunning(false);
    saveResult(false, limitMs, 1 as Pattern);
    setFeedback({
      isCorrect: false,
      explanation: question?.explanation || { overall: "時間切れ" },
      correctPattern: question?.correctPattern as Pattern
    });
    // No auto-advance
  }, [question, saveResult, limitMs]);

  const handleAnswer = useCallback((p: Pattern) => {
    if (!isRunning || !question) return;
    setIsRunning(false);
    // eslint-disable-next-line react-hooks/purity
    const timeTaken = Date.now() - startTime;
    const result = judge(question, p);

    saveResult(result.isCorrect, timeTaken, p);

    setFeedback({
      isCorrect: result.isCorrect,
      explanation: result.explanation,
      correctPattern: question.correctPattern
    });
    // No auto-advance
  }, [isRunning, question, startTime, saveResult]);

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

  // Keyboard support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape to quit
      if (e.key === 'Escape') {
        navigate('/');
        return;
      }

      // 1-5 for answering
      if (isRunning && !feedback) {
        if (['1', '2', '3', '4', '5'].includes(e.key)) {
          handleAnswer(Number(e.key) as Pattern);
        }
      }

      // Enter for next (only when feedback is shown)
      if (e.key === 'Enter' && feedback) {
        loadNextQuestion();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRunning, feedback, handleAnswer, loadNextQuestion, navigate]);

  if (!question) return <div>読み込み中...</div>;

  return (
    <div className="game-container">
      <div className="nav-header">
        <Link to="/" className="nav-link">← 戻る (Esc)</Link>
        <span style={{ fontWeight: 'bold', color: '#666' }}>モード: {mode === 'sniper' ? 'スナイパー' : '復習'}</span>
      </div>



      <div style={{ marginBottom: '20px' }}>
        <div style={{ height: '8px', background: '#eee', borderRadius: '4px', overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${(timeLeft / limitMs) * 100}%`,
            background: timeLeft < 500 ? 'var(--error-color)' : 'var(--success-color)',
            transition: 'width 0.1s linear'
          }} />
        </div>
      </div>

      <div className="card question-card">
        {question.sentence}
      </div>

      {feedback && (
        <div className={`feedback-overlay ${feedback.isCorrect ? 'correct' : 'incorrect'}`}>
          <h2 className="feedback-title">{feedback.isCorrect ? "正解!" : "不正解..."}</h2>

          <div className="feedback-content">
            <div className="feedback-section border-bottom">
              <span className="feedback-label">正解文型</span>
              <div className="feedback-value">
                {PATTERN_LABELS[feedback.correctPattern]}
              </div>
            </div>

            <div className="feedback-section">
              <div style={{ fontWeight: 'bold', color: '#555', marginBottom: '5px' }}>💡 解説</div>
              <div className="feedback-text">{feedback.explanation.overall}</div>
            </div>

            {feedback.explanation.trap && (
              <div className="feedback-trap">
                <div className="trap-header">⚠️ 引っかけポイント</div>
                <div style={{ fontSize: '1rem' }}>{feedback.explanation.trap}</div>
              </div>
            )}
          </div>

          <button onClick={loadNextQuestion} className="next-btn">
            次へ (Enter)
          </button>
        </div>
      )}

      <div className="pattern-grid">
        {([1, 2, 3, 4, 5] as const).map(p => (
          <button key={p} onClick={() => handleAnswer(p)} className="pattern-btn" disabled={!isRunning}>
            {PATTERN_LABELS[p]}
            <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>[{p}]</div>
          </button>
        ))}
      </div>
    </div>
  );
}
