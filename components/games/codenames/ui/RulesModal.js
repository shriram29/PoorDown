import { useState } from 'react';

const RULES = [
  {
    q: 'Objective',
    a: 'Two teams — Red and Blue — compete to be the first to identify all of their agents on the 5×5 word grid.',
  },
  {
    q: 'Roles',
    a: 'Each team has one Spymaster and at least one Operative. Spymasters can see all card colors; Operatives cannot.',
  },
  {
    q: 'Giving a clue',
    a: 'The Spymaster gives a one-word clue followed by a number — e.g. "Animal, 3". The number is how many cards on the board relate to that clue. ∞ means unlimited guesses.',
  },
  {
    q: 'Guessing',
    a: 'Operatives discuss and select cards one at a time. You get the number of guesses from the clue, plus one bonus guess. You may stop early by passing.',
  },
  {
    q: 'What each color means',
    a: 'Your team\'s color = a point. Opponent\'s color = their point, turn ends. Neutral (tan) = no point, turn ends. Black (Assassin) = instant loss for your team.',
  },
  {
    q: 'Winning',
    a: 'The first team to reveal all of their agents wins. If any team reveals the Assassin card, they lose immediately.',
  },
  {
    q: 'Grid veto',
    a: 'Before the game starts, each team can request a new grid once. If both teams veto their respective grids, the final generated grid is used with no further changes.',
  },
  {
    q: 'Rematch',
    a: 'After the game, teams can vote for a rematch. When at least 2 players from each team vote yes, a rematch begins — same teams, but spymasters rotate to a different player.',
  },
];

export default function RulesModal() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="Rules & FAQ"
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          width: '44px',
          height: '44px',
          borderRadius: '50%',
          backgroundColor: '#7C3AED',
          color: 'white',
          border: 'none',
          fontSize: '18px',
          fontWeight: '700',
          cursor: 'pointer',
          boxShadow: '0 4px 16px rgba(124,58,237,0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50,
          transition: 'transform 0.15s, box-shadow 0.15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.1)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(124,58,237,0.5)'; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)';   e.currentTarget.style.boxShadow = '0 4px 16px rgba(124,58,237,0.4)'; }}
      >
        ?
      </button>

      {open && (
        <div
          onClick={e => { if (e.target === e.currentTarget) setOpen(false); }}
          style={{
            position: 'fixed', inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '20px', zIndex: 200,
          }}
        >
          <div style={{
            backgroundColor: 'white',
            borderRadius: '20px',
            padding: '32px',
            maxWidth: '540px',
            width: '100%',
            maxHeight: '80vh',
            overflowY: 'auto',
            boxShadow: '0 24px 80px rgba(0,0,0,0.3)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontFamily: 'Nunito, sans-serif', fontSize: '24px', fontWeight: '800', color: '#2B2D42', margin: 0 }}>
                How to Play
              </h2>
              <button
                onClick={() => setOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: '20px', color: '#8D99AE', cursor: 'pointer', lineHeight: 1, padding: '4px' }}
              >
                ×
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {RULES.map(({ q, a }) => (
                <div key={q}>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.8px', color: '#7C3AED', margin: '0 0 4px' }}>
                    {q}
                  </p>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#2B2D42', margin: 0, lineHeight: 1.6 }}>
                    {a}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
