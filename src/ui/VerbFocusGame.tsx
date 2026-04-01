import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { store } from '../storage/store';
import { collectionStore } from '../logic/collectionStore';
import { getMultiPatternVerbs, buildSession, getComparisonExamples } from '../logic/verbFocusLogic';
import type { MultiPatternVerb } from '../logic/verbFocusLogic';
import type { Pattern, UserAnswer, Question } from '../domain/types';
import { PATTERN_LABELS, PATTERN_COLORS } from '../domain/constants';
import PatternMap from './PatternMap';
import VerbFocusSelect from './VerbFocusSelect';
import VerbFocusSummary, { type SessionResult } from './VerbFocusSummary';

type Phase = 'select' | 'playing' | 'summary';

interface SessionState {
  verb: MultiPatternVerb;
  questions: Question[];
  currentIndex: number;
  results: SessionResult[];
  patternStatus: Record<number, 'correct' | 'wrong' | 'unanswered'>;
}

interface FeedbackState {
  isCorrect: boolean;
  explanation: { overall: string; trap?: string };
  correctPattern: Pattern;
  chosenPattern: Pattern;
  comparisonExamples: { pattern: Pattern; example: Question }[];
  collectionUpdate?: { unlocked: boolean; leveUp: boolean; verbId: string };
}

/** 動詞一点集中トレーニング メインコンポーネント */
export default function VerbFocusGame() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<Phase>('select');
  const [session, setSession] = useState<SessionState | null>(null);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [startTime, setStartTime] = useState(0);

  // マルチパターン動詞リスト
  const multiPatternVerbs = useMemo(() => getMultiPatternVerbs(), []);

  // 動詞選択 → プレイ開始
  const handleSelectVerb = useCallback((verb: MultiPatternVerb) => {
    const sessionQuestions = buildSession(verb);
    const initialStatus: Record<number, 'correct' | 'wrong' | 'unanswered'> = {};
    for (const p of verb.patterns) {
      initialStatus[p] = 'unanswered';
    }
    setSession({
      verb,
      questions: sessionQuestions,
      currentIndex: 0,
      results: [],
      patternStatus: initialStatus,
    });
    setFeedback(null);
    setStartTime(Date.now());
    setPhase('playing');
  }, []);

  // 回答処理
  const handleAnswer = useCallback((chosenPattern: Pattern) => {
    if (!session || feedback) return;
    const q = session.questions[session.currentIndex];
    const timeTaken = Date.now() - startTime;
    const isCorrect = q.correctPattern === chosenPattern;

    const answer: UserAnswer = {
      questionId: q.id,
      chosenPattern,
      correctPattern: q.correctPattern,
      isCorrect,
      timeMs: timeTaken,
      timestamp: Date.now(),
    };
    store.appendAnswer(answer);

    // コレクション更新
    const verbTag = q.tags.find(t => t.startsWith('v:'));
    let collectionUpdate: FeedbackState['collectionUpdate'];
    if (verbTag) {
      const verbId = verbTag.substring(2);
      const result = collectionStore.addProgress(verbId, isCorrect);
      if (isCorrect && (result.unlocked || result.leveUp)) {
        collectionUpdate = { ...result, verbId };
      }
    }

    // パターンマップ更新
    const newStatus = { ...session.patternStatus };
    if (newStatus[q.correctPattern] !== 'wrong') {
      newStatus[q.correctPattern] = isCorrect ? 'correct' : 'wrong';
    }

    const comparisons = getComparisonExamples(session.verb, q.correctPattern);

    setSession(prev => prev ? {
      ...prev,
      results: [...prev.results, { question: q, chosenPattern, isCorrect }],
      patternStatus: newStatus,
    } : null);

    setFeedback({
      isCorrect,
      explanation: q.explanation,
      correctPattern: q.correctPattern,
      chosenPattern,
      comparisonExamples: comparisons,
      collectionUpdate,
    });
  }, [session, feedback, startTime]);

  // 次の問題 or サマリーへ
  const handleNext = useCallback(() => {
    if (!session) return;
    const nextIndex = session.currentIndex + 1;
    if (nextIndex >= session.questions.length) {
      setPhase('summary');
    } else {
      setSession(prev => prev ? { ...prev, currentIndex: nextIndex } : null);
      setFeedback(null);
      setStartTime(Date.now());
    }
  }, [session]);

  const handleRetry = useCallback(() => {
    if (!session) return;
    handleSelectVerb(session.verb);
  }, [session, handleSelectVerb]);

  const handleSelectNew = useCallback(() => {
    setSession(null);
    setFeedback(null);
    setPhase('select');
  }, []);

  // キーボードサポート
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (phase === 'select') return;

      if (e.key === 'Escape') {
        handleSelectNew();
        return;
      }

      if (phase === 'playing') {
        if (!feedback && ['1', '2', '3', '4', '5'].includes(e.key)) {
          handleAnswer(Number(e.key) as Pattern);
        }
        if (e.key === 'Enter' && feedback) {
          handleNext();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [phase, feedback, handleAnswer, handleNext, handleSelectNew]);

  // === 動詞選択フェーズ ===
  if (phase === 'select') {
    return (
      <div className="game-container">
        <div className="nav-header">
          <button onClick={() => navigate('/')} className="nav-link">← HOME</button>
        </div>
        <h2 style={{ textAlign: 'center', marginBottom: '12px', fontFamily: 'var(--font-pixel)', fontSize: '0.75rem', color: 'var(--secondary-color)', textShadow: '0 0 6px rgba(0, 204, 255, 0.3)' }}>VERB FOCUS</h2>
        <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '16px', fontSize: '0.85rem', fontFamily: 'var(--font-jp)' }}>
          1つの動詞で全文型を体感せよ
        </p>
        <VerbFocusSelect verbs={multiPatternVerbs} onSelect={handleSelectVerb} />
      </div>
    );
  }

  // === サマリーフェーズ ===
  if (phase === 'summary' && session) {
    return (
      <div className="game-container">
        <div className="nav-header">
          <button onClick={handleSelectNew} className="nav-link">← SELECT</button>
        </div>
        <VerbFocusSummary
          verbId={session.verb.verbId}
          meaning={session.verb.meaning}
          rarity={session.verb.rarity}
          results={session.results}
          allPatterns={session.verb.patterns}
          patternMap={session.patternStatus}
          onRetry={handleRetry}
          onSelectNew={handleSelectNew}
          onGoHome={() => navigate('/')}
        />
      </div>
    );
  }

  // === プレイフェーズ ===
  if (!session) return null;
  const currentQuestion = session.questions[session.currentIndex];

  return (
    <div className="game-container">
      <div className="nav-header">
        <button onClick={handleSelectNew} className="nav-link">← SELECT</button>
      </div>

      {/* 動詞ヘッダー */}
      <div className="verb-focus-header">
        <div>
          <span className="verb-name">{session.verb.verbId}</span>
          <span className="verb-meaning">{session.verb.meaning}</span>
        </div>
        <span className="verb-focus-progress">
          {session.currentIndex + 1} / {session.questions.length}
        </span>
      </div>

      {/* パターンマップ */}
      <PatternMap
        allPatterns={session.verb.patterns}
        answeredPatterns={session.patternStatus}
      />

      {/* 問題文 */}
      <div className="card question-card" style={{ marginBottom: '14px' }}>
        {currentQuestion.sentence}
      </div>

      {/* パターンボタン */}
      {!feedback && (
        <div className="pattern-grid">
          {([1, 2, 3, 4, 5] as Pattern[]).map(p => (
            <button
              key={p}
              onClick={() => handleAnswer(p)}
              className="pattern-btn"
              style={{ borderColor: PATTERN_COLORS[p], color: PATTERN_COLORS[p] }}
            >
              {PATTERN_LABELS[p]}
              <div style={{ fontSize: '0.7rem', opacity: 0.7, fontFamily: 'var(--font-pixel)' }}>[{p}]</div>
            </button>
          ))}
        </div>
      )}

      {/* インラインフィードバック */}
      {feedback && (
        <div className={`inline-feedback ${feedback.isCorrect ? 'correct' : 'incorrect'}`}>
          <div style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '10px' }}>
            <span style={{ color: feedback.isCorrect ? 'var(--success-color)' : 'var(--error-color)' }}>
              {feedback.isCorrect ? 'CORRECT!' : 'WRONG...'}
            </span>{' '}
            <span style={{ color: PATTERN_COLORS[feedback.correctPattern], fontFamily: 'var(--font-pixel)', fontSize: '0.75rem', textShadow: `0 0 6px ${PATTERN_COLORS[feedback.correctPattern]}66` }}>
              {PATTERN_LABELS[feedback.correctPattern]}
            </span>
          </div>

          <div style={{ marginBottom: '10px', fontSize: '0.9rem', color: 'var(--text-color)' }}>
            {feedback.explanation.overall}
          </div>
          {feedback.explanation.trap && (
            <div className="feedback-trap" style={{ marginBottom: '10px' }}>
              {feedback.explanation.trap}
            </div>
          )}

          {/* コレクション通知 */}
          {feedback.collectionUpdate && (
            <div style={{
              padding: '6px 12px',
              background: 'rgba(255, 215, 0, 0.1)',
              border: '1px solid rgba(255, 215, 0, 0.3)',
              marginBottom: '10px',
              fontSize: '0.85rem',
              color: '#FFD700',
              fontWeight: 'bold',
              textShadow: '0 0 6px rgba(255, 215, 0, 0.4)',
              animation: 'popScale 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            }}>
              {feedback.collectionUpdate.unlocked && (
                <span>NEW CARD: {feedback.collectionUpdate.verbId}</span>
              )}
              {feedback.collectionUpdate.leveUp && (
                <span>LEVEL UP: {feedback.collectionUpdate.verbId}</span>
              )}
            </div>
          )}

          {/* 比較セクション */}
          {feedback.comparisonExamples.length > 0 && (
            <div className="comparison-section">
              <h4>同じ {session.verb.verbId} でも...</h4>
              {feedback.comparisonExamples.map(({ pattern, example }) => (
                <div key={pattern} className="comparison-item">
                  <span className="comparison-pattern-badge" style={{ background: PATTERN_COLORS[pattern] }}>
                    {PATTERN_LABELS[pattern]}
                  </span>
                  <span className="comparison-sentence">{example.sentence}</span>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={handleNext}
            className="next-btn"
            style={{ marginTop: '14px', width: '100%' }}
          >
            {session.currentIndex + 1 >= session.questions.length ? 'RESULT' : 'NEXT →'}
            <span style={{ fontSize: '0.7rem', opacity: 0.7, marginLeft: '8px', fontFamily: 'var(--font-pixel)' }}>[Enter]</span>
          </button>
        </div>
      )}
    </div>
  );
}
