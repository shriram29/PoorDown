import { useState } from 'react';

export default function ClueInput({ currentTeam, onSubmit }) {
  const [word, setWord] = useState('');
  const [number, setNumber] = useState(2);

  const teamColor = currentTeam === 'red' ? '#DC2626' : '#2563EB';
  const teamBg    = currentTeam === 'red' ? '#FFF5F5' : '#EFF6FF';

  const isValid = word.trim().length > 0 && !word.includes(' ');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isValid) return;
    onSubmit(word.trim().toUpperCase(), number);
    setWord('');
    setNumber(2);
  };

  return (
    <div
      style={{
        backgroundColor: teamBg,
        border: `2px solid ${teamColor}`,
        borderRadius: '16px',
        padding: '18px 22px',
        maxWidth: '560px',
        width: '100%',
      }}
    >
      <p
        style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: '11px',
          fontWeight: '700',
          color: teamColor,
          letterSpacing: '1px',
          textTransform: 'uppercase',
          margin: '0 0 12px 0',
        }}
      >
        Your clue — one word, no board words allowed
      </p>
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '8px' }}>
        <input
          type="text"
          value={word}
          onChange={e => setWord(e.target.value.replace(/\s/g, ''))}
          placeholder="Clue word..."
          maxLength={30}
          autoComplete="off"
          autoFocus
          style={{
            flex: 1,
            padding: '10px 14px',
            borderRadius: '10px',
            border: `2px solid ${isValid ? teamColor : '#E8E4D8'}`,
            fontSize: '16px',
            fontFamily: 'Inter, sans-serif',
            fontWeight: '600',
            textTransform: 'uppercase',
            outline: 'none',
            backgroundColor: 'white',
            color: '#2B2D42',
            transition: 'border-color 0.15s',
          }}
        />
        <select
          value={number}
          onChange={e => setNumber(Number(e.target.value))}
          style={{
            padding: '10px 8px',
            borderRadius: '10px',
            border: `2px solid ${teamColor}`,
            fontSize: '16px',
            fontFamily: 'Inter, sans-serif',
            fontWeight: '700',
            backgroundColor: 'white',
            color: '#2B2D42',
            outline: 'none',
            cursor: 'pointer',
            minWidth: '56px',
          }}
        >
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => (
            <option key={n} value={n}>{n}</option>
          ))}
          <option value={0}>∞</option>
        </select>
        <button
          type="submit"
          disabled={!isValid}
          style={{
            padding: '10px 18px',
            borderRadius: '10px',
            border: 'none',
            backgroundColor: isValid ? teamColor : '#C8C4B8',
            color: 'white',
            fontSize: '14px',
            fontWeight: '700',
            fontFamily: 'Inter, sans-serif',
            cursor: isValid ? 'pointer' : 'not-allowed',
            transition: 'background-color 0.15s',
            whiteSpace: 'nowrap',
          }}
        >
          Give Clue
        </button>
      </form>
    </div>
  );
}
