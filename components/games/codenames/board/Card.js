import { useState } from 'react';

const REVEALED_STYLES = {
  red:      { backgroundColor: '#DC2626', color: 'white' },
  blue:     { backgroundColor: '#2563EB', color: 'white' },
  neutral:  { backgroundColor: '#A89270', color: 'white' },
  assassin: { backgroundColor: '#18181B', color: 'white' },
};

const SPYMASTER_TINTS = {
  red:      { backgroundColor: '#FEE2E2', border: '2.5px solid #DC2626', color: '#991B1B' },
  blue:     { backgroundColor: '#DBEAFE', border: '2.5px solid #2563EB', color: '#1E40AF' },
  neutral:  { backgroundColor: '#F5F0E8', border: '2px solid #D4C9B0',   color: '#78716C' },
  assassin: { backgroundColor: '#27272A', border: '2px solid #71717A',   color: '#D4D4D8' },
};

export default function Card({ word, type, revealed, isSpymaster, isClickable, onClick, selected, showAll }) {
  const [hovered, setHovered] = useState(false);

  let cardStyle;
  if (revealed) {
    cardStyle = { ...REVEALED_STYLES[type], cursor: 'default', opacity: 0.92 };
  } else if (selected) {
    cardStyle = {
      backgroundColor: '#F3E8FF',
      border: '2.5px solid #7C3AED',
      color: '#5B21B6',
      cursor: 'pointer',
      transform: 'translateY(-3px)',
      boxShadow: '0 8px 24px rgba(124,58,237,0.25)',
    };
  } else if (isSpymaster || showAll) {
    cardStyle = { ...SPYMASTER_TINTS[type], cursor: 'default' };
  } else {
    cardStyle = {
      backgroundColor: hovered && isClickable ? '#EDE8DA' : '#F5F0E8',
      border: hovered && isClickable ? '2px solid #2B2D42' : '2px solid #E8E4D8',
      color: '#2B2D42',
      cursor: isClickable ? 'pointer' : 'default',
    };
  }

  return (
    <div
      onClick={isClickable && !revealed ? onClick : undefined}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        ...cardStyle,
        borderRadius: '10px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '8px 4px',
        minHeight: '72px',
        fontFamily: 'Inter, sans-serif',
        fontSize: '11px',
        fontWeight: '700',
        letterSpacing: '0.8px',
        textAlign: 'center',
        textTransform: 'uppercase',
        transition: 'transform 0.1s, box-shadow 0.1s, background-color 0.1s',
        transform: selected
          ? 'translateY(-3px)'
          : hovered && isClickable && !revealed ? 'translateY(-2px)' : 'none',
        boxShadow: selected
          ? '0 8px 24px rgba(124,58,237,0.25)'
          : hovered && isClickable && !revealed
            ? '0 6px 20px rgba(0,0,0,0.14)'
            : '0 2px 6px rgba(0,0,0,0.07)',
        userSelect: 'none',
      }}
    >
      {revealed && type === 'assassin' && (
        <span style={{ fontSize: '16px', marginBottom: '3px', lineHeight: 1 }}>💀</span>
      )}
      {showAll && !revealed && type === 'assassin' && (
        <span style={{ fontSize: '14px', marginBottom: '3px', lineHeight: 1 }}>💀</span>
      )}
      <span>{word}</span>
    </div>
  );
}
