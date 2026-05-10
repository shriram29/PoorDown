import { motion } from 'framer-motion';

function DarkButton({ children, onClick, disabled, color = '#6366f1' }) {
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.97 }}
      style={{
        padding: '8px 14px',
        backgroundColor: disabled ? '#2a2d50' : color,
        color: disabled ? '#4a4d6a' : 'white',
        border: 'none',
        borderRadius: '8px',
        fontSize: '12px',
        fontWeight: '600',
        fontFamily: 'Inter, sans-serif',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'background-color 0.15s',
      }}
    >
      {children}
    </motion.button>
  );
}

export default function ActionBar({
  phase,
  canRoll,
  canBuy,
  canEndTurn,
  onRoll,
  onBuy,
  onAuction,
  onTrade,
  onEndTurn,
  onStartGame,
  isHost,
  isMyTurn,
  players,
}) {
  if (phase === 'setup') {
    return (
      <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
        <p style={{ margin: 0, fontSize: '12px', color: '#7a7d9a', fontFamily: 'Inter, sans-serif', textAlign: 'center' }}>
          {isHost
            ? `${players?.length || 0} player${players?.length !== 1 ? 's' : ''} in lobby`
            : `Waiting for host… (${players?.length || 0} players)`}
        </p>
        {isHost && (
          <DarkButton onClick={onStartGame} disabled={players?.length < 2} color="#22c55e">
            Start Game
          </DarkButton>
        )}
        {isHost && players?.length < 2 && (
          <p style={{ margin: 0, fontSize: '11px', color: '#4a4d6a', fontFamily: 'Inter, sans-serif' }}>
            Need at least 2 players
          </p>
        )}
      </div>
    );
  }

  if (phase === 'gameOver') {
    return (
      <div style={{ padding: '12px', display: 'flex', justifyContent: 'center' }}>
        <DarkButton color="#f97316" onClick={() => { localStorage.removeItem('poordown_active_room'); window.location.href = '/monopoly'; }}>
          Back to Lobby
        </DarkButton>
      </div>
    );
  }

  const hasActions = canRoll || canBuy || canEndTurn;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {canRoll && <DarkButton onClick={onRoll} color='#6366f1'>Roll Dice</DarkButton>}
      {canBuy && (
        <div style={{ display: 'flex', gap: '6px' }}>
          <DarkButton onClick={onBuy} color='#22c55e'>Buy</DarkButton>
          {onAuction && <DarkButton onClick={onAuction} color='#7c3aed'>Auction</DarkButton>}
        </div>
      )}
      {canEndTurn && <DarkButton onClick={onEndTurn} color='#f97316'>End Turn</DarkButton>}
      {!hasActions && !isMyTurn && phase !== 'connecting' && (
        <p style={{ margin: 0, fontSize: '11px', color: '#4a4d6a', fontFamily: 'Inter, sans-serif', textAlign: 'center' }}>
          Waiting…
        </p>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
