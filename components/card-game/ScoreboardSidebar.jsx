export default function ScoreboardSidebar({
  players, cumulativeScores, myUuid, playerColors, targetScore, roundNum,
  panelDark, panelBorder, text, textDim, gold, surface, gameColor,
  getRoundScore,
}) {
  return (
    <div style={{
      width: 170, flexShrink: 0,
      backgroundColor: panelDark,
      borderRight: `1px solid ${panelBorder}`,
      display: 'flex', flexDirection: 'column',
      overflowY: 'auto',
      padding: '16px 0',
    }}>
      {/* Round scores */}
      <div style={{ padding: '0 14px 12px' }}>
        <p style={{
          fontFamily: 'Inter, sans-serif', fontSize: 9, fontWeight: '700',
          color: textDim, textTransform: 'uppercase', letterSpacing: '1.2px',
          margin: '0 0 10px 0',
        }}>
          Round {roundNum}
        </p>
        {players.map((p, i) => {
          const displayScore = getRoundScore(p);
          const status = p.busted ? 'bust' : p.stayed ? 'done' : p.frozen ? 'frozen' : 'in';
          const scoreColor = p.busted ? '#ff4d5688' : p.stayed ? gold : text;
          const statusColor = p.busted ? '#ff4d5688' : p.stayed ? `${gold}99` : p.frozen ? '#60a5fa88' : `${textDim}88`;
          return (
            <div key={p.uuid} style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 2 }}>
                <div style={{
                  width: 7, height: 7, borderRadius: '50%',
                  backgroundColor: playerColors[i % playerColors.length], flexShrink: 0,
                }} />
                <span style={{
                  fontFamily: 'Inter, sans-serif', fontSize: 11,
                  color: p.uuid === myUuid ? text : textDim,
                  fontWeight: p.uuid === myUuid ? '700' : '400',
                  flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {p.name}
                </span>
              </div>
              <div style={{ paddingLeft: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{
                  fontFamily: 'JetBrains Mono, monospace', fontSize: 12, fontWeight: '700',
                  color: scoreColor,
                }}>
                  {displayScore}
                </span>
                <span style={{
                  fontFamily: 'Inter, sans-serif', fontSize: 9, color: statusColor, letterSpacing: '0.4px',
                }}>
                  {status}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ height: 1, backgroundColor: panelBorder, margin: '4px 14px 12px' }} />

      {/* Progress bars */}
      <div style={{ padding: '0 14px' }}>
        <p style={{
          fontFamily: 'Inter, sans-serif', fontSize: 9, fontWeight: '700',
          color: textDim, textTransform: 'uppercase', letterSpacing: '1.2px',
          margin: '0 0 10px 0',
        }}>
          Total
        </p>
        {Object.entries(cumulativeScores)
          .sort(([, a], [, b]) => b - a)
          .map(([uuid, score]) => {
            const p = players.find(pl => pl.uuid === uuid);
            const pi = players.findIndex(pl => pl.uuid === uuid);
            const pct = Math.min(score / targetScore, 1);
            return (
              <div key={uuid} style={{ marginBottom: 10 }}>
                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4,
                }}>
                  <span style={{
                    fontFamily: 'Inter, sans-serif', fontSize: 11,
                    color: uuid === myUuid ? text : textDim,
                    fontWeight: uuid === myUuid ? '700' : '400',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 80,
                  }}>
                    {p?.name || '?'}
                  </span>
                  <span style={{
                    fontFamily: 'JetBrains Mono, monospace', fontSize: 12, fontWeight: '700',
                    color: score >= targetScore * 0.75 ? gold : text,
                  }}>
                    {score}
                  </span>
                </div>
                <div style={{ height: 4, backgroundColor: surface, borderRadius: 2 }}>
                  <div style={{
                    height: 4,
                    backgroundColor: playerColors[pi >= 0 ? pi % playerColors.length : 0],
                    borderRadius: 2,
                    width: `${pct * 100}%`,
                    transition: 'width 0.6s ease',
                  }} />
                </div>
              </div>
            );
          })}
        {Object.keys(cumulativeScores).length === 0 && (
          <p style={{
            fontFamily: 'Inter, sans-serif', fontSize: 11, color: `${textDim}66`, margin: 0,
          }}>
            No scores yet
          </p>
        )}
      </div>
    </div>
  );
}
