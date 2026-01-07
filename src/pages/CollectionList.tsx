import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collectionStore } from '../logic/collectionStore';
import { VERB_DATA } from '../data/verbData';
import { getRarityStyle } from '../ui/visuals';
import type { VerbCardCollection } from '../domain/types';

export default function CollectionList() {
  const [collection, setCollection] = useState<VerbCardCollection>({});

  useEffect(() => {
    setCollection(collectionStore.getCollection());
  }, []);

  const verbIds = Object.keys(VERB_DATA);

  // Sort: Owned first, then by ID
  const sortedIds = [...verbIds].sort((a, b) => {
    const ownedA = !!collection[a];
    const ownedB = !!collection[b];
    if (ownedA !== ownedB) return ownedA ? -1 : 1;
    return a.localeCompare(b);
  });

  return (
    <div className="page-container" style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <div className="nav-header">
        <Link to="/" className="nav-link">← Home</Link>
        <h1>Verb Collection</h1>
      </div>

      <div style={{ background: '#f8f9fa', padding: '15px', borderRadius: '8px', marginBottom: '20px', fontSize: '0.9rem', color: '#555' }}>
        <div style={{ fontWeight: 'bold', marginBottom: '8px', borderBottom: '1px solid #ddd', paddingBottom: '4px' }}>レアリティについて</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '8px 16px', alignItems: 'center' }}>
          <span style={{ fontWeight: 'bold', color: '#DAA520' }}>🌟 SR (Super Rare)</span>
          <span>多くの文型を持つ重要動詞。または混同しやすい難関動詞。</span>

          <span style={{ fontWeight: 'bold', color: '#A9A9A9' }}>✨ R (Rare)</span>
          <span>3つ以上の文型を取る動詞、または少し注意が必要な動詞。</span>

          <span style={{ fontWeight: 'bold', color: '#666' }}>🔷 N (Normal)</span>
          <span>基本的な動詞。まずはここからマスターしよう。</span>
        </div>
      </div>

      <div className="collection-grid" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
        gap: '12px',
        marginTop: '20px'
      }}>
        {sortedIds.map(id => {
          const data = VERB_DATA[id];
          const progress = collection[id];
          const isOwned = !!progress;

          return (
            <Link
              to={isOwned ? `/collection/${id}` : '#'}
              key={id}
              className={`verb-card-item ${isOwned ? 'owned' : 'locked'}`}
              style={{
                ...getRarityStyle(isOwned ? data.rarity : undefined),
                borderRadius: '8px',
                padding: '10px',
                textAlign: 'center',
                textDecoration: 'none',
                color: isOwned ? '#333' : '#999',
                cursor: isOwned ? 'pointer' : 'default',
                opacity: isOwned ? 1 : 0.6,
                aspectRatio: '3/4',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                transition: 'transform 0.2s',
              }}
              onClick={e => !isOwned && e.preventDefault()}
            >
              {isOwned ? (
                <>
                  <div style={{ fontWeight: 'bold', fontSize: '1.2rem', marginBottom: '4px' }}>{id}</div>
                  <div style={{ fontSize: '0.8rem', color: '#666' }}>{data.meaning}</div>
                  <div style={{ marginTop: 'auto', fontSize: '0.8rem', fontWeight: 'bold', color: '#007bff' }}>
                    Lv.{progress.level}
                  </div>
                </>
              ) : (
                <div style={{ fontSize: '2rem', color: '#ccc' }}>?</div>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
