import Head from 'next/head';
import { useRouter } from 'next/router';
import { useState, useEffect, useRef } from 'react';
import * as Y from 'yjs';
import { WebrtcProvider } from 'y-webrtc';
import { buildDeck } from '../../../lib/games/fifty-second-test/cards';

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
        backgroundColor: value ? '#2B2D42' : '#E8E4D8',
        borderRadius: size * 0.17,
        position: 'relative',
        boxShadow: value ? '0 8px 24px rgba(43,45,66,0.3)' : 'none',
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
            backgroundColor: 'white',
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
            color: '#8D99AE',
          }}
        >
          Roll it
        </span>
      )}
    </div>
  );
}

export default function FiftySecondTestRoom() {
  const router = useRouter();
  const { code } = router.query;

  const [dieValue, setDieValue] = useState(null);
  const [drawnCard, setDrawnCard] = useState(null);
  const [deckSize, setDeckSize] = useState(52);
  const [copied, setCopied] = useState(false);
  const [peers, setPeers] = useState(0);

  const metaRef = useRef(null);
  const providerRef = useRef(null);

  useEffect(() => {
    if (!code || typeof window === 'undefined') return;

    const doc = new Y.Doc();
    const signalingUrl = process.env.NEXT_PUBLIC_SIGNALING_URL || 'ws://localhost:4444';
    const provider = new WebrtcProvider(`poordown-fifty-second-test-${code}`, doc, {
      signaling: [signalingUrl],
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun.cloudflare.com:3478' },
      ],
      maxConns: 8,
    });
    providerRef.current = provider;

    provider.awareness.on('change', () => {
      setPeers(provider.awareness.getStates().size - 1);
    });

    const meta = doc.getMap('meta');
    metaRef.current = meta;

    const isHost = new URLSearchParams(window.location.search).get('host') === 'true';

    if (isHost) {
      doc.transact(() => {
        if (!meta.get('drawnIds')) {
          meta.set('drawnIds', JSON.stringify([]));
        }
      });
    }

    const sync = () => {
      const die = meta.get('dieValue');
      const cardStr = meta.get('drawnCard');
      const drawnIdsStr = meta.get('drawnIds');

      setDieValue(die ?? null);
      setDrawnCard(cardStr ? JSON.parse(cardStr) : null);

      const drawnIds = drawnIdsStr ? JSON.parse(drawnIdsStr) : [];
      setDeckSize(52 - drawnIds.length);
    };

    meta.observe(sync);
    sync();

    return () => {
      meta.unobserve(sync);
      provider.destroy();
      doc.destroy();
    };
  }, [code]);

  const rollDie = () => {
    const meta = metaRef.current;
    if (!meta) return;
    meta.set('dieValue', Math.floor(Math.random() * 6) + 1);
  };

  const drawCard = () => {
    const meta = metaRef.current;
    if (!meta) return;

    const drawnIdsStr = meta.get('drawnIds') || '[]';
    const drawnIds = JSON.parse(drawnIdsStr);
    const fullDeck = buildDeck();
    const remaining = fullDeck.filter(c => !drawnIds.includes(c.id));
    if (remaining.length === 0) return;

    const card = remaining[Math.floor(Math.random() * remaining.length)];
    meta.set('drawnCard', JSON.stringify(card));
    meta.set('drawnIds', JSON.stringify([...drawnIds, card.id]));
  };

  const shuffle = () => {
    const meta = metaRef.current;
    if (!meta) return;
    meta.set('drawnIds', JSON.stringify([]));
    meta.set('drawnCard', null);
  };

  const copyLink = () => {
    const url = `${window.location.origin}/fifty-second-test/room/${code}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const deckEmpty = deckSize === 0;

  return (
    <>
      <Head>
        <title>Room {code} — 50 Second Test</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div style={{ minHeight: '100vh', backgroundColor: '#F8F4E8', padding: '40px 20px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <button
            onClick={() => router.push('/fifty-second-test')}
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
            ← Solo Mode
          </button>
          <h1
            style={{
              fontFamily: 'Playfair Display, serif',
              fontSize: '36px',
              fontWeight: '800',
              color: '#2B2D42',
              margin: '0 0 8px 0',
              letterSpacing: '-1px',
            }}
          >
            The 50 Second Test
          </h1>

          {/* Room info bar */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '16px',
              backgroundColor: 'white',
              borderRadius: '14px',
              padding: '10px 20px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.07)',
              marginTop: '12px',
              flexWrap: 'wrap',
              justifyContent: 'center',
            }}
          >
            <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '15px', color: '#2B2D42', fontWeight: '700' }}>
              Room: {code}
            </span>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#8D99AE' }}>
              {peers === 0 ? 'No one else here yet' : `${peers} other${peers === 1 ? '' : 's'} connected`}
            </span>
            <button
              onClick={copyLink}
              style={{
                padding: '6px 14px',
                backgroundColor: copied ? '#457B9D' : '#2B2D42',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: '600',
                fontFamily: 'Inter, sans-serif',
                cursor: 'pointer',
                transition: 'background-color 0.15s',
              }}
            >
              {copied ? 'Copied!' : 'Copy Link'}
            </button>
          </div>
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

            <DieFace value={dieValue} />

            {dieValue && (
              <p style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '18px', color: '#2B2D42', margin: 0, fontWeight: '700' }}>
                Rolled a {dieValue}
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

            <p
              style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '14px',
                color: deckEmpty ? '#E63946' : '#8D99AE',
                margin: 0,
                fontWeight: deckEmpty ? '600' : '400',
              }}
            >
              {deckEmpty ? 'Deck is empty' : `${deckSize} card${deckSize === 1 ? '' : 's'} remaining`}
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
