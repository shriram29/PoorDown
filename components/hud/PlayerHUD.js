// Player HUD component
import { PLAYER_COLORS } from '../../lib/game/board';

export default function PlayerHUD({ 
  player, 
  index, 
  isCurrentPlayer, 
  isMyPlayer,
  onClick 
}) {
  const colorHex = PLAYER_COLORS[index % PLAYER_COLORS.length];
  
  return (
    <div
      onClick={onClick}
      style={{
        padding: '12px 16px',
        backgroundColor: isCurrentPlayer ? 'rgba(244, 162, 97, 0.15)' : '#F8F4E8',
        border: isCurrentPlayer ? `3px solid ${colorHex}` : '2px solid transparent',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s ease',
        boxShadow: isCurrentPlayer ? `0 0 15px ${colorHex}40` : '0 2px 8px rgba(0,0,0,0.1)',
        opacity: player.isEliminated ? 0.5 : 1,
      }}
    >
      {/* Avatar */}
      <div
        style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          backgroundColor: colorHex,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          border: '3px solid white',
          boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
        }}
      >
        <span
          style={{
            color: 'white',
            fontWeight: '700',
            fontSize: '16px',
            fontFamily: 'Inter, sans-serif',
          }}
        >
          {player.name?.charAt(0)?.toUpperCase() || '?'}
        </span>
      </div>
      
      {/* Info */}
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              fontWeight: '600',
              fontSize: '14px',
              fontFamily: 'Inter, sans-serif',
              color: '#2B2D42',
              textDecoration: player.isEliminated ? 'line-through' : 'none',
            }}
          >
            {player.name || 'Player ' + (index + 1)}
          </span>
          {player.isBot && (
            <span
              style={{
                fontSize: '10px',
                padding: '2px 6px',
                backgroundColor: '#8D99AE',
                color: 'white',
                borderRadius: '8px',
                fontWeight: '500',
              }}
            >
              BOT
            </span>
          )}
          {isMyPlayer && (
            <span
              style={{
                fontSize: '10px',
                padding: '2px 6px',
                backgroundColor: '#2D6A4F',
                color: 'white',
                borderRadius: '8px',
                fontWeight: '500',
              }}
            >
              YOU
            </span>
          )}
        </div>
        
        <div
          style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '16px',
            fontWeight: '600',
            color: '#228B22',
          }}
        >
          ${player.cash?.toLocaleString() || '0'}
        </div>
      </div>
      
      {/* Turn indicator */}
      {isCurrentPlayer && (
        <div
          style={{
            padding: '4px 12px',
            backgroundColor: colorHex,
            color: 'white',
            borderRadius: '16px',
            fontSize: '11px',
            fontWeight: '700',
            fontFamily: 'Inter, sans-serif',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          {isMyPlayer ? 'Your Turn' : 'Playing'}
        </div>
      )}
      
      {/* Properties count */}
      {player.properties?.length > 0 && (
        <div
          style={{
            padding: '4px 8px',
            backgroundColor: '#1D3557',
            color: 'white',
            borderRadius: '8px',
            fontSize: '11px',
            fontWeight: '600',
            fontFamily: 'Inter, sans-serif',
          }}
        >
          {player.properties.length} props
        </div>
      )}
      
      {/* Jail indicator */}
      {player.inJail && (
        <div
          style={{
            padding: '4px 8px',
            backgroundColor: '#E76F51',
            color: 'white',
            borderRadius: '8px',
            fontSize: '11px',
            fontWeight: '600',
            fontFamily: 'Inter, sans-serif',
          }}
        >
          🏠 JAIL ({player.jailTurns}/3)
        </div>
      )}
      
      {/* Eliminated */}
      {player.isEliminated && (
        <div
          style={{
            padding: '4px 8px',
            backgroundColor: '#E63946',
            color: 'white',
            borderRadius: '8px',
            fontSize: '11px',
            fontWeight: '600',
            fontFamily: 'Inter, sans-serif',
          }}
        >
          BANKRUPT
        </div>
      )}
    </div>
  );
}