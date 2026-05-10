// Action Bar component - Roll, Buy, Trade, End Turn buttons
import { motion } from 'framer-motion';

function Button({ children, onClick, disabled, variant = 'primary', loading = false }) {
  const variants = {
    primary: {
      bg: '#E63946',
      hover: '#D32F2F',
    },
    secondary: {
      bg: '#1D3557',
      hover: '#15263E',
    },
    success: {
      bg: '#2D6A4F',
      hover: '#245A42',
    },
    gold: {
      bg: '#F4A261',
      hover: '#E8934F',
    },
  };

  const style = variants[variant] || variants.primary;

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled || loading}
      whileHover={{ scale: disabled ? 1 : 1.03 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      style={{
        padding: '12px 24px',
        backgroundColor: disabled ? '#8D99AE' : style.bg,
        color: 'white',
        border: 'none',
        borderRadius: '12px',
        fontSize: '14px',
        fontWeight: '600',
        fontFamily: 'Inter, sans-serif',
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        boxShadow: disabled ? 'none' : '0 4px 12px rgba(0,0,0,0.2)',
        transition: 'background-color 0.2s ease',
        opacity: loading ? 0.7 : 1,
      }}
      onMouseEnter={(e) => {
        if (!disabled) e.target.style.backgroundColor = style.hover;
      }}
      onMouseLeave={(e) => {
        e.target.style.backgroundColor = disabled ? '#8D99AE' : style.bg;
      }}
    >
      {loading && (
        <div
          style={{
            width: '14px',
            height: '14px',
            border: '2px solid white',
            borderTopColor: 'transparent',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }}
        />
      )}
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
  loading = false,
}) {
  // Setup phase - host can start game
  if (phase === 'setup') {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          padding: '16px',
          backgroundColor: '#F8F4E8',
          borderRadius: '16px',
          boxShadow: '0 -4px 20px rgba(0,0,0,0.1)',
        }}
      >
        {isHost ? (
          <div style={{ textAlign: 'center' }}>
            <p style={{ margin: '0 0 12px 0', fontFamily: 'Inter, sans-serif', color: '#2B2D42' }}>
              Waiting for players... ({players?.length || 0} joined)
            </p>
            <Button
              onClick={onStartGame}
              disabled={players?.length < 2}
              variant="success"
            >
              🎮 Start Game
            </Button>
            {players?.length < 2 && (
              <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#8D99AE', fontFamily: 'Inter, sans-serif' }}>
                Need at least 2 players to start
              </p>
            )}
          </div>
        ) : (
          <p style={{ fontFamily: 'Inter, sans-serif', color: '#2B2D42' }}>
            Waiting for host to start... ({players?.length || 0} players)
          </p>
        )}
      </div>
    );
  }

  // Game over
  if (phase === 'gameOver') {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          padding: '16px',
          backgroundColor: '#F8F4E8',
          borderRadius: '16px',
          boxShadow: '0 -4px 20px rgba(0,0,0,0.1)',
        }}
      >
        <Button variant="gold" onClick={() => { localStorage.removeItem('poordown_active_room'); window.location.href = '/monopoly'; }}>
          🏠 Back to Lobby
        </Button>
      </div>
    );
  }

  // Game in progress
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '12px',
        padding: '16px',
        backgroundColor: '#F8F4E8',
        borderRadius: '16px',
        boxShadow: '0 -4px 20px rgba(0,0,0,0.1)',
        flexWrap: 'wrap',
      }}
    >
      {/* Roll Dice - only on player's turn when in rolling phase */}
      {canRoll && (
        <Button onClick={onRoll} variant="primary" loading={loading}>
          🎲 Roll Dice
        </Button>
      )}

      {/* Buy Property */}
      {canBuy && (
        <>
          <Button onClick={onBuy} variant="success" loading={loading}>
            🏠 Buy Property
          </Button>
          {onAuction && (
            <Button onClick={onAuction} variant="secondary" loading={loading}>
              🔨 Auction
            </Button>
          )}
        </>
      )}

      {/* Trade */}
      {isMyTurn && onTrade && (
        <Button onClick={onTrade} variant="secondary" loading={loading}>
          🔄 Trade
        </Button>
      )}

      {/* End Turn */}
      {canEndTurn && (
        <Button onClick={onEndTurn} variant="gold" loading={loading}>
          ⏭️ End Turn
        </Button>
      )}

      {/* Not my turn message */}
      {!isMyTurn && phase !== 'rolling' && phase !== 'buying' && (
        <p
          style={{
            margin: 0,
            fontFamily: 'Inter, sans-serif',
            color: '#8D99AE',
            fontSize: '14px',
            alignSelf: 'center',
          }}
        >
          Waiting for other players...
        </p>
      )}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
