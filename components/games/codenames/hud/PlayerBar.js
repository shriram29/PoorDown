const TEAM_VIVID = { red: '#F87171', blue: '#60A5FA' };
const TEAM_DIM   = { red: '#4A1F1F', blue: '#0D2745' };

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
    const vivid    = TEAM_VIVID[p.team] || '#8B949E';
    const dim      = TEAM_DIM[p.team]   || '#21262D';
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
          padding: '4px 10px',
          backgroundColor: p.team ? dim : '#21262D',
          border: `1.5px solid ${isMe ? vivid : (p.team ? vivid + '55' : '#30363D')}`,
          borderRadius: '20px',
        }}
      >
        {isActive && (
          <span style={{
            width: '6px', height: '6px', borderRadius: '50%',
            backgroundColor: vivid,
            flexShrink: 0,
            animation: 'pulse 1.5s infinite',
          }} />
        )}
        <span style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: '12px',
          fontWeight: isMe ? '700' : '500',
          color: p.team ? vivid : '#8B949E',
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
            color: p.team ? vivid : '#8B949E',
            opacity: 0.7,
          }}>
            {p.role === 'spymaster' ? 'SPY' : 'OP'}
          </span>
        )}
        {action && isActive && (
          <span style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '10px',
            color: vivid,
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
        backgroundColor: '#161B22',
        borderBottom: '1px solid #21262D',
        padding: '7px 16px',
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
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', fontWeight: '700', color: '#F87171', textTransform: 'uppercase', letterSpacing: '0.5px', flexShrink: 0, opacity: 0.7 }}>Red</span>
              {redPlayers.map(renderPlayer)}
              <div style={{ width: '1px', height: '16px', backgroundColor: '#30363D', flexShrink: 0, margin: '0 4px' }} />
            </>
          )}
          {bluePlayers.length > 0 && (
            <>
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', fontWeight: '700', color: '#60A5FA', textTransform: 'uppercase', letterSpacing: '0.5px', flexShrink: 0, opacity: 0.7 }}>Blue</span>
              {bluePlayers.map(renderPlayer)}
            </>
          )}
          {others.length > 0 && (
            <>
              {(redPlayers.length > 0 || bluePlayers.length > 0) && (
                <div style={{ width: '1px', height: '16px', backgroundColor: '#30363D', flexShrink: 0, margin: '0 4px' }} />
              )}
              {others.map(renderPlayer)}
            </>
          )}
        </div>
      </div>
    </>
  );
}
