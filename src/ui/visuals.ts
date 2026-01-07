import type { CSSProperties } from 'react';

export function getRarityStyle(rarity?: 'N' | 'R' | 'SR'): CSSProperties {
  if (!rarity) {
    return {
      background: '#eee',
      border: '1px dashed #aaa',
      boxShadow: 'none'
    };
  }

  const baseStyle: CSSProperties = {
    boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
    border: '1px solid #ddd' // Default border
  };

  switch (rarity) {
    case 'SR':
      return {
        ...baseStyle,
        background: 'linear-gradient(135deg, #fff 0%, #fff7e6 100%)',
        border: '2px solid #FFD700',
        boxShadow: '0 4px 15px rgba(255, 215, 0, 0.4)',
        // transform is context dependent (hover etc), so we might leave it out or handle it in component
      };
    case 'R':
      return {
        ...baseStyle,
        background: 'linear-gradient(135deg, #fff 0%, #f4f4f4 100%)',
        border: '2px solid #C0C0C0',
        boxShadow: '0 4px 10px rgba(192, 192, 192, 0.4)'
      };
    case 'N':
    default:
      return {
        ...baseStyle,
        background: 'white',
        border: '1px solid #e0e0e0'
      };
  }
}
