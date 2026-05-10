export default function GameHUD({
  phase, currentTeam, clueWord, clueNumber, guessesLeft, redRemaining, blueRemaining,
}) {
  const teamColor = currentTeam === 'red' ? '#DC2626' : '#2563EB';
  const teamLabel = currentTeam === 'red' ? 'RED' : 'BLUE';

  const phaseLabel = {
    'spymaster-clue':   `${teamLabel} — Spymaster is thinking...`,
    'operatives-guess': `${teamLabel} — Guessing`,
    'over':             'Game Over',
  }[phase] || '';

  const clueDisplay = clueWord
    ? `"${clueWord}"  ×  ${clueNumber === 0 ? '∞' : clueNumber}`
    : null;

  const guessDisplay = phase === 'operatives-guess' && clueWord
    ? (guessesLeft >= 99 ? '∞ guesses left' : `${guessesLeft} guess${guessesLeft === 1 ? '' : 'es'} left`)
    : null;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 20px',
        backgroundColor: 'white',
        borderBottom: '1px solid #E8E4D8',
        gap: '12px',
        flexWrap: 'wrap',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}
    >
      {/* Red score */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: '70px' }}>
        <div style={{ width: '10px', height: '10px', borderRadius: '3px', backgroundColor: '#DC2626', flexShrink: 0 }} />
        <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: '800', color: '#DC2626', fontSize: '20px' }}>
          {redRemaining}
        </span>
        <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#8D99AE' }}>left</span>
      </div>

      {/* Center */}
      <div style={{ textAlign: 'center', flex: 1 }}>
        <div
          style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '10px',
            fontWeight: '700',
            color: phase === 'over' ? '#8D99AE' : teamColor,
            letterSpacing: '1.2px',
            textTransform: 'uppercase',
            marginBottom: clueDisplay ? '3px' : 0,
          }}
        >
          {phaseLabel}
        </div>
        {clueDisplay && (
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '10px' }}>
            <span
              style={{
                fontFamily: 'Nunito, sans-serif',
                fontSize: '22px',
                fontWeight: '800',
                color: '#2B2D42',
                lineHeight: 1,
              }}
            >
              {clueDisplay}
            </span>
            {guessDisplay && (
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#8D99AE' }}>
                {guessDisplay}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Blue score */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: '70px', justifyContent: 'flex-end' }}>
        <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#8D99AE' }}>left</span>
        <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: '800', color: '#2563EB', fontSize: '20px' }}>
          {blueRemaining}
        </span>
        <div style={{ width: '10px', height: '10px', borderRadius: '3px', backgroundColor: '#2563EB', flexShrink: 0 }} />
      </div>
    </div>
  );
}
