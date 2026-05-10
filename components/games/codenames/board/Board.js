import Card from './Card';

export default function Board({ words, keyCard, revealed, isSpymaster, isClickable, onCardClick }) {
  if (!words || words.length !== 25) return null;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        gap: '8px',
        maxWidth: '700px',
        width: '100%',
        margin: '0 auto',
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
        />
      ))}
    </div>
  );
}
