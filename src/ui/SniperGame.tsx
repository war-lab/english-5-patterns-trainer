import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { questions } from '../data/questions.seed';
import { getNextQuestion } from '../logic/scheduler';
import { judge } from '../logic/judge';
import { store } from '../storage/store';
import { collectionStore } from '../logic/collectionStore';
import type { Question, Pattern, UserAnswer } from '../domain/types';
import { PATTERN_LABELS, PATTERN_COLORS } from '../domain/constants';

interface SniperGameProps {
  mode: 'sniper' | 'review';
}

export default function SniperGame({ mode }: SniperGameProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const deckFilter = searchParams.get('deck'); // e.g. "v:give"

  // Filter questions based on deck if present
  const availableQuestions = useMemo(() => {
    if (!deckFilter) return questions;
    return questions.filter(q => q.tags.includes(deckFilter));
  }, [deckFilter]);

  // Lazy init to avoid effect state update
  const [question, setQuestion] = useState<Question | null>(() => {
    // If deck filter is active, pick random from filtered list
    if (deckFilter) {
      if (availableQuestions.length === 0) return null;
      return availableQuestions[Math.floor(Math.random() * availableQuestions.length)];
    }

    const answers = store.getAnswers();
    if (mode === 'sniper') {
      return questions[Math.floor(Math.random() * questions.length)];
    }
    return getNextQuestion(questions, answers);
  });

  const [feedback, setFeedback] = useState<{
    isCorrect: boolean;
    explanation: { overall: string; trap?: string };
    correctPattern: Pattern;
    collectionUpdate?: { unlocked: boolean; leveUp: boolean; verbId: string };
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

    // コレクション更新
    const verbTag = question.tags.find(t => t.startsWith('v:'));
    let collectionUpdate = undefined;

    if (verbTag) {
      const verbId = verbTag.substring(2);
      const result = collectionStore.addProgress(verbId, isCorrect);

      if (isCorrect && (result.unlocked || result.leveUp)) {
        collectionUpdate = { ...result, verbId };
      }
    }

    return collectionUpdate;
  }, [question]);

  const loadNextQuestion = useCallback(() => {
    const answers = store.getAnswers();
    let q: Question;

    if (availableQuestions.length === 0) {
      navigate('/');
      return;
    }

    if (deckFilter || mode === 'sniper') {
      q = availableQuestions[Math.floor(Math.random() * availableQuestions.length)];
    } else {
      q = getNextQuestion(questions, answers);
    }
    setQuestion(q);
    setFeedback(null);
    setTimeLeft(limitMs);
    setStartTime(Date.now());
    setIsRunning(true);
  }, [mode, limitMs, availableQuestions, deckFilter, navigate]);

  const handleTimeout = useCallback(() => {
    setIsRunning(false);
    saveResult(false, limitMs, 1 as Pattern);
    setFeedback({
      isCorrect: false,
      explanation: question?.explanation || { overall: "TIME UP" },
      correctPattern: question?.correctPattern as Pattern
    });
  }, [question, saveResult, limitMs]);

  const handleAnswer = useCallback((p: Pattern) => {
    if (!isRunning || !question) return;
    setIsRunning(false);
    // eslint-disable-next-line react-hooks/purity
    const timeTaken = Date.now() - startTime;
    const result = judge(question, p);

    const update = saveResult(result.isCorrect, timeTaken, p);

    setFeedback({
      isCorrect: result.isCorrect,
      explanation: result.explanation,
      correctPattern: question.correctPattern,
      collectionUpdate: update
    });
  }, [isRunning, question, startTime, saveResult]);

  // タイマー
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

  // キーボードサポート
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (deckFilter) {
          navigate(-1);
        } else {
          navigate('/');
        }
        return;
      }

      if (isRunning && !feedback) {
        if (['1', '2', '3', '4', '5'].includes(e.key)) {
          handleAnswer(Number(e.key) as Pattern);
        }
      }

      if (e.key === 'Enter' && feedback) {
        loadNextQuestion();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRunning, feedback, handleAnswer, loadNextQuestion, navigate, deckFilter]);

  if (!question) {
    return (
      <div className="game-container">
        <div className="card">
          <p>該当する問題がないでござる。</p>
          <button onClick={() => navigate(-1)} className="next-btn">戻る</button>
        </div>
      </div>
    );
  }

  // タイマーバーの色
  const timerRatio = timeLeft / limitMs;
  const timerColor = timerRatio < 0.2 ? 'var(--error-color)' : timerRatio < 0.5 ? 'var(--warning-color)' : 'var(--primary-color)';
  const timerGlow = timerRatio < 0.2 ? '0 0 8px rgba(255, 68, 68, 0.5)' : timerRatio < 0.5 ? '0 0 8px rgba(255, 221, 0, 0.5)' : '0 0 8px rgba(0, 255, 136, 0.3)';

  return (
    <div className="game-container">
      <div className="nav-header">
        <button onClick={() => deckFilter ? navigate(-1) : navigate('/')} className="nav-link">
          ← BACK [Esc]
        </button>
        <span style={{ fontWeight: 'bold', color: 'var(--secondary-color)', fontFamily: 'var(--font-pixel)', fontSize: '0.65rem', textShadow: '0 0 6px rgba(0, 204, 255, 0.3)' }}>
          {deckFilter ? `DRILL: ${deckFilter}` : (mode === 'sniper' ? 'SNIPER' : 'REVIEW')}
        </span>
      </div>

      {/* タイマーバー */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{
          height: '8px',
          background: 'var(--surface-light)',
          border: '1px solid var(--surface-border)',
          overflow: 'hidden'
        }}>
          <div style={{
            height: '100%',
            width: `${timerRatio * 100}%`,
            background: timerColor,
            boxShadow: timerGlow,
            transition: 'width 0.1s linear'
          }} />
        </div>
        <div style={{
          textAlign: 'right',
          fontSize: '0.6rem',
          fontFamily: 'var(--font-pixel)',
          color: timerColor,
          marginTop: '4px',
          textShadow: `0 0 4px ${timerColor}`
        }}>
          {(timeLeft / 1000).toFixed(1)}s
        </div>
      </div>

      <div className="card question-card">
        {question.sentence}
      </div>

      {feedback && (
        <div className={`feedback-overlay ${feedback.isCorrect ? 'correct' : 'incorrect'}`}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <h2 className="feedback-title">
              {feedback.isCorrect ? "CORRECT!" : "WRONG..."}
            </h2>
            {feedback.collectionUpdate && (
              <div style={{
                background: 'rgba(255, 215, 0, 0.15)',
                padding: '6px 16px',
                border: '2px solid rgba(255, 215, 0, 0.4)',
                marginBottom: '10px',
                color: '#FFD700',
                fontWeight: 'bold',
                fontSize: '0.85rem',
                textShadow: '0 0 6px rgba(255, 215, 0, 0.5)',
                animation: 'popScale 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
              }}>
                {feedback.collectionUpdate.unlocked ? `NEW CARD: ${feedback.collectionUpdate.verbId}!` :
                  feedback.collectionUpdate.leveUp ? `LEVEL UP: ${feedback.collectionUpdate.verbId}!` : ''}
              </div>
            )}
          </div>

          <div className="feedback-content">
            <div className="feedback-section border-bottom">
              <span className="feedback-label">正解文型</span>
              <div className="feedback-value" style={{ color: PATTERN_COLORS[feedback.correctPattern], textShadow: `0 0 8px ${PATTERN_COLORS[feedback.correctPattern]}66` }}>
                {PATTERN_LABELS[feedback.correctPattern]}
              </div>
            </div>

            <div className="feedback-section">
              <div style={{ fontWeight: 'bold', color: 'var(--secondary-color)', marginBottom: '6px', fontSize: '0.85rem' }}>HINT</div>
              <div className="feedback-text">{feedback.explanation.overall}</div>
            </div>

            {feedback.explanation.trap && (
              <div className="feedback-trap">
                <div className="trap-header">TRAP POINT</div>
                <div style={{ fontSize: '0.95rem', color: 'var(--text-color)' }}>{feedback.explanation.trap}</div>
              </div>
            )}
          </div>

          <button onClick={loadNextQuestion} className="next-btn">
            NEXT [Enter]
          </button>
        </div>
      )}

      <div className="pattern-grid">
        {([1, 2, 3, 4, 5] as const).map(p => (
          <button key={p} onClick={() => handleAnswer(p)} className="pattern-btn" disabled={!isRunning}
            style={{ borderColor: PATTERN_COLORS[p], color: PATTERN_COLORS[p] }}
          >
            {PATTERN_LABELS[p]}
            <div style={{ fontSize: '0.6rem', opacity: 0.7, fontFamily: 'var(--font-pixel)' }}>[{p}]</div>
          </button>
        ))}
      </div>

    </div>
  );
}
