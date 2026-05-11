export default function GameHUD({
  phase, currentTeam, clueWord, clueNumber, guessesLeft, redRemaining, blueRemaining,
}) {
  const isOver   = phase === 'over';
  const redActive  = !isOver && currentTeam === 'red';
  const blueActive = !isOver && currentTeam === 'blue';

  const phaseLabel = {
    'spymaster-clue':   `${currentTeam === 'red' ? 'RED' : 'BLUE'} · Spymaster thinking`,
    'operatives-guess': `${currentTeam === 'red' ? 'RED' : 'BLUE'} · Guessing`,
    'over': 'Game Over',
  }[phase] || '';

  const clueNum = clueNumber === 0 ? '∞' : clueNumber;
  const guessDisplay = phase === 'operatives-guess' && clueWord
    ? (guessesLeft >= 99 ? '∞ guesses left' : `${guessesLeft} guess${guessesLeft === 1 ? '' : 'es'} left`)
    : null;

  const borderColor = isOver ? '#30363D' : currentTeam === 'red' ? '#F87171' : '#60A5FA';
  const glowColor   = isOver ? 'transparent' : currentTeam === 'red'
    ? 'rgba(248,113,113,0.2)'
    : 'rgba(96,165,250,0.2)';

  return (
    <>
      <style>{`
        @keyframes clueAppear {
          0%   { opacity: 0; transform: scale(0.82) translateY(-8px); }
          65%  { transform: scale(1.05) translateY(1px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
      <div style={{
        backgroundColor: '#161B22',
        borderBottom: `3px solid ${borderColor}`,
        boxShadow: `0 3px 24px ${glowColor}`,
        padding: '14px 24px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        position: 'sticky',
        top: 0,
        zIndex: 10,
        transition: 'border-color 0.4s, box-shadow 0.4s',
      }}>

        {/* Red score */}
        <div style={{
          backgroundColor: '#2D1212',
          border: `1.5px solid ${redActive ? '#EF4444' : '#4A1F1F'}`,
          boxShadow: redActive ? '0 0 18px rgba(239,68,68,0.35)' : 'none',
          borderRadius: '10px',
          padding: '8px 18px',
          textAlign: 'center',
          minWidth: '80px',
          flexShrink: 0,
          transition: 'border-color 0.4s, box-shadow 0.4s',
        }}>
          <div style={{
            fontFamily: 'Nunito, sans-serif',
            fontSize: '48px',
            fontWeight: '800',
            color: '#F87171',
            lineHeight: 1,
          }}>
            {redRemaining}
          </div>
          <div style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '9px',
            fontWeight: '700',
            color: '#7F3F3F',
            letterSpacing: '1.5px',
            textTransform: 'uppercase',
            marginTop: '2px',
          }}>
            Red
          </div>
        </div>

        {/* Center */}
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '10px',
            fontWeight: '700',
            color: isOver ? '#484F58' : currentTeam === 'red' ? '#F87171' : '#60A5FA',
            letterSpacing: '1.5px',
            textTransform: 'uppercase',
            marginBottom: clueWord ? '6px' : 0,
            transition: 'color 0.4s',
          }}>
            {phaseLabel}
          </div>
          {clueWord && (
            <div
              key={`${clueWord}-${currentTeam}`}
              style={{ animation: 'clueAppear 0.42s cubic-bezier(0.34,1.56,0.64,1) both' }}
            >
              <span style={{
                fontFamily: 'Nunito, sans-serif',
                fontSize: '28px',
                fontWeight: '800',
                color: '#E6EDF3',
                letterSpacing: '-0.5px',
              }}>
                {clueWord.toUpperCase()}
              </span>
              <span style={{
                fontFamily: 'Nunito, sans-serif',
                fontSize: '22px',
                fontWeight: '800',
                color: currentTeam === 'red' ? '#F87171' : '#60A5FA',
                marginLeft: '10px',
              }}>
                ×{clueNum}
              </span>
              {guessDisplay && (
                <div style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '11px',
                  color: '#484F58',
                  marginTop: '2px',
                }}>
                  {guessDisplay}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Blue score */}
        <div style={{
          backgroundColor: '#0D1929',
          border: `1.5px solid ${blueActive ? '#3B82F6' : '#0D2745'}`,
          boxShadow: blueActive ? '0 0 18px rgba(59,130,246,0.35)' : 'none',
          borderRadius: '10px',
          padding: '8px 18px',
          textAlign: 'center',
          minWidth: '80px',
          flexShrink: 0,
          transition: 'border-color 0.4s, box-shadow 0.4s',
        }}>
          <div style={{
            fontFamily: 'Nunito, sans-serif',
            fontSize: '48px',
            fontWeight: '800',
            color: '#60A5FA',
            lineHeight: 1,
          }}>
            {blueRemaining}
          </div>
          <div style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '9px',
            fontWeight: '700',
            color: '#1E4080',
            letterSpacing: '1.5px',
            textTransform: 'uppercase',
            marginTop: '2px',
          }}>
            Blue
          </div>
        </div>

      </div>
    </>
  );
}
