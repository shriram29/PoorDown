import Head from 'next/head';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { buildDeck } from '../../lib/games/fifty-second-test/cards';

const DOT_POSITIONS = {
  1: [[1, 1]],
  2: [[0, 2], [2, 0]],
  3: [[0, 2], [1, 1], [2, 0]],
  4: [[0, 0], [0, 2], [2, 0], [2, 2]],
  5: [[0, 0], [0, 2], [1, 1], [2, 0], [2, 2]],
  6: [[0, 0], [0, 2], [1, 0], [1, 2], [2, 0], [2, 2]],
};

function DieFace({ value, size = 120 }) {
  const dotSize = size * 0.14;
  const padding = size * 0.18;
  const inner = size - padding * 2;
  const step = inner / 2;

  const dots = value ? DOT_POSITIONS[value] : [];

  return (
    <div
      style={{
        width: size,
        height: size,
        backgroundColor: value ? '#16162a' : '#16162a',
        borderRadius: size * 0.17,
        position: 'relative',
        border: value ? '2px solid rgba(74,74,255,0.5)' : '2px solid rgba(139,128,252,0.2)',
        boxShadow: value ? '0 8px 24px rgba(74,74,255,0.25)' : 'none',
        flexShrink: 0,
      }}
    >
      {value ? dots.map(([row, col], i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            width: dotSize,
            height: dotSize,
            borderRadius: '50%',
            backgroundColor: '#03deca',
            top: padding + row * step - dotSize / 2,
            left: padding + col * step - dotSize / 2,
          }}
        />
      )) : (
        <span
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'Inter, sans-serif',
            fontSize: '14px',
            color: '#8c80fc',
          }}
        >
          Roll it
        </span>
      )}
    </div>
  );
}

function generateCode() {
  return Math.random().toString(36).slice(2, 7).toUpperCase();
}

export default function FiftySecondTest() {
  const router = useRouter();

  const [dieValue, setDieValue] = useState(null);
  const [deck, setDeck] = useState(() => buildDeck());
  const [drawnCard, setDrawnCard] = useState(null);

  const rollDie = () => setDieValue(Math.floor(Math.random() * 6) + 1);

  const drawCard = () => {
    if (deck.length === 0) return;
    const idx = Math.floor(Math.random() * deck.length);
    const card = deck[idx];
    setDeck(prev => prev.filter((_, i) => i !== idx));
    setDrawnCard(card);
  };

  const shuffle = () => {
    setDeck(buildDeck());
    setDrawnCard(null);
  };

  const createRoom = () => {
    const code = generateCode();
    router.push(`/fifty-second-test/room/${code}?host=true`);
  };

  const deckEmpty = deck.length === 0;

  return (
    <>
      <Head>
        <title>The 50 Second Test - PoorDown</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div style={{ minHeight: '100vh', backgroundColor: '#0d0d1a', padding: '40px 20px', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-80px', right: '-80px', width: '360px', height: '360px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(3,222,202,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '48px', position: 'relative', zIndex: 1 }}>
          <button
            onClick={() => router.push('/')}
            style={{
              background: 'none',
              border: 'none',
              fontFamily: 'Inter, sans-serif',
              fontSize: '14px',
              color: '#8c80fc',
              cursor: 'pointer',
              marginBottom: '16px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#ffffff')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#8c80fc')}
          >
            ← All Games
          </button>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', marginBottom: '8px' }}>
            <img src="/assets/cd.svg" alt="" aria-hidden="true" style={{ width: 44, filter: 'drop-shadow(0 0 10px rgba(3,222,202,0.6))' }} />
            <h1
              style={{
                fontFamily: 'Nunito, sans-serif',
                fontSize: '40px',
                fontWeight: '800',
                color: '#ffffff',
                margin: 0,
                letterSpacing: '-1px',
              }}
            >
              The <span style={{ color: '#03deca' }}>50 Second</span> Test
            </h1>
          </div>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '15px', color: '#8c80fc', margin: '0 0 24px 0' }}>
            Roll the die. Draw a card. Simple.
          </p>
          <button
            onClick={createRoom}
            style={{
              padding: '12px 28px',
              backgroundColor: '#03deca',
              color: '#0d0d1a',
              border: 'none',
              borderRadius: '12px',
              fontSize: '15px',
              fontWeight: '700',
              fontFamily: 'Inter, sans-serif',
              cursor: 'pointer',
              boxShadow: '0 4px 16px rgba(3,222,202,0.35)',
            }}
          >
            Create Room to Test Together →
          </button>
        </div>

        {/* Two columns */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '32px',
            maxWidth: '800px',
            margin: '0 auto',
            position: 'relative',
            zIndex: 1,
          }}
        >
          {/* ── LEFT: Die ── */}
          <div
            style={{
              backgroundColor: '#1e1e38',
              borderRadius: '20px',
              padding: '40px 32px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
              border: '1px solid rgba(139,128,252,0.15)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '24px',
            }}
          >
            <h2
              style={{
                fontFamily: 'Nunito, sans-serif',
                fontSize: '22px',
                fontWeight: '700',
                color: '#ffffff',
                margin: 0,
              }}
            >
              Die
            </h2>

            <DieFace value={dieValue} />

            {dieValue && (
              <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '18px', color: '#03deca', margin: 0, fontWeight: '700' }}>
                You rolled a {dieValue}
              </p>
            )}

            <button
              onClick={rollDie}
              style={{
                padding: '14px 36px',
                backgroundColor: '#4a4aff',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: '600',
                fontFamily: 'Inter, sans-serif',
                cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(74,74,255,0.4)',
              }}
            >
              Roll Die
            </button>
          </div>

          {/* ── RIGHT: Cards ── */}
          <div
            style={{
              backgroundColor: '#1e1e38',
              borderRadius: '20px',
              padding: '40px 32px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
              border: '1px solid rgba(139,128,252,0.15)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '24px',
            }}
          >
            <h2
              style={{
                fontFamily: 'Nunito, sans-serif',
                fontSize: '22px',
                fontWeight: '700',
                color: '#ffffff',
                margin: 0,
              }}
            >
              Cards
            </h2>

            {/* Card display */}
            <div
              style={{
                width: '100px',
                height: '140px',
                backgroundColor: drawnCard ? '#16162a' : '#16162a',
                border: drawnCard ? `3px solid ${drawnCard.suit.color}` : '3px solid rgba(139,128,252,0.2)',
                borderRadius: '12px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: drawnCard ? `0 6px 20px ${drawnCard.suit.color}44` : 'none',
                position: 'relative',
              }}
            >
              {drawnCard ? (
                <>
                  <span
                    style={{
                      position: 'absolute',
                      top: '8px',
                      left: '10px',
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: '16px',
                      fontWeight: '700',
                      color: drawnCard.suit.color,
                      lineHeight: 1,
                    }}
                  >
                    {drawnCard.value}
                  </span>
                  <span style={{ fontSize: '40px', lineHeight: 1 }}>{drawnCard.suit.symbol}</span>
                  <span
                    style={{
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: drawnCard.suit.color,
                    }}
                  >
                    {drawnCard.value}
                  </span>
                  <span
                    style={{
                      position: 'absolute',
                      bottom: '8px',
                      right: '10px',
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: '16px',
                      fontWeight: '700',
                      color: drawnCard.suit.color,
                      lineHeight: 1,
                      transform: 'rotate(180deg)',
                    }}
                  >
                    {drawnCard.value}
                  </span>
                </>
              ) : (
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#8c80fc' }}>
                  Draw one
                </span>
              )}
            </div>

            {/* Deck count */}
            <p
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '14px',
                color: deckEmpty ? '#ff4d56' : '#8c80fc',
                margin: 0,
                fontWeight: deckEmpty ? '600' : '400',
              }}
            >
              {deckEmpty ? 'Deck is empty' : `${deck.length} card${deck.length === 1 ? '' : 's'} remaining`}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
              <button
                onClick={drawCard}
                disabled={deckEmpty}
                style={{
                  padding: '14px 24px',
                  backgroundColor: deckEmpty ? 'rgba(139,128,252,0.15)' : '#03deca',
                  color: deckEmpty ? 'rgba(139,128,252,0.4)' : '#0d0d1a',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: '600',
                  fontFamily: 'Inter, sans-serif',
                  cursor: deckEmpty ? 'not-allowed' : 'pointer',
                  boxShadow: deckEmpty ? 'none' : '0 4px 16px rgba(3,222,202,0.35)',
                }}
              >
                Draw Card
              </button>

              <button
                onClick={shuffle}
                style={{
                  padding: '12px 24px',
                  backgroundColor: 'transparent',
                  color: '#8c80fc',
                  border: '2px solid rgba(139,128,252,0.25)',
                  borderRadius: '12px',
                  fontSize: '15px',
                  fontWeight: '600',
                  fontFamily: 'Inter, sans-serif',
                  cursor: 'pointer',
                }}
              >
                Shuffle / Reset
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
