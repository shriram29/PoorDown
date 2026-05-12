import Card from './Card';

export default function Board({ words, keyCard, revealed, isSpymaster, isClickable, onCardClick, selectedCard, showAll }) {
  if (!words || words.length !== 25) return null;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        gridTemplateRows: 'repeat(5, 1fr)',
        gap: '7px',
        width: '100%',
        height: '100%',
      }}
    >
      {words.map((word, i) => (
        <Card
          key={i}
          word={word}
          type={keyCard[i]}
          revealed={revealed[i]}
          isSpymaster={isSpymaster}
          isClickable={isClickable && !revealed[i]}
          onClick={() => onCardClick(i)}
          selected={selectedCard === i}
          showAll={showAll}
        />
      ))}
    </div>
  );
}
