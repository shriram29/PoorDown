import { useState } from 'react';

export default function MyHand({
  cards, renderCard, isMyTurn, handStyle,
  panelDark, panelBorder, textDim,
}) {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  if (handStyle === 'fan') {
    const n = cards.length;
    const maxAngle = Math.min(25, n * 3);
    const step = n > 1 ? (2 * maxAngle) / (n - 1) : 0;

    return (
      <div style={{
        position: 'relative', height: 180, overflow: 'visible',
        flexShrink: 0,
      }}>
        {cards.map((card, i) => {
          const angle = n > 1 ? -maxAngle + step * i : 0;
          const hovered = isMyTurn && hoveredIdx === i;
          // Only lift, no scale — keeps visual card inside the mouse hit area
          const transform = hovered
            ? `translateX(-50%) rotate(${angle}deg) translateY(-22px)`
            : `translateX(-50%) rotate(${angle}deg)`;

          return (
            <div
              key={card.id}
              style={{
                position: 'absolute',
                bottom: 0,
                left: '50%',
                transform,
                transformOrigin: 'center calc(100% + 320px)',
                zIndex: hovered ? 50 : i,
                transition: 'transform 0.15s ease',
                // Extend the hit area upward so moving the mouse onto the lifted card
                // doesn't trigger a mouseLeave on the wrapper
                paddingTop: 40,
                marginTop: -40,
              }}
              onMouseEnter={() => isMyTurn && setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              {renderCard(card, i, { hovered })}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div style={{
      backgroundColor: panelDark,
      borderTop: `1px solid ${panelBorder}`,
      padding: '10px 16px',
      display: 'flex',
      gap: 4,
      flexWrap: 'wrap',
      alignItems: 'flex-end',
      minHeight: 70,
    }}>
      {cards.length === 0 && (
        <span style={{
          fontFamily: 'Inter, sans-serif', fontSize: 12, color: `${textDim}55`, alignSelf: 'center',
        }}>
          No cards
        </span>
      )}
      {cards.map((card, i) => (
        <div key={card.id}>
          {renderCard(card, i, { hovered: false })}
        </div>
      ))}
    </div>
  );
}
