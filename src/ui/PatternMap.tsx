import type { Pattern } from '../domain/types';
import { PATTERN_LABELS, PATTERN_COLORS } from '../domain/constants';

type PatternStatus = 'correct' | 'wrong' | 'unanswered';

interface PatternMapProps {
  /** この動詞が取りうるパターン */
  allPatterns: Pattern[];
  /** 各パターンの回答状態 */
  answeredPatterns: Record<number, PatternStatus>;
}

/** 動詞が取る文型の可視化コンポーネント */
export default function PatternMap({ allPatterns, answeredPatterns }: PatternMapProps) {
  const allFive: Pattern[] = [1, 2, 3, 4, 5];

  return (
    <div className="pattern-map">
      {allFive.map(p => {
        const isAvailable = allPatterns.includes(p);
        const status = answeredPatterns[p];

        // CSSクラスの決定
        let className = 'pattern-map-item';
        if (!isAvailable) {
          className += ' unavailable';
        } else if (status === 'correct') {
          className += ' correct';
        } else if (status === 'wrong') {
          className += ' wrong';
        } else {
          className += ' available';
        }

        // ドットのクラス
        let dotClass = 'pattern-dot';
        if (isAvailable) {
          if (status === 'correct') dotClass += ' correct';
          else if (status === 'wrong') dotClass += ' wrong';
          else dotClass += ' active';
        }

        // パターンカラーを状態に応じて適用
        const colorStyle = isAvailable && status !== 'correct' && status !== 'wrong'
          ? { color: PATTERN_COLORS[p] }
          : {};
        const dotStyle = isAvailable && status !== 'correct' && status !== 'wrong'
          ? { background: PATTERN_COLORS[p] }
          : {};

        return (
          <div key={p} className={className} style={colorStyle}>
            <span>{PATTERN_LABELS[p]}</span>
            <div className={dotClass} style={dotStyle} />
          </div>
        );
      })}
    </div>
  );
}
