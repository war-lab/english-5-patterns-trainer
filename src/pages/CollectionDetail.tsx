import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { collectionStore } from '../logic/collectionStore';
import { VERB_DATA } from '../data/verbData';
import { questions } from '../data/questions.seed';
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

  if (!verbId || !VERB_DATA[verbId]) return <div>Unknown Verb</div>;
  if (!progress) return <div>LOCKED</div>;

  const data = VERB_DATA[verbId];

  // Find related examples from seed data
  // Using the new tag format 'v:verbId'
  const examples = questions.filter(q => q.tags.includes(`v:${verbId}`));

  return (
    <div className="page-container" style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <div className="nav-header" style={{ marginBottom: '20px' }}>
        <Link to="/collection" className="nav-link">← Back</Link>
      </div>

      <div className="card" style={{ padding: '20px', marginBottom: '20px', textAlign: 'center' }}>
        <div style={{ fontSize: '0.9rem', color: '#888', textTransform: 'uppercase' }}>
          Rarity: {data.rarity}
        </div>
        <h1 style={{ fontSize: '2.5rem', margin: '10px 0' }}>{verbId}</h1>
        <div style={{ fontSize: '1.2rem', color: '#555', marginBottom: '20px' }}>{data.meaning}</div>

        <div className="stats-bar" style={{ display: 'flex', justifyContent: 'space-around', background: '#f8f9fa', padding: '10px', borderRadius: '8px' }}>
          <div>
            <div style={{ fontSize: '0.8rem', color: '#666' }}>Level</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{progress.level}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: '#666' }}>EXP</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{progress.exp}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: '#666' }}>Correct</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{progress.history.correct}</div>
          </div>
        </div>
      </div>

      <div style={{ textAlign: 'center', marginBottom: '30px' }}>
        <button
          onClick={() => navigate(`/sniper?deck=v:${verbId}`)}
          className="start-btn"
          style={{ width: '100%', padding: '15px', fontSize: '1.2rem', fontWeight: 'bold' }}
        >
          ⚔️ Train "{verbId}"
        </button>
      </div>

      <h3>Examples ({examples.length})</h3>
      <div className="example-list" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {examples.map(ex => (
          <div key={ex.id} style={{
            background: 'white',
            padding: '12px',
            borderRadius: '6px',
            border: '1px solid #eee',
            fontSize: '0.95rem'
          }}>
            <div>{ex.sentence}</div>
            <div style={{ fontSize: '0.8rem', color: '#888', marginTop: '4px' }}>
              Pattern: {ex.correctPattern} (Level {ex.level})
            </div>
          </div>
        ))}
        {examples.length === 0 && <div style={{ color: '#999' }}>No examples found in database.</div>}
      </div>
    </div>
  );
}
