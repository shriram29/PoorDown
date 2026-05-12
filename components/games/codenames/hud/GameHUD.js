export default function GameHUD({
  phase, currentTeam, clueWord, clueNumber, guessesLeft,
  winner, winnerLabel,
  roomCode, onLeave,
}) {
  const isOver   = phase === 'over';
  const clueNum  = clueNumber === 0 ? '∞' : clueNumber;

  const accentColor = isOver
    ? (winner === 'red' ? '#F87171' : winner === 'blue' ? '#60A5FA' : '#484F58')
    : (currentTeam === 'red' ? '#F87171' : '#60A5FA');

  const phaseText = {
    'spymaster-clue':   `${currentTeam === 'red' ? 'RED' : 'BLUE'} · Spymaster thinking`,
    'operatives-guess': `${currentTeam === 'red' ? 'RED' : 'BLUE'} · Guessing`,
    'over': winnerLabel ? `${winnerLabel} wins!` : 'Game Over',
  }[phase] || '';

  const guessDisplay = phase === 'operatives-guess' && clueWord
    ? (guessesLeft >= 99 ? '∞' : String(guessesLeft))
    : null;

  const showClue = clueWord && phase !== 'spymaster-clue' && !isOver;

  return (
    <>
      <style>{`
        @keyframes clueAppear {
          0%   { opacity: 0; transform: translateY(-6px); }
          100% { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      <div style={{
        flexShrink: 0,
        height: '48px',
        backgroundColor: '#161B22',
        borderBottom: `2px solid ${accentColor}44`,
        boxShadow: `0 2px 16px ${accentColor}1a`,
        display: 'flex',
        alignItems: 'center',
        padding: '0 14px',
        gap: '10px',
        zIndex: 10,
        transition: 'border-color 0.4s, box-shadow 0.4s',
      }}>

        {/* Left: logo + room code */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0, minWidth: '130px' }}>
          <span style={{
            fontFamily: 'Nunito, sans-serif', fontSize: '16px', fontWeight: '800',
            color: '#E6EDF3', letterSpacing: '-0.3px', lineHeight: 1,
          }}>
            Code<span style={{ color: '#F87171' }}>names</span>
          </span>
          {roomCode && (
            <span style={{
              fontFamily: 'JetBrains Mono, monospace', fontSize: '11px',
              color: '#484F58', letterSpacing: '2px',
            }}>
              {roomCode}
            </span>
          )}
        </div>

        {/* Center: phase label or clue */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
          {showClue ? (
            <div
              key={`${clueWord}-${currentTeam}`}
              style={{ display: 'flex', alignItems: 'baseline', gap: '8px', animation: 'clueAppear 0.3s ease-out both' }}
            >
              <span style={{
                fontFamily: 'Inter, sans-serif', fontSize: '10px', fontWeight: '700',
                color: accentColor, letterSpacing: '1px', textTransform: 'uppercase', opacity: 0.7,
              }}>
                Clue:
              </span>
              <span style={{
                fontFamily: 'Nunito, sans-serif', fontSize: '20px', fontWeight: '800',
                color: '#E6EDF3', letterSpacing: '-0.3px',
              }}>
                {clueWord.toUpperCase()}
              </span>
              <span style={{
                fontFamily: 'Nunito, sans-serif', fontSize: '16px', fontWeight: '800', color: accentColor,
              }}>
                ×{clueNum}
              </span>
              {guessDisplay && (
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#484F58' }}>
                  ({guessDisplay} left)
                </span>
              )}
            </div>
          ) : (
            <span style={{
              fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: '700',
              color: accentColor, letterSpacing: '1.2px', textTransform: 'uppercase', opacity: 0.85,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              {phaseText}
            </span>
          )}
        </div>

        {/* Right: leave */}
        <div style={{ flexShrink: 0, minWidth: '70px', display: 'flex', justifyContent: 'flex-end' }}>
          {onLeave && (
            <button
              onClick={onLeave}
              style={{
                background: 'none', border: 'none',
                fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#484F58',
                cursor: 'pointer', padding: '4px 6px',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = '#F87171')}
              onMouseLeave={e => (e.currentTarget.style.color = '#484F58')}
            >
              Leave ×
            </button>
          )}
        </div>

      </div>
    </>
  );
}
