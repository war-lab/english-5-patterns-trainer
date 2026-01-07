import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collectionStore } from '../logic/collectionStore';
import { VERB_DATA } from '../data/verbData';
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
                background: isOwned ? 'white' : '#ddd',
                border: isOwned ? `2px solid ${getRarityColor(data.rarity)}` : '1px dashed #aaa',
                borderRadius: '8px',
                padding: '10px',
                textAlign: 'center',
                textDecoration: 'none',
                color: isOwned ? '#333' : '#999',
                boxShadow: isOwned ? '0 2px 5px rgba(0,0,0,0.1)' : 'none',
                cursor: isOwned ? 'pointer' : 'default',
                opacity: isOwned ? 1 : 0.6,
                aspectRatio: '3/4',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center'
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

function getRarityColor(rarity: 'N' | 'R' | 'SR') {
  switch (rarity) {
    case 'SR': return '#FFD700'; // Gold
    case 'R': return '#C0C0C0'; // Silver
    default: return '#e0e0e0'; // Gray/Normal border
  }
}
