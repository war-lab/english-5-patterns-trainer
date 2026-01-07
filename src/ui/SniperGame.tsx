import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { questions } from '../data/questions.seed';
import { getNextQuestion } from '../logic/scheduler';
import { judge } from '../logic/judge';
import { store } from '../storage/store';
import { collectionStore } from '../logic/collectionStore';
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
  // In deck mode, maybe default to faster speed? For now keep same.
  const limitMs = (location.state as { limitMs?: number })?.limitMs ?? 2000;
  const [timeLeft, setTimeLeft] = useState(limitMs);
  const [isRunning, setIsRunning] = useState(true);
  const [startTime, setStartTime] = useState(() => Date.now());

  const saveResult = useCallback((isCorrect: boolean, timeMs: number, chosen: Pattern) => {
    if (!question) return;

    // 1. Save normal stats
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

    // 2. Collection Progress (Unlock / XP)
    // Find the verb tag for this question (starts with v:)
    const verbTag = question.tags.find(t => t.startsWith('v:'));
    let collectionUpdate = undefined;

    if (verbTag) {
      const verbId = verbTag.substring(2); // remove "v:"
      // We process updates even if incorrect (to record "weakness" - implemented as history.wrong)
      // addProgress handles both correct/incorrect logic
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
      navigate('/'); // Safety fallback
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

    const update = saveResult(result.isCorrect, timeTaken, p);

    setFeedback({
      isCorrect: result.isCorrect,
      explanation: result.explanation,
      correctPattern: question.correctPattern,
      collectionUpdate: update
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
        if (deckFilter) {
          // If in training mode, go back to detail or list? 
          // Going back 1 step is safer.
          navigate(-1);
        } else {
          navigate('/');
        }
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
  }, [isRunning, feedback, handleAnswer, loadNextQuestion, navigate, deckFilter]);

  if (!question) {
    return (
      <div className="game-container">
        <div className="card">
          <p>該当する問題がありません。</p>
          <button onClick={() => navigate(-1)} className="next-btn">戻る</button>
        </div>
      </div>
    );
  }

  return (
    <div className="game-container">
      <div className="nav-header">
        <button onClick={() => deckFilter ? navigate(-1) : navigate('/')} className="nav-link" style={{ background: 'none', border: 'none', fontSize: '1rem', cursor: 'pointer' }}>
          ← 戻る (Esc)
        </button>
        <span style={{ fontWeight: 'bold', color: '#666' }}>
          {deckFilter ? `特訓: ${deckFilter}` : (mode === 'sniper' ? 'モード: スナイパー' : 'モード: 復習')}
        </span>
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
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <h2 className="feedback-title">{feedback.isCorrect ? "正解!" : "不正解..."}</h2>
            {feedback.collectionUpdate && (
              <div style={{
                background: 'rgba(255,255,255,0.9)',
                padding: '8px 16px',
                borderRadius: '20px',
                marginBottom: '10px',
                color: '#d32f2f',
                fontWeight: 'bold',
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                animation: 'popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
              }}>
                {feedback.collectionUpdate.unlocked ? `✨ New Card: ${feedback.collectionUpdate.verbId}!` :
                  feedback.collectionUpdate.leveUp ? `🆙 ${feedback.collectionUpdate.verbId} Level Up!` : ''}
              </div>
            )}
          </div>

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

      <style>{`
        @keyframes popIn {
          0% { transform: scale(0); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
