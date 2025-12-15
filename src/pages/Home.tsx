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

      <div className="grid-menu">
        <Link to="/sniper" className="menu-item">
          <h3>🔫 スナイパーモード</h3>
          <span>タイムアタック (2.0秒)</span>
        </Link>
        <Link to="/parse" className="menu-item">
          <h3>🧐 解析モード</h3>
          <span>V-O-Cを判別</span>
        </Link>
        <Link to="/review" className="menu-item">
          <h3>🔄 復習モード</h3>
          <span>苦手を克服</span>
        </Link>
      </div>

      <div className="stats-container">
        <h2>学習状況</h2>
        {stats ? (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-around', marginBottom: '1rem', flexWrap: 'wrap' }}>
              <div><strong>総回答数:</strong> {stats.totalQuestions}</div>
              <div><strong>正答率:</strong> {(stats.accuracy * 100).toFixed(1)}%</div>
              <div><strong>平均時間:</strong> {stats.avgTimeMs}ms</div>
            </div>

            <div style={{ marginTop: '1rem' }}>
              <strong>文型別正答率:</strong>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '5px', marginTop: '10px' }}>
                {([1, 2, 3, 4, 5] as const).map(p => {
                  const s = stats.patternStats[p];
                  const rate = s.total > 0 ? ((s.correct / s.total) * 100).toFixed(0) : '-';
                  return (
                    <div key={p} style={{ background: '#eee', padding: '5px', borderRadius: '4px', textAlign: 'center', fontSize: '0.9rem' }}>
                      <div>第{p}</div>
                      <div style={{ fontWeight: 'bold', color: 'var(--primary-color)' }}>{rate}%</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <p>データを読み込み中...</p>
        )}
      </div>
    </div>
  );
}
