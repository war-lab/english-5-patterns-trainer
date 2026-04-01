import { useState } from 'react';
import { Link } from 'react-router-dom';
import { store } from '../storage/store';
import { calculateStats } from '../logic/stats';
import type { StatsSummary, Pattern } from '../domain/types';
import { PATTERN_LABELS, PATTERN_COLORS } from '../domain/constants';

export default function Home() {
  const [stats] = useState<StatsSummary | null>(() => {
    const answers = store.getAnswers();
    return calculateStats(answers);
  });
  const [limitMs, setLimitMs] = useState(2000);

  return (
    <div className="home-container">
      {/* レトロタイトル */}
      <div className="retro-title">
        <h1 className="retro-title-main">英語5文型トレーナー</h1>
        <div className="retro-title-sub">English 5 Patterns Trainer</div>
        <div className="retro-title-border">
          <span /><span /><span /><span /><span />
        </div>
      </div>

      <div className="grid-menu">
        <div className="menu-item" style={{ cursor: 'default' }}>
          <h3>SNIPER MODE</h3>
          <span style={{ marginBottom: '10px' }}>制限時間で撃ち抜け！</span>
          <div style={{ fontSize: '0.85rem', marginBottom: '6px', color: 'var(--text-secondary)', fontWeight: 'bold' }}>制限時間</div>
          <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'wrap' }}>
            {[2000, 4000, 6000, 8000, 10000].map(ms => (
              <button
                key={ms}
                onClick={(e) => {
                  e.preventDefault();
                  setLimitMs(ms);
                }}
                className={`time-config-btn ${limitMs === ms ? 'active' : ''}`}
              >
                {ms / 1000}s
              </button>
            ))}
          </div>
          <Link
            to="/sniper"
            state={{ limitMs }}
            className="start-btn"
          >
            START
          </Link>
        </div>
        <Link to="/scene" className="menu-item">
          <h3 style={{ color: 'var(--warning-color)', textShadow: '0 0 8px rgba(255, 221, 0, 0.4)' }}>SCENE MODE <span style={{ fontSize: '0.7rem', color: 'var(--accent-color)' }}>★NEW</span></h3>
          <span>意味で見抜け</span>
        </Link>
        <Link to="/parse" className="menu-item">
          <h3>PARSE MODE</h3>
          <span>V-O-Cを判別せよ</span>
        </Link>
        <Link to="/review" className="menu-item">
          <h3>REVIEW MODE</h3>
          <span>苦手を克服せよ</span>
        </Link>
        <Link to="/verb-focus" className="menu-item">
          <h3>VERB FOCUS</h3>
          <span>同じ動詞、違う文型</span>
        </Link>
        <Link to="/collection" className="menu-item">
          <h3>COLLECTION</h3>
          <span>集めて育てろ</span>
        </Link>
      </div>

      {/* 学習状況 */}
      <div className="stats-container">
        <h2 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>STATS</h2>
        {stats ? (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: '1rem', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>TOTAL</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: 'var(--secondary-color)', fontFamily: 'var(--font-pixel)', textShadow: '0 0 6px rgba(0, 204, 255, 0.3)' }}>{stats.totalQuestions}</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>ACCURACY</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: 'var(--primary-color)', fontFamily: 'var(--font-pixel)', textShadow: '0 0 6px rgba(0, 255, 136, 0.3)' }}>{(stats.accuracy * 100).toFixed(1)}%</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>AVG TIME</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: 'var(--accent-color)', fontFamily: 'var(--font-pixel)', textShadow: '0 0 6px rgba(255, 107, 157, 0.3)' }}>{stats.avgTimeMs}ms</div>
              </div>
            </div>

            {/* 文型別正答率 */}
            <div style={{ marginTop: '1rem' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 'bold' }}>PATTERN ACCURACY</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '4px' }}>
                {([1, 2, 3, 4, 5] as const).map(p => {
                  const s = stats.patternStats[p];
                  const rate = s.total > 0 ? ((s.correct / s.total) * 100).toFixed(0) : '-';
                  return (
                    <div key={p} style={{
                      background: 'var(--surface-light)',
                      padding: '8px 4px',
                      textAlign: 'center',
                      borderBottom: `3px solid ${PATTERN_COLORS[p]}`,
                      boxShadow: `0 0 4px ${PATTERN_COLORS[p]}33`
                    }}>
                      <div style={{ fontWeight: 'bold', color: PATTERN_COLORS[p], fontFamily: 'var(--font-pixel)', fontSize: '0.75rem', textShadow: `0 0 6px ${PATTERN_COLORS[p]}66` }}>{PATTERN_LABELS[p]}</div>
                      <div style={{ fontWeight: 'bold', color: 'var(--text-color)', marginTop: '4px', fontSize: '1rem' }}>{rate}%</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 混同しやすい文型 Top 3 */}
            <div style={{ marginTop: '1.2rem', textAlign: 'left', background: 'rgba(255, 221, 0, 0.05)', padding: '12px', border: '2px solid rgba(255, 221, 0, 0.2)' }}>
              <strong style={{ display: 'block', marginBottom: '6px', color: 'var(--warning-color)', fontSize: '0.85rem' }}>WARNING: 混同TOP3</strong>
              {(() => {
                const entries = Object.entries(stats.confusionMatrix)
                  .map(([key, count]) => {
                    const [correct, chosen] = key.split(':').map(Number);
                    return { correct, chosen, count };
                  })
                  .sort((a, b) => b.count - a.count)
                  .slice(0, 3);

                if (entries.length === 0) return <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>データなし</div>;

                return (
                  <ul style={{ margin: 0, paddingLeft: '16px' }}>
                    {entries.map((e, i) => (
                      <li key={i} style={{ fontSize: '0.85rem', marginBottom: '4px', color: 'var(--text-color)' }}>
                        <span style={{ color: PATTERN_COLORS[e.correct as Pattern], fontWeight: 'bold' }}>{PATTERN_LABELS[e.correct as Pattern]}</span>
                        {' → '}
                        <span style={{ color: PATTERN_COLORS[e.chosen as Pattern], fontWeight: 'bold' }}>{PATTERN_LABELS[e.chosen as Pattern]}</span>
                        {' '}
                        <span style={{ color: 'var(--warning-color)' }}>×{e.count}</span>
                      </li>
                    ))}
                  </ul>
                );
              })()}
            </div>
          </div>
        ) : (
          <p style={{ color: 'var(--text-secondary)' }}>Loading...</p>
        )}
      </div>
    </div >
  );
}
