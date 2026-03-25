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

  // マルチパターン動詞リスト（初回のみ計算）
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

    // 回答を保存
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
    // 同じパターンの問題が複数ある場合、wrongを上書きしない
    if (newStatus[q.correctPattern] !== 'wrong') {
      newStatus[q.correctPattern] = isCorrect ? 'correct' : 'wrong';
    }

    // 比較例文取得
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

  // もう一度（同じ動詞）
  const handleRetry = useCallback(() => {
    if (!session) return;
    handleSelectVerb(session.verb);
  }, [session, handleSelectVerb]);

  // 動詞選択に戻る
  const handleSelectNew = useCallback(() => {
    setSession(null);
    setFeedback(null);
    setPhase('select');
  }, []);

  // キーボードサポート
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (phase === 'select') return;

      // Escape: 動詞選択に戻る
      if (e.key === 'Escape') {
        handleSelectNew();
        return;
      }

      if (phase === 'playing') {
        // 1-5: パターン選択（フィードバック表示中は無効）
        if (!feedback && ['1', '2', '3', '4', '5'].includes(e.key)) {
          handleAnswer(Number(e.key) as Pattern);
        }
        // Enter: 次へ（フィードバック表示中のみ）
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
          <button onClick={() => navigate('/')} className="nav-link">← ホーム</button>
        </div>
        <h2 style={{ textAlign: 'center', marginBottom: '16px' }}>動詞一点集中トレーニング</h2>
        <p style={{ textAlign: 'center', color: '#666', marginBottom: '20px', fontSize: '0.9rem' }}>
          1つの動詞で全文型を体感する
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
          <button onClick={handleSelectNew} className="nav-link">← 動詞選択</button>
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
      {/* ナビゲーション */}
      <div className="nav-header">
        <button onClick={handleSelectNew} className="nav-link">← 動詞選択</button>
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
      <div className="card question-card" style={{ marginBottom: '16px' }}>
        {currentQuestion.sentence}
      </div>

      {/* フィードバックがない場合: パターンボタン */}
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
              <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>[{p}]</div>
            </button>
          ))}
        </div>
      )}

      {/* フィードバック（インライン表示） */}
      {feedback && (
        <div className={`inline-feedback ${feedback.isCorrect ? 'correct' : 'incorrect'}`}>
          {/* 正誤ヘッダー */}
          <div style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '12px' }}>
            {feedback.isCorrect ? '\u2705' : '\u274C'}{' '}
            {feedback.isCorrect ? '正解！' : '不正解...'}{' '}
            <span style={{ color: PATTERN_COLORS[feedback.correctPattern] }}>
              {PATTERN_LABELS[feedback.correctPattern]}
            </span>
          </div>

          {/* 解説 */}
          <div style={{ marginBottom: '12px', fontSize: '0.95rem' }}>
            {feedback.explanation.overall}
          </div>
          {feedback.explanation.trap && (
            <div className="feedback-trap" style={{ marginBottom: '12px' }}>
              {feedback.explanation.trap}
            </div>
          )}

          {/* コレクション通知 */}
          {feedback.collectionUpdate && (
            <div style={{
              padding: '8px 12px',
              background: 'rgba(245, 166, 35, 0.15)',
              borderRadius: '8px',
              marginBottom: '12px',
              fontSize: '0.9rem',
              animation: 'popScale 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            }}>
              {feedback.collectionUpdate.unlocked && (
                <span>NEW カード解放: {feedback.collectionUpdate.verbId}</span>
              )}
              {feedback.collectionUpdate.leveUp && (
                <span>LEVEL UP: {feedback.collectionUpdate.verbId}</span>
              )}
            </div>
          )}

          {/* 比較セクション */}
          {feedback.comparisonExamples.length > 0 && (
            <div className="comparison-section">
              <h4>比べてみよう — 同じ {session.verb.verbId} でも…</h4>
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

          {/* 次へボタン */}
          <button
            onClick={handleNext}
            className="next-btn"
            style={{ marginTop: '16px', width: '100%' }}
          >
            {session.currentIndex + 1 >= session.questions.length ? '結果を見る' : '次へ →'}
            <span style={{ fontSize: '0.8rem', opacity: 0.7, marginLeft: '8px' }}>[Enter]</span>
          </button>
        </div>
      )}
    </div>
  );
}
