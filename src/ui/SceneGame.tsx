import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { store } from '../storage/store';
import { collectionStore } from '../logic/collectionStore';
import { getNextSceneQuestion, getSceneQuestions, judgeScene } from '../logic/sceneLogic';
import type { SceneJudgeResult } from '../logic/sceneLogic';
import type { Question, Pattern, SceneType, UserAnswer } from '../domain/types';
import {
  PATTERN_LABELS,
  PATTERN_COLORS,
  SCENE_LABELS,
  SCENE_ICONS,
  SCENE_TYPE_MAP,
  SCENE_TO_PATTERN,
} from '../domain/constants';

type Phase = 'scan' | 'lock' | 'result';

const SCENE_TYPES: SceneType[] = ['action', 'state', 'affect', 'transfer', 'transform'];

export default function SceneGame() {
  const navigate = useNavigate();

  // 問題が足りない場合のガード
  const sceneQs = getSceneQuestions();
  if (sceneQs.length === 0) {
    return (
      <div className="game-container">
        <div className="nav-header">
          <button onClick={() => navigate('/')} className="nav-link">← BACK</button>
          <span className="nav-title" style={{ color: 'var(--warning-color)' }}>SCENE</span>
        </div>
        <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)' }}>
          Scene Mode の問題データがありません
        </div>
      </div>
    );
  }

  return <SceneGameInner />;
}

function SceneGameInner() {
  const navigate = useNavigate();

  const [question, setQuestion] = useState<Question>(() => getNextSceneQuestion([]));
  const [phase, setPhase] = useState<Phase>('scan');
  const [chosenScene, setChosenScene] = useState<SceneType | null>(null);
  const [chosenPattern, setChosenPattern] = useState<Pattern | null>(null);
  const [result, setResult] = useState<SceneJudgeResult | null>(null);
  const [startTime, setStartTime] = useState(() => Date.now());

  // セッション統計
  const [sessionStats, setSessionStats] = useState({
    total: 0,
    sceneCorrect: 0,
    perfectStreak: 0,
  });

  // 直近5問の履歴
  const recentIdsRef = useRef<string[]>([]);
  // 直前の誤答情報
  const lastMistakeRef = useRef<{ correctPattern: Pattern; chosenScene: SceneType } | undefined>(undefined);

  // コレクション更新情報
  const [collectionUpdate, setCollectionUpdate] = useState<{
    unlocked: boolean;
    leveUp: boolean;
    verbId: string;
  } | null>(null);

  // LOCK ON 自動遷移タイマー
  const lockTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // --- SCAN: 意味カテゴリ選択 ---
  const handleSceneSelect = useCallback((scene: SceneType) => {
    if (phase !== 'scan') return;
    setChosenScene(scene);

    const correctScene = SCENE_TYPE_MAP[question.correctPattern];
    const isCorrect = scene === correctScene;

    if (isCorrect) {
      // 正解: LOCK ON 自動導出演出 → 自動でresultへ
      setPhase('lock');
      lockTimerRef.current = setTimeout(() => {
        const judgeResult = judgeScene(question, scene, null);
        setResult(judgeResult);
        saveAndTransition(judgeResult, scene, null);
      }, 1500);
    } else {
      // 不正解: RECOVER（文型選択）フェーズへ
      setPhase('lock');
    }
  }, [phase, question]);

  // --- LOCK (RECOVER): 文型選択 ---
  const handlePatternSelect = useCallback((pattern: Pattern) => {
    if (phase !== 'lock' || chosenScene === null) return;
    // 正解時は自動遷移するので、ここは不正解時のみ
    const correctScene = SCENE_TYPE_MAP[question.correctPattern];
    if (chosenScene === correctScene) return;

    setChosenPattern(pattern);
    const judgeResult = judgeScene(question, chosenScene, pattern);
    setResult(judgeResult);
    saveAndTransition(judgeResult, chosenScene, pattern);
  }, [phase, chosenScene, question]);

  // --- 回答保存 & result遷移 ---
  const saveAndTransition = useCallback((judgeResult: SceneJudgeResult, scene: SceneType, pattern: Pattern | null) => {
    const elapsedMs = Date.now() - startTime;

    const answer: UserAnswer = {
      questionId: question.id,
      chosenPattern: judgeResult.isSceneCorrect
        ? judgeResult.derivedPattern
        : pattern!,
      correctPattern: question.correctPattern,
      isCorrect: judgeResult.isPatternCorrect,
      timeMs: elapsedMs,
      timestamp: Date.now(),
      chosenScene: scene,
      correctScene: judgeResult.correctScene,
      isSceneCorrect: judgeResult.isSceneCorrect,
    };
    store.appendAnswer(answer);

    // コレクション更新
    const verbTag = question.tags.find(t => t.startsWith('v:'));
    if (verbTag && judgeResult.isPatternCorrect) {
      const verbId = verbTag.substring(2);
      const expAmount = judgeResult.isSceneCorrect ? 10 : 5;
      const colResult = collectionStore.addProgress(verbId, true, expAmount);
      if (colResult.unlocked || colResult.leveUp) {
        setCollectionUpdate({ ...colResult, verbId });
      }
    }

    // セッション統計更新
    setSessionStats(prev => ({
      total: prev.total + 1,
      sceneCorrect: prev.sceneCorrect + (judgeResult.isSceneCorrect ? 1 : 0),
      perfectStreak: judgeResult.isSceneCorrect ? prev.perfectStreak + 1 : 0,
    }));

    // 誤答情報の記録
    if (!judgeResult.isSceneCorrect) {
      lastMistakeRef.current = {
        correctPattern: question.correctPattern,
        chosenScene: scene,
      };
    } else {
      lastMistakeRef.current = undefined;
    }

    // 直近IDの更新
    recentIdsRef.current = [question.id, ...recentIdsRef.current].slice(0, 5);

    setPhase('result');
  }, [question, startTime]);

  // --- NEXT ---
  const loadNext = useCallback(() => {
    if (lockTimerRef.current) {
      clearTimeout(lockTimerRef.current);
      lockTimerRef.current = null;
    }
    const next = getNextSceneQuestion(recentIdsRef.current, lastMistakeRef.current);
    setQuestion(next);
    setPhase('scan');
    setChosenScene(null);
    setChosenPattern(null);
    setResult(null);
    setCollectionUpdate(null);
    setStartTime(Date.now());
  }, []);

  // --- キーボードショートカット ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        navigate('/');
        return;
      }

      if (phase === 'scan') {
        const idx = parseInt(e.key) - 1;
        if (idx >= 0 && idx < SCENE_TYPES.length) {
          handleSceneSelect(SCENE_TYPES[idx]);
        }
      } else if (phase === 'lock') {
        // 不正解時のみ文型選択を受け付ける
        const correctScene = SCENE_TYPE_MAP[question.correctPattern];
        if (chosenScene !== correctScene) {
          const num = parseInt(e.key);
          if (num >= 1 && num <= 5) {
            handlePatternSelect(num as Pattern);
          }
        }
      } else if (phase === 'result') {
        if (e.key === 'Enter') {
          loadNext();
        }
      }

      // LOCK ON 中にEnterで即スキップ（UX改善: クリック/Enterスキップ）
      if (phase === 'lock' && e.key === 'Enter') {
        const correctScene = SCENE_TYPE_MAP[question.correctPattern];
        if (chosenScene === correctScene && lockTimerRef.current) {
          clearTimeout(lockTimerRef.current);
          lockTimerRef.current = null;
          const judgeResult = judgeScene(question, chosenScene, null);
          setResult(judgeResult);
          saveAndTransition(judgeResult, chosenScene, null);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [phase, chosenScene, question, handleSceneSelect, handlePatternSelect, loadNext, navigate, saveAndTransition]);

  // cleanup
  useEffect(() => {
    return () => {
      if (lockTimerRef.current) clearTimeout(lockTimerRef.current);
    };
  }, []);

  const correctScene = SCENE_TYPE_MAP[question.correctPattern];
  const isScenCorrect = chosenScene === correctScene;

  return (
    <div className="game-container">
      {/* ナビヘッダー */}
      <div className="nav-header">
        <button onClick={() => navigate('/')} className="nav-link">← BACK [Esc]</button>
        <span className="nav-title" style={{ color: 'var(--warning-color)', textShadow: '0 0 8px rgba(255, 221, 0, 0.4)' }}>SCENE</span>
      </div>

      {/* フェーズインジケーター + セッション統計 */}
      <div className="phase-indicator">
        <div className="phase-step">
          <div className={`phase-dot ${
            phase === 'scan' ? 'active scan-active' :
            phase === 'lock' || phase === 'result' ? 'completed' : 'pending'
          }`} />
          <div className="phase-label">SCAN</div>
        </div>
        <div className={`phase-line ${phase !== 'scan' ? 'filled' : ''}`} />
        <div className="phase-step">
          <div className={`phase-dot ${
            phase === 'lock' ? 'active lock-active' :
            phase === 'result' ? 'completed' : 'pending'
          }`} />
          <div className="phase-label">LOCK</div>
        </div>
        {sessionStats.total > 0 && (
          <div className="scene-session-stats">
            <span>{sessionStats.sceneCorrect}/{sessionStats.total} ({Math.round((sessionStats.sceneCorrect / sessionStats.total) * 100)}%)</span>
            {sessionStats.perfectStreak > 0 && (
              <span className="perfect-streak">PERFECT {sessionStats.perfectStreak}</span>
            )}
          </div>
        )}
      </div>

      {/* 問題カード */}
      <div className="card" style={{ marginBottom: '16px' }}>
        <div style={{
          fontSize: '1.3rem',
          fontWeight: 'bold',
          textAlign: 'center',
          padding: '16px 12px',
          lineHeight: 1.6,
          color: 'var(--text-color)',
        }}>
          {question.sentence}
        </div>
      </div>

      {/* ステップエリア */}
      {phase === 'scan' && (
        <ScanPhase onSelect={handleSceneSelect} />
      )}

      {phase === 'lock' && chosenScene !== null && (
        isScenCorrect ? (
          <LockOnPhase chosenScene={chosenScene} />
        ) : (
          <RecoverPhase
            chosenScene={chosenScene}
            onSelect={handlePatternSelect}
          />
        )
      )}

      {phase === 'result' && result !== null && chosenScene !== null && (
        <ResultPhase
          result={result}
          question={question}
          chosenScene={chosenScene}
          chosenPattern={chosenPattern}
          collectionUpdate={collectionUpdate}
          onNext={loadNext}
        />
      )}
    </div>
  );
}

// --- SCAN フェーズ ---
function ScanPhase({ onSelect }: { onSelect: (s: SceneType) => void }) {
  return (
    <div style={{ animation: 'pixelFadeIn 0.3s ease' }}>
      <div style={{ textAlign: 'center', marginBottom: '12px' }}>
        <div style={{
          fontFamily: 'var(--font-pixel)',
          fontSize: '0.7rem',
          color: 'var(--warning-color)',
          textShadow: '0 0 8px rgba(255, 221, 0, 0.4)',
          letterSpacing: '0.15em',
        }}>
          WHAT'S HAPPENING?
        </div>
        <div style={{
          fontSize: '0.85rem',
          color: 'var(--text-secondary)',
          marginTop: '2px',
        }}>
          何が起きてる？
        </div>
      </div>
      <div className="scene-card-list">
        {SCENE_TYPES.map((st, idx) => (
          <button
            key={st}
            className="scene-card"
            onClick={() => onSelect(st)}
            title={SCENE_LABELS[st].full}
          >
            <span className="scene-card-icon">{SCENE_ICONS[st]}</span>
            <span className="scene-card-name">{SCENE_LABELS[st].short}</span>
            <span className="scene-card-key">[{idx + 1}]</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// --- LOCK ON フェーズ（正解時: 自動導出演出） ---
function LockOnPhase({ chosenScene }: { chosenScene: SceneType }) {
  const derivedPattern = SCENE_TO_PATTERN[chosenScene];
  return (
    <div style={{ animation: 'pixelFadeIn 0.3s ease' }}>
      {/* ロック済み表示 */}
      <div className="scene-locked correct">
        <span className="scene-locked-badge" style={{ color: 'var(--success-color)' }}>SCAN ✓</span>
        <span className="scene-locked-icon">{SCENE_ICONS[chosenScene]}</span>
        <span className="scene-locked-name">{SCENE_LABELS[chosenScene].short}</span>
      </div>

      {/* LOCK ON 演出 */}
      <div style={{ textAlign: 'center', marginTop: '20px' }}>
        <div style={{
          fontFamily: 'var(--font-pixel)',
          fontSize: '0.7rem',
          color: 'var(--secondary-color)',
          textShadow: '0 0 8px rgba(0, 204, 255, 0.4)',
          letterSpacing: '0.15em',
          marginBottom: '16px',
        }}>
          LOCK ON
        </div>
        <div className="lock-on-pattern" style={{ color: PATTERN_COLORS[derivedPattern] }}>
          {PATTERN_LABELS[derivedPattern]}
        </div>
        <div className="lock-on-connection">
          <span className="scene-icon">{SCENE_ICONS[chosenScene]}</span>
          <span className="arrow"> {SCENE_LABELS[chosenScene].short}</span>
          <span className="arrow"> → </span>
          <span className="pattern-name" style={{ color: PATTERN_COLORS[derivedPattern] }}>{PATTERN_LABELS[derivedPattern]}</span>
        </div>
      </div>
    </div>
  );
}

// --- RECOVER フェーズ（不正解時: 文型選択） ---
function RecoverPhase({
  chosenScene,
  onSelect,
}: {
  chosenScene: SceneType;
  onSelect: (p: Pattern) => void;
}) {
  return (
    <div style={{ animation: 'pixelFadeIn 0.3s ease' }}>
      {/* 不正解ロック表示 */}
      <div className="scene-locked wrong">
        <span className="scene-locked-badge" style={{ color: 'var(--error-color)' }}>SCAN ✗</span>
        <span className="scene-locked-icon">{SCENE_ICONS[chosenScene]}</span>
        <span className="scene-locked-name">{SCENE_LABELS[chosenScene].short}</span>
      </div>

      <div style={{ textAlign: 'center', marginTop: '16px' }}>
        <div className="recover-prompt">RECOVER</div>
        <div className="recover-sub">文型だけでも当てろ</div>
      </div>

      <div className="pattern-grid">
        {([1, 2, 3, 4, 5] as Pattern[]).map(p => (
          <button
            key={p}
            className="pattern-btn"
            style={{ borderColor: PATTERN_COLORS[p], color: PATTERN_COLORS[p] }}
            onClick={() => onSelect(p)}
          >
            <div>{PATTERN_LABELS[p]}</div>
            <div style={{ fontSize: '0.5rem', fontFamily: 'var(--font-pixel)', opacity: 0.6 }}>[{p}]</div>
          </button>
        ))}
      </div>
    </div>
  );
}

// --- RESULT フェーズ ---
function ResultPhase({
  result,
  question,
  chosenScene,
  chosenPattern,
  collectionUpdate,
  onNext,
}: {
  result: SceneJudgeResult;
  question: Question;
  chosenScene: SceneType;
  chosenPattern: Pattern | null;
  collectionUpdate: { unlocked: boolean; leveUp: boolean; verbId: string } | null;
  onNext: () => void;
}) {
  const { resultType, correctScene, correctPattern } = result;

  // 背景色と枠色
  const bgColor =
    resultType === 'perfect' ? '#0a2a1a' :
    resultType === 'partial' ? '#1a0a2a' : '#2a0a0a';
  const borderColor =
    resultType === 'perfect' ? '#00ff88' :
    resultType === 'partial' ? '#cc66ff' : '#ff4444';

  // タイトル
  const titleText =
    resultType === 'perfect' ? 'PERFECT!' :
    resultType === 'partial' ? 'PARTIAL...' : 'WRONG...';
  const titleAnimation =
    resultType === 'perfect' ? 'correctBlink 0.6s ease' :
    resultType === 'partial' ? 'neonPulse 2s ease-in-out infinite' : 'incorrectShake 0.5s ease';

  // 経験値表示
  const expGained = resultType === 'perfect' ? 10 : resultType === 'partial' ? 5 : 0;

  return (
    <div
      style={{
        background: bgColor,
        border: `2px solid ${borderColor}`,
        padding: '20px 16px',
        animation: 'pixelFadeIn 0.3s ease',
      }}
    >
      {/* タイトル */}
      <div style={{
        textAlign: 'center',
        fontFamily: 'var(--font-pixel)',
        fontSize: '1rem',
        color: borderColor,
        textShadow: `0 0 10px ${borderColor}`,
        animation: titleAnimation,
        marginBottom: '16px',
        letterSpacing: '0.1em',
      }}>
        {titleText}
      </div>

      {/* PERFECT: 最小表示 */}
      {resultType === 'perfect' && (
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.9rem', color: 'var(--text-color)', marginBottom: '8px' }}>
            <span style={{ fontFamily: 'var(--font-pixel)', color: 'var(--warning-color)', fontSize: '0.7rem' }}>{SCENE_ICONS[correctScene]}</span>
            {' '}{SCENE_LABELS[correctScene].short} → <span style={{ color: PATTERN_COLORS[correctPattern], fontFamily: 'var(--font-pixel)', fontWeight: 'bold' }}>{PATTERN_LABELS[correctPattern]}</span>
          </div>
          {question.sceneDescription && (
            <div className="scene-hint">「{question.sceneDescription}」</div>
          )}
        </div>
      )}

      {/* PARTIAL: SCANの不正解を強調 */}
      {resultType === 'partial' && (
        <div>
          <div className="answer-compare" style={{ marginBottom: '4px' }}>
            <span className="answer-compare-label">あなた:</span>
            <span className="answer-compare-wrong">
              {SCENE_ICONS[chosenScene]} {SCENE_LABELS[chosenScene].short}
            </span>
          </div>
          <div className="answer-compare" style={{ marginBottom: '12px' }}>
            <span className="answer-compare-label">正解:</span>
            <span className="answer-compare-correct">
              {SCENE_ICONS[correctScene]} {SCENE_LABELS[correctScene].short}
            </span>
          </div>
          {question.sceneDescription && (
            <div className="scene-hint">「{question.sceneDescription}」</div>
          )}
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '8px' }}>
            <span style={{ color: 'var(--secondary-color)', fontFamily: 'var(--font-pixel)', fontSize: '0.6rem' }}>HINT: </span>
            {question.explanation.overall}
          </div>
        </div>
      )}

      {/* WRONG: 両方の正解を表示 */}
      {resultType === 'wrong' && (
        <div>
          <div style={{ marginBottom: '8px' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 'bold', marginBottom: '4px' }}>意味</div>
            <div className="answer-compare">
              <span className="answer-compare-label">あなた:</span>
              <span className="answer-compare-wrong">{SCENE_ICONS[chosenScene]} {SCENE_LABELS[chosenScene].short}</span>
            </div>
            <div className="answer-compare">
              <span className="answer-compare-label">正解:</span>
              <span className="answer-compare-correct">{SCENE_ICONS[correctScene]} {SCENE_LABELS[correctScene].short}</span>
            </div>
          </div>
          <div style={{ marginBottom: '12px' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 'bold', marginBottom: '4px' }}>文型</div>
            <div className="answer-compare">
              <span className="answer-compare-label">あなた:</span>
              <span className="answer-compare-wrong">{PATTERN_LABELS[chosenPattern!]}</span>
            </div>
            <div className="answer-compare">
              <span className="answer-compare-label">正解:</span>
              <span className="answer-compare-correct" style={{ color: PATTERN_COLORS[correctPattern] }}>{PATTERN_LABELS[correctPattern]}</span>
            </div>
          </div>
          {question.sceneDescription && (
            <div className="scene-hint">「{question.sceneDescription}」</div>
          )}
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '8px' }}>
            <span style={{ color: 'var(--secondary-color)', fontFamily: 'var(--font-pixel)', fontSize: '0.6rem' }}>HINT: </span>
            {question.explanation.overall}
          </div>
          {question.explanation.trap && (
            <div style={{ fontSize: '0.85rem', color: 'var(--warning-color)', marginTop: '4px' }}>
              <span style={{ fontFamily: 'var(--font-pixel)', fontSize: '0.6rem' }}>TRAP: </span>
              {question.explanation.trap}
            </div>
          )}
        </div>
      )}

      {/* 経験値 & コレクション */}
      {expGained > 0 && (
        <div style={{ textAlign: 'center', marginTop: '10px', fontSize: '0.8rem', color: 'var(--secondary-color)', fontFamily: 'var(--font-pixel)' }}>
          +{expGained} XP
        </div>
      )}
      {collectionUpdate && (
        <div style={{ textAlign: 'center', marginTop: '4px', fontSize: '0.75rem', color: 'var(--accent-color)' }}>
          {collectionUpdate.unlocked && `🃏 ${collectionUpdate.verbId} カード獲得！`}
          {collectionUpdate.leveUp && `⬆ ${collectionUpdate.verbId} レベルアップ！`}
        </div>
      )}

      {/* NEXT ボタン */}
      <button
        className="start-btn"
        onClick={onNext}
        style={{ width: '100%', marginTop: '16px' }}
      >
        NEXT [Enter]
      </button>
    </div>
  );
}
