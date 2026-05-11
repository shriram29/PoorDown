import { useState } from 'react';

const BACK_STYLES = {
  red:      { backgroundColor: '#DC2626' },
  blue:     { backgroundColor: '#2563EB' },
  neutral:  { backgroundColor: '#A89270' },
  assassin: { backgroundColor: '#18181B' },
};

const SPYMASTER_TINTS = {
  red:      { backgroundColor: '#FEE2E2', border: '2.5px solid #DC2626', color: '#991B1B' },
  blue:     { backgroundColor: '#DBEAFE', border: '2.5px solid #2563EB', color: '#1E40AF' },
  neutral:  { backgroundColor: '#F5F0E8', border: '2px solid #D4C9B0',   color: '#78716C' },
  assassin: { backgroundColor: '#27272A', border: '2px solid #71717A',   color: '#D4D4D8' },
};

export default function Card({ word, type, revealed, isSpymaster, isClickable, onClick, selected, showAll }) {
  const [hovered, setHovered] = useState(false);

  const flipped = revealed || showAll;

  let frontStyle;
  if (selected) {
    frontStyle = {
      backgroundColor: '#F3E8FF',
      border: '2.5px solid #7C3AED',
      color: '#5B21B6',
    };
  } else if (isSpymaster) {
    frontStyle = { ...SPYMASTER_TINTS[type] };
  } else {
    frontStyle = {
      backgroundColor: hovered && isClickable ? '#EDE8DA' : '#F5F0E8',
      border: hovered && isClickable ? '2px solid #2B2D42' : '2px solid #E8E4D8',
      color: '#2B2D42',
    };
  }

  return (
    <div
      style={{
        height: '92px',
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
        transition: 'transform 0.55s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
      }}>

        {/* Front — word card */}
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
          transition: 'background-color 0.1s, box-shadow 0.1s',
          transform: selected
            ? 'translateY(-3px)'
            : hovered && isClickable ? 'translateY(-2px)' : 'none',
          boxShadow: selected
            ? '0 8px 24px rgba(124,58,237,0.25)'
            : hovered && isClickable
              ? '0 6px 20px rgba(0,0,0,0.14)'
              : '0 2px 6px rgba(0,0,0,0.07)',
          ...frontStyle,
        }}>
          {isSpymaster && type === 'assassin' && (
            <span style={{ fontSize: '16px', marginBottom: '3px', lineHeight: 1 }}>💀</span>
          )}
          <span>{word}</span>
        </div>

        {/* Back — solid agent color, no word */}
        <div style={{
          position: 'absolute',
          inset: 0,
          backfaceVisibility: 'hidden',
          WebkitBackfaceVisibility: 'hidden',
          transform: 'rotateY(180deg)',
          borderRadius: '10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
          ...BACK_STYLES[type],
        }}>
          {type === 'assassin' && (
            <span style={{ fontSize: '24px', lineHeight: 1 }}>💀</span>
          )}
        </div>

      </div>
    </div>
  );
}
