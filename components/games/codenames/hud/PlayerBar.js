const TEAM_COLORS = { red: '#DC2626', blue: '#2563EB' };
const TEAM_BG     = { red: '#FEE2E2', blue: '#DBEAFE' };

function getActionLabel(player, phase, currentTeam) {
  const { team, role } = player;
  if (!team || !role) return null;
  if (phase === 'grid-veto')        return 'Voting on grid';
  if (phase === 'spymaster-clue') {
    if (team === currentTeam && role === 'spymaster') return 'Giving clue...';
    if (team === currentTeam && role === 'operative') return 'Waiting for clue';
    return 'Observing';
  }
  if (phase === 'operatives-guess') {
    if (team === currentTeam && role === 'operative') return 'Guessing...';
    if (team === currentTeam && role === 'spymaster') return 'Observing';
    return 'Waiting';
  }
  if (phase === 'spymaster-needed') return 'Spymaster needed!';
  return null;
}

export default function PlayerBar({ players, myUuid, phase, currentTeam }) {
  if (!players || players.length === 0) return null;

  const redPlayers  = players.filter(p => p.team === 'red');
  const bluePlayers = players.filter(p => p.team === 'blue');
  const others      = players.filter(p => !p.team);

  const renderPlayer = (p) => {
    const isMe     = p.uuid === myUuid;
    const color    = TEAM_COLORS[p.team] || '#8D99AE';
    const bg       = TEAM_BG[p.team]     || '#F5F0E8';
    const action   = getActionLabel(p, phase, currentTeam);
    const isActive = (phase === 'spymaster-clue'   && p.team === currentTeam && p.role === 'spymaster')
                  || (phase === 'operatives-guess'  && p.team === currentTeam && p.role === 'operative');

    return (
      <div
        key={p.uuid}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '5px 10px',
          backgroundColor: p.team ? bg : '#F5F0E8',
          border: `1.5px solid ${isMe ? color : (p.team ? color + '60' : '#E8E4D8')}`,
          borderRadius: '20px',
          position: 'relative',
        }}
      >
        {isActive && (
          <span style={{
            width: '6px', height: '6px', borderRadius: '50%',
            backgroundColor: color,
            flexShrink: 0,
            animation: 'pulse 1.5s infinite',
          }} />
        )}
        <span style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: '12px',
          fontWeight: isMe ? '700' : '500',
          color: p.team ? color : '#8D99AE',
          whiteSpace: 'nowrap',
        }}>
          {p.name}{isMe ? ' (you)' : ''}
        </span>
        {p.role && (
          <span style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '9px',
            fontWeight: '700',
            letterSpacing: '0.5px',
            textTransform: 'uppercase',
            color: p.team ? color : '#8D99AE',
            opacity: 0.8,
          }}>
            {p.role === 'spymaster' ? 'SPY' : 'OP'}
          </span>
        )}
        {action && isActive && (
          <span style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '10px',
            color: color,
            fontStyle: 'italic',
            whiteSpace: 'nowrap',
          }}>
            {action}
          </span>
        )}
      </div>
    );
  };

  return (
    <>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
      <div style={{
        width: '100%',
        backgroundColor: 'white',
        borderBottom: '1px solid #E8E4D8',
        padding: '8px 16px',
        overflowX: 'auto',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          minWidth: 'max-content',
          margin: '0 auto',
          maxWidth: '800px',
        }}>
          {redPlayers.length > 0 && (
            <>
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', fontWeight: '700', color: '#DC2626', textTransform: 'uppercase', letterSpacing: '0.5px', flexShrink: 0 }}>Red</span>
              {redPlayers.map(renderPlayer)}
              <div style={{ width: '1px', height: '20px', backgroundColor: '#E8E4D8', flexShrink: 0, margin: '0 4px' }} />
            </>
          )}
          {bluePlayers.length > 0 && (
            <>
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', fontWeight: '700', color: '#2563EB', textTransform: 'uppercase', letterSpacing: '0.5px', flexShrink: 0 }}>Blue</span>
              {bluePlayers.map(renderPlayer)}
            </>
          )}
          {others.length > 0 && (
            <>
              {(redPlayers.length > 0 || bluePlayers.length > 0) && (
                <div style={{ width: '1px', height: '20px', backgroundColor: '#E8E4D8', flexShrink: 0, margin: '0 4px' }} />
              )}
              {others.map(renderPlayer)}
            </>
          )}
        </div>
      </div>
    </>
  );
}
