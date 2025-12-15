import { useState } from 'react';
import { Link } from 'react-router-dom';
import { store } from '../storage/store';
import { calculateStats } from '../logic/stats';
import type { StatsSummary } from '../domain/types';

export default function Home() {
  const [stats] = useState<StatsSummary | null>(() => {
    const answers = store.getAnswers();
    return calculateStats(answers);
  });

  return (
    <div className="home-container">
      <h1>英語5文型トレーナー</h1>

      <div className="menu-grid" style={{ display: 'grid', gap: '1rem', margin: '2rem 0' }}>
        <Link to="/sniper" className="btn btn-primary" style={btnStyle}>
          スナイパーモード
          <span style={subTextStyle}>タイムアタック (2.0秒)</span>
        </Link>
        <Link to="/parse" className="btn btn-secondary" style={btnStyle}>
          解析モード
          <span style={subTextStyle}>V-O-Cを判別</span>
        </Link>
        <Link to="/review" className="btn btn-accent" style={btnStyle}>
          復習モード
          <span style={subTextStyle}>苦手を克服</span>
        </Link>
      </div>

      <div className="stats-section" style={{ border: '1px solid #ccc', padding: '1rem', borderRadius: '8px' }}>
        <h2>学習状況</h2>
        {stats ? (
          <div>
            <p>総回答数: {stats.totalQuestions}</p>
            <p>正答率: {(stats.accuracy * 100).toFixed(1)}%</p>
            <p>平均回答時間: {stats.avgTimeMs}ms</p>
            <div style={{ marginTop: '0.5rem' }}>
              <strong>文型別正答率:</strong>
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {([1, 2, 3, 4, 5] as const).map(p => {
                  const s = stats.patternStats[p];
                  const rate = s.total > 0 ? ((s.correct / s.total) * 100).toFixed(0) : '-';
                  return <li key={p}>第{p}文型: {rate}% ({s.correct}/{s.total})</li>
                })}
              </ul>
            </div>
          </div>
        ) : (
          <p>データを読み込み中...</p>
        )}
      </div>
    </div>
  );
}

const btnStyle = {
  display: 'flex',
  flexDirection: 'column' as const,
  alignItems: 'center',
  padding: '1rem',
  backgroundColor: '#f0f0f0',
  textDecoration: 'none',
  color: '#333',
  borderRadius: '8px',
  border: '1px solid #ddd'
};

const subTextStyle = {
  fontSize: '0.8rem',
  color: '#666',
  marginTop: '0.2rem'
};
