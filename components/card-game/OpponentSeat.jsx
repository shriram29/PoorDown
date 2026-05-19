export default function OpponentSeat({
  player, isActive, isMe, color, cardCount,
  showCardFaces, renderCards,
  canCallOut, onCallOut,
  disconnected, disconnectSecsLeft,
  roundScore,
  panel, panelDark, surface, panelBorder, text, textDim, gameColor, gold,
}) {
  if (showCardFaces) {
    return (
      <div style={{
        flex: 1,
        backgroundColor: isActive ? panel : surface,
        border: `2px solid ${player.busted ? '#ff4d5666' : player.stayed ? '#2a9a7066' : isActive ? color : panelBorder}`,
        borderLeft: `4px solid ${color}`,
        borderRadius: 14, padding: '10px 12px',
        boxShadow: isActive ? `0 0 20px ${color}50, 0 6px 18px rgba(0,0,0,0.5)` : '0 4px 12px rgba(0,0,0,0.4)',
        transition: 'border-color 0.25s, box-shadow 0.25s',
        opacity: player.busted ? 0.65 : 1,
        flex: 1, minWidth: 180, maxWidth: 220,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
          <span style={{
            fontFamily: 'Nunito, sans-serif', fontWeight: '800', fontSize: 13, color: text,
            flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {player.name}{isMe ? ' ✦' : ''}
          </span>
          {disconnected && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <span style={{
                fontSize: 9, color: '#ff4d56', fontWeight: '700',
                fontFamily: 'Inter, sans-serif',
                backgroundColor: '#ff4d5622', padding: '1px 5px', borderRadius: 4, letterSpacing: '0.3px',
              }}>OFFLINE</span>
              {disconnectSecsLeft !== null && (
                <span style={{ fontSize: 9, color: '#ff4d5699', fontFamily: 'Inter, sans-serif' }}>
                  {disconnectSecsLeft}s
                </span>
              )}
            </span>
          )}
          {player.busted && (
            <span style={{
              fontFamily: 'Inter, sans-serif', fontWeight: '800', fontSize: 10,
              color: '#ff4d56', letterSpacing: '0.5px',
            }}>BUST</span>
          )}
          {player.stayed && (
            <span style={{
              fontFamily: 'JetBrains Mono, monospace', fontWeight: '700', fontSize: 11, color: gold,
            }}>
              {roundScore}
            </span>
          )}
          {player.frozen && !player.busted && !player.stayed && (
            <span style={{ fontSize: 12 }}>❄️</span>
          )}
        </div>

        {renderCards && renderCards()}

        <div style={{
          marginTop: 7, display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', gap: 4,
        }}>
          {player.hasSecondChance
            ? (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 3,
                backgroundColor: '#6a3aa818', border: '1px solid #6a3aa844',
                borderRadius: 5, padding: '2px 6px',
              }}>
                <span style={{ fontSize: 10 }}>♻</span>
                <span style={{
                  fontFamily: 'Inter, sans-serif', fontSize: 9, color: '#a07ad8', fontWeight: '600',
                }}>2nd Chance</span>
              </div>
            )
            : <span />
          }
          {!player.busted && !player.stayed && roundScore !== undefined && (
            <span style={{
              fontFamily: 'JetBrains Mono, monospace', fontSize: 10, color: textDim,
            }}>
              ~{roundScore}
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{
      backgroundColor: isActive ? panel : surface,
      border: `2px solid ${isActive ? color : panelBorder}`,
      borderTop: `4px solid ${color}`,
      borderRadius: 12, padding: '10px 14px', minWidth: 130, flexShrink: 0,
      boxShadow: isActive ? `0 0 20px ${color}55` : '0 4px 12px rgba(0,0,0,0.4)',
      transition: 'border-color 0.25s, box-shadow 0.25s',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        <span style={{
          fontFamily: 'Inter, sans-serif', fontWeight: '700', fontSize: 13, color: text,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 100,
        }}>
          {player.name}
        </span>
        {isActive && (
          <div style={{
            width: 7, height: 7, borderRadius: '50%',
            backgroundColor: color, flexShrink: 0,
            animation: 'blink 1s infinite',
          }} />
        )}
        {cardCount === 1 && !canCallOut && (
          <span style={{
            fontFamily: 'Inter, sans-serif', fontSize: 9, fontWeight: '800',
            color: gameColor, backgroundColor: `${gameColor}22`,
            padding: '1px 5px', borderRadius: 4, flexShrink: 0,
          }}>UNO!</span>
        )}
      </div>

      <div style={{ display: 'flex', gap: 3, alignItems: 'flex-end' }}>
        {Array.from({ length: Math.min(cardCount, 6) }).map((_, i) => (
          <CardBackSmall key={i} gameColor={gameColor} />
        ))}
        {cardCount > 6 && (
          <span style={{
            fontFamily: 'JetBrains Mono, monospace', fontSize: 10,
            color: textDim, marginLeft: 2, alignSelf: 'center',
          }}>
            +{cardCount - 6}
          </span>
        )}
        {cardCount === 0 && (
          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: 11, color: textDim }}>
            No cards
          </span>
        )}
      </div>

      {canCallOut && (
        <button
          onClick={onCallOut}
          style={{
            marginTop: 8, width: '100%', padding: '5px 0',
            backgroundColor: `${gameColor}20`,
            border: `1px solid ${gameColor}88`,
            borderRadius: 6,
            fontFamily: 'Inter, sans-serif', fontSize: 11, fontWeight: '700',
            color: gameColor, cursor: 'pointer',
            animation: 'calloutPulse 1.4s ease-in-out infinite',
            transition: 'background-color 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.backgroundColor = `${gameColor}40`; }}
          onMouseLeave={e => { e.currentTarget.style.backgroundColor = `${gameColor}20`; }}
        >
          Call out! (+2)
        </button>
      )}
    </div>
  );
}

function CardBackSmall({ gameColor }) {
  return (
    <div style={{
      width: 38, height: 56, borderRadius: 8,
      backgroundColor: '#12183a',
      border: `2px solid ${gameColor}44`,
      backgroundImage: `repeating-linear-gradient(45deg, ${gameColor}09 0px, ${gameColor}09 2px, transparent 2px, transparent 10px)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: '0 3px 10px rgba(0,0,0,0.55)', flexShrink: 0,
    }}>
      <span style={{
        fontFamily: 'Nunito, sans-serif', fontWeight: '900', fontSize: 7,
        color: `${gameColor}88`, letterSpacing: '1px',
      }}>
        UNO
      </span>
    </div>
  );
}
