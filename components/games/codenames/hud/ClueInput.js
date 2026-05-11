import { useState } from 'react';

export default function ClueInput({ currentTeam, onSubmit }) {
  const [word, setWord]     = useState('');
  const [number, setNumber] = useState(2);

  const teamVivid = currentTeam === 'red' ? '#F87171' : '#60A5FA';
  const teamDim   = currentTeam === 'red' ? '#2D1212' : '#0D1929';
  const teamBorder= currentTeam === 'red' ? '#7F1D1D' : '#1E3A5F';

  const isValid = word.trim().length > 0 && !word.includes(' ');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isValid) return;
    onSubmit(word.trim().toUpperCase(), number);
    setWord('');
    setNumber(2);
  };

  return (
    <div style={{
      backgroundColor: teamDim,
      border: `2px solid ${teamBorder}`,
      borderRadius: '14px',
      padding: '16px 20px',
      maxWidth: '560px',
      width: '100%',
    }}>
      <p style={{
        fontFamily: 'Inter, sans-serif',
        fontSize: '10px',
        fontWeight: '700',
        color: teamVivid,
        letterSpacing: '1px',
        textTransform: 'uppercase',
        margin: '0 0 10px',
        opacity: 0.8,
      }}>
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
            borderRadius: '8px',
            border: `2px solid ${isValid ? teamVivid : '#30363D'}`,
            fontSize: '16px',
            fontFamily: 'Inter, sans-serif',
            fontWeight: '700',
            textTransform: 'uppercase',
            outline: 'none',
            backgroundColor: '#0D1117',
            color: '#E6EDF3',
            transition: 'border-color 0.15s',
            letterSpacing: '1px',
          }}
        />
        <select
          value={number}
          onChange={e => setNumber(Number(e.target.value))}
          style={{
            padding: '10px 8px',
            borderRadius: '8px',
            border: `2px solid ${teamBorder}`,
            fontSize: '16px',
            fontFamily: 'Inter, sans-serif',
            fontWeight: '700',
            backgroundColor: '#0D1117',
            color: '#E6EDF3',
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
            borderRadius: '8px',
            border: 'none',
            backgroundColor: isValid ? teamVivid : '#30363D',
            color: isValid ? '#0D1117' : '#484F58',
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
