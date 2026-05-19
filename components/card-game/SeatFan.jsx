export default function SeatFan({ count, color, fanRotation, cardWidth = 56, cardHeight = 84 }) {
  const n = Math.min(count, 7);
  const maxAngle = Math.min(28, n * 4);
  const step = n > 1 ? (2 * maxAngle) / (n - 1) : 0;
  const containerW = cardWidth + 56;
  const containerH = cardHeight + 44;
  const arcRadius = cardHeight * 1.75;

  return (
    <div style={{
      position: 'relative',
      width: containerW, height: containerH,
      transform: `rotate(${fanRotation}deg)`,
      flexShrink: 0,
    }}>
      {Array.from({ length: n }).map((_, i) => {
        const angle = -maxAngle + step * i;
        return (
          <div key={i} style={{
            position: 'absolute',
            bottom: 0, left: '50%',
            transform: `translateX(-50%) rotate(${angle}deg)`,
            transformOrigin: `center calc(100% + ${arcRadius}px)`,
            zIndex: i,
          }}>
            <div style={{
              width: cardWidth, height: cardHeight,
              borderRadius: Math.round(cardWidth * 0.13),
              backgroundColor: '#0e1525',
              border: `2px solid ${color}55`,
              backgroundImage: `repeating-linear-gradient(45deg, ${color}15 0, ${color}15 2px, transparent 2px, transparent 9px)`,
              boxShadow: '0 3px 12px rgba(0,0,0,0.65)',
            }} />
          </div>
        );
      })}
      {count > 7 && (
        <div style={{
          position: 'absolute', bottom: -22, left: '50%',
          transform: `translateX(-50%) rotate(${-fanRotation}deg)`,
          fontFamily: 'JetBrains Mono, monospace', fontSize: 10, fontWeight: '700',
          color: '#ffffff88', whiteSpace: 'nowrap',
          backgroundColor: 'rgba(0,0,0,0.5)', padding: '2px 5px', borderRadius: 3,
        }}>+{count - 7}</div>
      )}
    </div>
  );
}
