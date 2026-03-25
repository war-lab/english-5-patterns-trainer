import type { MultiPatternVerb } from '../logic/verbFocusLogic';
import type { Pattern } from '../domain/types';
import { PATTERN_LABELS, PATTERN_COLORS } from '../domain/constants';
import { getRarityStyle } from './visuals';

interface VerbFocusSelectProps {
  verbs: MultiPatternVerb[];
  onSelect: (verb: MultiPatternVerb) => void;
}

/** 動詞選択画面 — 「挑戦状」スタイル */
export default function VerbFocusSelect({ verbs, onSelect }: VerbFocusSelectProps) {
  return (
    <div className="verb-select-list">
      {verbs.map(verb => {
        const hasPattern = verb.patterns.includes.bind(verb.patterns);
        return (
          <button
            key={verb.verbId}
            className={`verb-select-card ${verb.rarity === 'SR' ? 'verb-select-card--sr' : ''}`}
            style={getRarityStyle(verb.rarity)}
            onClick={() => onSelect(verb)}
          >
            {/* 上段: 動詞名 + レアリティ + 問題数 */}
            <div className="verb-select-top">
              <div className="verb-select-identity">
                <span className="verb-select-name">{verb.verbId}</span>
                <span className="rarity-badge" data-rarity={verb.rarity}>
                  {verb.rarity}
                </span>
              </div>
              <div className="verb-select-stats">
                <span className="verb-select-stat">
                  <span className="verb-select-stat-value">{verb.patterns.length}</span>
                  <span className="verb-select-stat-label">文型</span>
                </span>
                <span className="verb-select-stat-divider" />
                <span className="verb-select-stat">
                  <span className="verb-select-stat-value">{verb.totalQuestions}</span>
                  <span className="verb-select-stat-label">問</span>
                </span>
              </div>
            </div>

            {/* 中段: 意味 */}
            <div className="verb-select-meaning">{verb.meaning}</div>

            {/* 下段: パターンバー — 5文型を横一列、対応=塗り/非対応=空 */}
            <div className="pattern-bar">
              {([1, 2, 3, 4, 5] as Pattern[]).map(p => {
                const active = hasPattern(p);
                return (
                  <div
                    key={p}
                    className={`pattern-bar-cell ${active ? 'pattern-bar-cell--active' : 'pattern-bar-cell--empty'}`}
                    style={active ? { background: PATTERN_COLORS[p], borderColor: PATTERN_COLORS[p] } : undefined}
                  >
                    <span className="pattern-bar-label" style={active ? { color: '#fff' } : undefined}>
                      {PATTERN_LABELS[p]}
                    </span>
                  </div>
                );
              })}
            </div>
          </button>
        );
      })}
    </div>
  );
}
