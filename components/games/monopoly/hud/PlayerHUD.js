export default function PlayerHUD({ player, index, isCurrentPlayer, isMyPlayer, onClick }) {
  const color = player.color || '#6366f1';

  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '7px 14px',
        borderLeft: `3px solid ${isCurrentPlayer ? color : 'transparent'}`,
        backgroundColor: isCurrentPlayer ? 'rgba(255,255,255,0.04)' : 'transparent',
        opacity: player.isEliminated ? 0.4 : 1,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'background-color 0.15s',
      }}
    >
      <div
        style={{
          width: '26px',
          height: '26px',
          borderRadius: '50%',
          backgroundColor: color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '11px',
          fontWeight: '700',
          color: 'white',
          flexShrink: 0,
          fontFamily: 'Inter, sans-serif',
        }}
      >
        {player.name?.charAt(0)?.toUpperCase() || '?'}
      </div>

      <span
        style={{
          flex: 1,
          fontSize: '13px',
          color: isCurrentPlayer ? '#e2e2f0' : '#a0a3bc',
          fontWeight: isCurrentPlayer ? '600' : '400',
          fontFamily: 'Inter, sans-serif',
          textDecoration: player.isEliminated ? 'line-through' : 'none',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {player.name || `Player ${index + 1}`}
        {isMyPlayer && (
          <span style={{ marginLeft: '5px', fontSize: '10px', color: '#4a4d6a' }}>(you)</span>
        )}
        {player.inJail && !player.isEliminated && (
          <span style={{ marginLeft: '5px', fontSize: '10px', color: '#f59e0b' }}>jail</span>
        )}
      </span>

      <span
        style={{
          fontSize: '13px',
          fontFamily: 'monospace',
          fontWeight: '600',
          color: player.isEliminated ? '#ef4444' : '#4ade80',
          flexShrink: 0,
        }}
      >
        {player.isEliminated ? 'OUT' : `$${(player.cash ?? 0).toLocaleString()}`}
      </span>
    </div>
  );
}
