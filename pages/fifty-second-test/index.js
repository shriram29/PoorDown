import Head from 'next/head';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { buildDeck } from '../../lib/games/fifty-second-test/cards';

const DIE_FACES = ['', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

export default function FiftySecondTest() {
  const router = useRouter();

  const [dieValue, setDieValue] = useState(null);
  const [deck, setDeck] = useState(() => buildDeck());
  const [drawnCard, setDrawnCard] = useState(null);

  const rollDie = () => {
    setDieValue(Math.floor(Math.random() * 6) + 1);
  };

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

  const deckEmpty = deck.length === 0;

  return (
    <>
      <Head>
        <title>The 50 Second Test - PoorDown</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div
        style={{
          minHeight: '100vh',
          backgroundColor: '#F8F4E8',
          padding: '40px 20px',
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <button
            onClick={() => router.push('/')}
            style={{
              background: 'none',
              border: 'none',
              fontFamily: 'Inter, sans-serif',
              fontSize: '14px',
              color: '#8D99AE',
              cursor: 'pointer',
              marginBottom: '16px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            ← All Games
          </button>
          <h1
            style={{
              fontFamily: 'Playfair Display, serif',
              fontSize: '40px',
              fontWeight: '800',
              color: '#2B2D42',
              margin: '0 0 8px 0',
              letterSpacing: '-1px',
            }}
          >
            The 50 Second Test
          </h1>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '15px', color: '#8D99AE', margin: 0 }}>
            Roll the die. Draw a card. Simple.
          </p>
        </div>

        {/* Two columns */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '32px',
            maxWidth: '800px',
            margin: '0 auto',
          }}
        >
          {/* ── LEFT: Die ── */}
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '20px',
              padding: '40px 32px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '24px',
            }}
          >
            <h2
              style={{
                fontFamily: 'Playfair Display, serif',
                fontSize: '22px',
                fontWeight: '700',
                color: '#2B2D42',
                margin: 0,
              }}
            >
              Die
            </h2>

            {/* Die face display */}
            <div
              style={{
                width: '120px',
                height: '120px',
                backgroundColor: dieValue ? '#2B2D42' : '#E8E4D8',
                borderRadius: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: dieValue ? '0 8px 24px rgba(43,45,66,0.3)' : 'none',
              }}
            >
              {dieValue ? (
                <span style={{ fontSize: '72px', lineHeight: 1 }}>{DIE_FACES[dieValue]}</span>
              ) : (
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#8D99AE' }}>
                  Roll it
                </span>
              )}
            </div>

            {dieValue && (
              <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '18px', color: '#2B2D42', margin: 0, fontWeight: '700' }}>
                You rolled a {dieValue}
              </p>
            )}

            <button
              onClick={rollDie}
              style={{
                padding: '14px 36px',
                backgroundColor: '#2B2D42',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '16px',
                fontWeight: '600',
                fontFamily: 'Inter, sans-serif',
                cursor: 'pointer',
              }}
            >
              Roll Die
            </button>
          </div>

          {/* ── RIGHT: Cards ── */}
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: '20px',
              padding: '40px 32px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '24px',
            }}
          >
            <h2
              style={{
                fontFamily: 'Playfair Display, serif',
                fontSize: '22px',
                fontWeight: '700',
                color: '#2B2D42',
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
                backgroundColor: drawnCard ? 'white' : '#E8E4D8',
                border: drawnCard ? `3px solid ${drawnCard.suit.color}` : '3px solid #D0CCC0',
                borderRadius: '12px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: drawnCard ? '0 6px 20px rgba(0,0,0,0.15)' : 'none',
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
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#8D99AE' }}>
                  Draw one
                </span>
              )}
            </div>

            {/* Deck count */}
            <p
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '14px',
                color: deckEmpty ? '#E63946' : '#8D99AE',
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
                  backgroundColor: deckEmpty ? '#8D99AE' : '#E63946',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: '600',
                  fontFamily: 'Inter, sans-serif',
                  cursor: deckEmpty ? 'not-allowed' : 'pointer',
                }}
              >
                Draw Card
              </button>

              <button
                onClick={shuffle}
                style={{
                  padding: '12px 24px',
                  backgroundColor: 'white',
                  color: '#2B2D42',
                  border: '2px solid #E8E4D8',
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
