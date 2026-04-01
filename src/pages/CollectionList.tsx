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

  const sortedIds = [...verbIds].sort((a, b) => {
    const ownedA = !!collection[a];
    const ownedB = !!collection[b];
    if (ownedA !== ownedB) return ownedA ? -1 : 1;
    return a.localeCompare(b);
  });

  return (
    <div className="page-container" style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <div className="nav-header">
        <Link to="/" className="nav-link">← HOME</Link>
        <h2 style={{ margin: 0, fontSize: '1rem', fontFamily: 'var(--font-pixel)', color: 'var(--secondary-color)', textShadow: '0 0 6px rgba(0, 204, 255, 0.3)' }}>COLLECTION</h2>
      </div>

      {/* レアリティ説明 */}
      <div style={{
        background: 'var(--surface-color)',
        padding: '14px',
        border: '2px solid var(--surface-border)',
        marginBottom: '16px',
        fontSize: '0.85rem',
        color: 'var(--text-secondary)'
      }}>
        <div style={{ fontWeight: 'bold', marginBottom: '8px', borderBottom: '1px solid var(--surface-border)', paddingBottom: '6px', color: 'var(--text-color)' }}>RARITY</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '6px 14px', alignItems: 'center' }}>
          <span style={{ fontWeight: 'bold', color: '#FFD700', fontFamily: 'var(--font-pixel)', fontSize: '0.7rem', textShadow: '0 0 6px rgba(255, 215, 0, 0.4)' }}>SR</span>
          <span>多文型 or 難関動詞</span>

          <span style={{ fontWeight: 'bold', color: '#C0C0C0', fontFamily: 'var(--font-pixel)', fontSize: '0.7rem' }}>R</span>
          <span>3文型以上 or 注意動詞</span>

          <span style={{ fontWeight: 'bold', color: 'var(--text-secondary)', fontFamily: 'var(--font-pixel)', fontSize: '0.7rem' }}>N</span>
          <span>基本動詞</span>
        </div>
      </div>

      <div className="collection-grid" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
        gap: '8px',
        marginTop: '16px'
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
                padding: '10px',
                textAlign: 'center',
                textDecoration: 'none',
                color: isOwned ? 'var(--text-color)' : 'var(--text-secondary)',
                cursor: isOwned ? 'pointer' : 'default',
                opacity: isOwned ? 1 : 0.4,
                aspectRatio: '3/4',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                transition: 'all 0.15s',
              }}
              onClick={e => !isOwned && e.preventDefault()}
              onMouseEnter={e => {
                if (isOwned) {
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)';
                  (e.currentTarget as HTMLElement).style.boxShadow = '0 0 12px rgba(0, 255, 136, 0.3)';
                }
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.transform = 'none';
                (e.currentTarget as HTMLElement).style.boxShadow = getRarityStyle(isOwned ? data.rarity : undefined).boxShadow as string || '';
              }}
            >
              {isOwned ? (
                <>
                  <div style={{ fontWeight: 'bold', marginBottom: '4px', fontFamily: 'var(--font-pixel)', fontSize: '0.7rem' }}>{id}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{data.meaning}</div>
                  <div style={{ marginTop: 'auto', fontSize: '0.7rem', fontWeight: 'bold', color: 'var(--secondary-color)', fontFamily: 'var(--font-pixel)', textShadow: '0 0 4px rgba(0, 204, 255, 0.3)' }}>
                    Lv.{progress.level}
                  </div>
                </>
              ) : (
                <div style={{ fontSize: '1.5rem', color: '#333355' }}>?</div>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
