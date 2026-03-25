import type { CSSProperties } from 'react';

export function getRarityStyle(rarity?: 'N' | 'R' | 'SR'): CSSProperties {
  if (!rarity) {
    return {
      background: '#1a1a3e',
      border: '2px dashed #333355',
      boxShadow: 'none'
    };
  }

  const baseStyle: CSSProperties = {
    background: '#12123a',
    border: '2px solid #2a2a6e',
    boxShadow: '0 0 8px rgba(0, 255, 136, 0.08)',
  };

  switch (rarity) {
    case 'SR':
      return {
        ...baseStyle,
        background: 'linear-gradient(180deg, #12123a 0%, #1a1a0a 100%)',
        border: '2px solid #FFD700',
        boxShadow: '0 0 12px rgba(255, 215, 0, 0.3), 0 0 30px rgba(255, 215, 0, 0.1)',
      };
    case 'R':
      return {
        ...baseStyle,
        background: 'linear-gradient(180deg, #12123a 0%, #1a1a2a 100%)',
        border: '2px solid #888',
        boxShadow: '0 0 8px rgba(192, 192, 192, 0.2)',
      };
    case 'N':
    default:
      return baseStyle;
  }
}
