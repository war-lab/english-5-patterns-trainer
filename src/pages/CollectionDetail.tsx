import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { collectionStore } from '../logic/collectionStore';
import { VERB_DATA } from '../data/verbData';
import { questions } from '../data/questions.seed';
import { getRarityStyle } from '../ui/visuals';
import type { CardProgress } from '../domain/types';

export default function CollectionDetail() {
  const { verbId } = useParams<{ verbId: string }>();
  const [progress, setProgress] = useState<CardProgress | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (verbId) {
      const col = collectionStore.getCollection();
      setProgress(col[verbId] || null);
    }
  }, [verbId]);

  if (!verbId || !VERB_DATA[verbId]) return <div style={{ color: 'var(--error-color)' }}>Unknown Verb</div>;
  if (!progress) return <div style={{ color: 'var(--text-secondary)' }}>LOCKED</div>;

  const data = VERB_DATA[verbId];
  const examples = questions.filter(q => q.tags.includes(`v:${verbId}`));

  return (
    <div className="page-container" style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <div className="nav-header" style={{ marginBottom: '16px' }}>
        <Link to="/collection" className="nav-link">← BACK</Link>
      </div>

      {/* 動詞カード */}
      <div className="card" style={{
        ...getRarityStyle(data.rarity),
        padding: '24px',
        marginBottom: '16px',
        textAlign: 'center',
        transform: 'none'
      }}>
        <div style={{
          fontSize: '0.6rem',
          color: data.rarity === 'SR' ? '#FFD700' : data.rarity === 'R' ? '#C0C0C0' : 'var(--text-secondary)',
          textTransform: 'uppercase',
          fontFamily: 'var(--font-pixel)',
          letterSpacing: '0.1em',
          textShadow: data.rarity === 'SR' ? '0 0 6px rgba(255, 215, 0, 0.5)' : 'none',
          marginBottom: '8px'
        }}>
          {getRarityLabel(data.rarity)}
        </div>
        <h1 style={{
          fontSize: '2rem',
          margin: '8px 0',
          fontFamily: 'var(--font-pixel)',
          color: 'var(--primary-color)',
          textShadow: '0 0 10px rgba(0, 255, 136, 0.5)'
        }}>{verbId}</h1>
        <div style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>{data.meaning}</div>

        {/* ステータスバー */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-around',
          background: 'var(--surface-light)',
          padding: '12px',
          border: '1px solid var(--surface-border)'
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-pixel)' }}>LV</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: 'var(--secondary-color)', fontFamily: 'var(--font-pixel)', textShadow: '0 0 6px rgba(0, 204, 255, 0.3)' }}>{progress.level}</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-pixel)' }}>EXP</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: 'var(--accent-color)', fontFamily: 'var(--font-pixel)', textShadow: '0 0 6px rgba(255, 107, 157, 0.3)' }}>{progress.exp}</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '0.6rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-pixel)' }}>WIN</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: 'var(--primary-color)', fontFamily: 'var(--font-pixel)', textShadow: '0 0 6px rgba(0, 255, 136, 0.3)' }}>{progress.history.correct}</div>
          </div>
        </div>
      </div>

      {/* トレーニングボタン */}
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <button
          onClick={() => navigate(`/sniper?deck=v:${verbId}`)}
          className="start-btn"
          style={{ width: '100%', padding: '14px', fontSize: '1.1rem' }}
        >
          TRAIN "{verbId}"
        </button>
      </div>

      {/* 例文リスト */}
      <h3 style={{ fontSize: '0.95rem', color: 'var(--secondary-color)' }}>
        EXAMPLES <span style={{ fontFamily: 'var(--font-pixel)', fontSize: '0.6rem' }}>({examples.length})</span>
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {examples.map(ex => (
          <div key={ex.id} style={{
            background: 'var(--surface-color)',
            padding: '10px 12px',
            border: '1px solid var(--surface-border)',
            fontSize: '0.9rem',
            color: 'var(--text-color)'
          }}>
            <div>{ex.sentence}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Pattern: <span style={{ fontFamily: 'var(--font-pixel)', fontSize: '0.55rem' }}>{ex.correctPattern}</span> | Level <span style={{ fontFamily: 'var(--font-pixel)', fontSize: '0.55rem' }}>{ex.level}</span>
            </div>
          </div>
        ))}
        {examples.length === 0 && <div style={{ color: 'var(--text-secondary)' }}>No examples found.</div>}
      </div>
    </div>
  );
}

function getRarityLabel(rarity: 'N' | 'R' | 'SR') {
  switch (rarity) {
    case 'SR': return 'SUPER RARE';
    case 'R': return 'RARE';
    default: return 'NORMAL';
  }
}
