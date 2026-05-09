// 3D CSS Dice Component
import { useState, useEffect } from 'react';

const PIP_PATTERNS = {
  1: [[1, 1]],
  2: [[0, 0], [2, 2]],
  3: [[0, 0], [1, 1], [2, 2]],
  4: [[0, 0], [0, 2], [2, 0], [2, 2]],
  5: [[0, 0], [0, 2], [1, 1], [2, 0], [2, 2]],
  6: [[0, 0], [0, 2], [1, 0], [1, 2], [2, 0], [2, 2]],
};

function Die({ value, rolling, onClick, disabled }) {
  const [displayValue, setDisplayValue] = useState(value || 1);

  useEffect(() => {
    if (!rolling && value) {
      setDisplayValue(value);
    }
  }, [value, rolling]);

  // Pip positions in a 3x3 grid
  const pips = PIP_PATTERNS[displayValue] || PIP_PATTERNS[1];

  return (
    <div
      onClick={disabled ? undefined : onClick}
      style={{
        width: '60px',
        height: '60px',
        perspective: '200px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          backgroundColor: 'white',
          borderRadius: '10px',
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gridTemplateRows: 'repeat(3, 1fr)',
          padding: '8px',
          boxShadow: rolling
            ? '0 8px 20px rgba(0,0,0,0.3)'
            : '0 4px 10px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.8)',
          transform: rolling ? 'rotateX(720deg) rotateY(720deg)' : 'rotateX(0deg) rotateY(0deg)',
          transition: rolling ? 'transform 0.4s ease-out' : 'transform 0.1s ease-out',
          transformStyle: 'preserve-3d',
        }}
      >
        {[0, 1, 2].map(row =>
          [0, 1, 2].map(col => {
            const hasPip = pips.some(([r, c]) => r === row && c === col);
            return (
              <div
                key={`${row}-${col}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {hasPip && (
                  <div
                    style={{
                      width: '10px',
                      height: '10px',
                      backgroundColor: '#2B2D42',
                      borderRadius: '50%',
                    }}
                  />
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default function Dice({
  dice = [0, 0],
  rolling = false,
  onRoll,
  disabled = false,
  isDoubles = false
}) {
  const [localRolling, setLocalRolling] = useState(false);

  const handleRoll = () => {
    if (disabled || rolling || localRolling) return;

    setLocalRolling(true);

    // Rapid value changes during roll animation
    const rollInterval = setInterval(() => {
      // Just trigger re-render with random values for visual effect
    }, 50);

    // End rolling after animation
    setTimeout(() => {
      clearInterval(rollInterval);
      setLocalRolling(false);
      if (onRoll) onRoll();
    }, 400);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
      <div style={{ display: 'flex', gap: '16px' }}>
        <Die
          value={dice[0] || null}
          rolling={rolling || localRolling}
          onClick={handleRoll}
          disabled={disabled}
        />
        <Die
          value={dice[1] || null}
          rolling={rolling || localRolling}
          onClick={handleRoll}
          disabled={disabled}
        />
      </div>

      {isDoubles && dice[0] > 0 && (
        <div
          style={{
            padding: '4px 12px',
            backgroundColor: '#F4A261',
            color: 'white',
            borderRadius: '12px',
            fontSize: '12px',
            fontWeight: '600',
            fontFamily: 'Inter, sans-serif',
            animation: 'pulse 1s infinite',
          }}
        >
          🎉 Doubles!
        </div>
      )}

      {dice[0] === 0 && !rolling && (
        <div
          style={{
            fontSize: '12px',
            color: '#8D99AE',
            fontFamily: 'Inter, sans-serif',
          }}
        >
          {disabled ? 'Wait for your turn' : 'Click a die to roll'}
        </div>
      )}
    </div>
  );
}
