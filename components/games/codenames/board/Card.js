import { useState } from 'react';

const BACK_STYLES = {
  red:      { backgroundColor: '#EF4444' },
  blue:     { backgroundColor: '#3B82F6' },
  neutral:  { backgroundColor: '#57534E' },
  assassin: { backgroundColor: '#111827' },
};

// Tints for spymaster view — dark themed
const SPY_TINTS = {
  red:      { backgroundColor: '#2D1212', border: '2px solid #7F1D1D', color: '#FCA5A5' },
  blue:     { backgroundColor: '#0D1929', border: '2px solid #1E3A5F', color: '#93C5FD' },
  neutral:  { backgroundColor: '#1C1A14', border: '1.5px solid #44403C', color: '#A8A29E' },
  assassin: { backgroundColor: '#0D0D0E', border: '1.5px solid #374151', color: '#6B7280' },
};

const UNREVEALED = {
  default: { backgroundColor: '#1C2128', border: '1.5px solid #30363D', color: '#C9D1D9' },
  hover:   { backgroundColor: '#21262D', border: '1.5px solid #58A6FF', color: '#E6EDF3' },
  selected:{ backgroundColor: '#1A1040', border: '2.5px solid #7C3AED', color: '#C4B5FD' },
};

export default function Card({ word, type, revealed, isSpymaster, isClickable, onClick, selected, showAll }) {
  const [hovered, setHovered] = useState(false);

  const flipped = revealed || showAll;

  let frontStyle;
  if (selected) {
    frontStyle = {
      ...UNREVEALED.selected,
      transform: 'translateY(-3px)',
      boxShadow: '0 8px 24px rgba(124,58,237,0.4)',
    };
  } else if (isSpymaster) {
    frontStyle = { ...SPY_TINTS[type] };
  } else if (hovered && isClickable) {
    frontStyle = {
      ...UNREVEALED.hover,
      transform: 'translateY(-2px)',
      boxShadow: '0 6px 20px rgba(0,0,0,0.4)',
    };
  } else {
    frontStyle = {
      ...UNREVEALED.default,
      boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
    };
  }

  return (
    <div
      style={{
        height: '100%',
        perspective: '700px',
        cursor: isClickable && !revealed ? 'pointer' : 'default',
        userSelect: 'none',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={isClickable && !revealed ? onClick : undefined}
    >
      <div style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        transformStyle: 'preserve-3d',
        WebkitTransformStyle: 'preserve-3d',
        transition: 'transform 0.55s cubic-bezier(0.4,0,0.2,1)',
        transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
      }}>

        {/* Front — word */}
        <div style={{
          position: 'absolute',
          inset: 0,
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden',
          borderRadius: '10px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '8px 6px',
          fontFamily: 'Inter, sans-serif',
          fontSize: '13px',
          fontWeight: '700',
          letterSpacing: '0.8px',
          textAlign: 'center',
          textTransform: 'uppercase',
          transition: 'background-color 0.1s, box-shadow 0.1s, border-color 0.1s, transform 0.1s',
          ...frontStyle,
        }}>
          {isSpymaster && type === 'assassin' && (
            <span style={{ fontSize: '16px', marginBottom: '3px', lineHeight: 1 }}>💀</span>
          )}
          <span>{word}</span>
        </div>

        {/* Back — solid color; shows word at game over */}
        <div style={{
          position: 'absolute',
          inset: 0,
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden',
          transform: 'rotateY(180deg)',
          borderRadius: '10px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '3px',
          padding: '6px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
          ...BACK_STYLES[type],
        }}>
          {type === 'assassin' && (
            <span style={{ fontSize: showAll ? '14px' : '24px', lineHeight: 1 }}>💀</span>
          )}
          {showAll && (
            <span style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '11px',
              fontWeight: '700',
              color: 'rgba(255,255,255,0.92)',
              letterSpacing: '0.7px',
              textTransform: 'uppercase',
              textAlign: 'center',
              lineHeight: 1.2,
            }}>
              {word}
            </span>
          )}
        </div>

      </div>
    </div>
  );
}
