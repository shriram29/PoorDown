import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import IdentityModal from '../components/ui/IdentityModal';

const GAMES = [
  {
    id: 'monopoly',
    name: 'Monopoly',
    icon: '🏠',
    description: 'Buy properties, collect rent, and bankrupt your friends.',
    color: '#2D6A4F',
    available: true,
  },
  {
    id: 'ludo',
    name: 'Ludo',
    icon: '🎲',
    description: 'Race your tokens home before your opponents.',
    color: '#E63946',
    available: false,
  },
  {
    id: 'fifty-second-test',
    name: 'The 50 Second Test',
    icon: '🃏',
    description: "Roll a die. Draw from a 52-card deck. That's it.",
    color: '#1D3557',
    available: true,
  },
];

const TOKEN_ICONS = {
  hat: '🎩', car: '🚗', dog: '🐶', iron: '🧲',
  ship: '🚢', boot: '👟', thimble: '🪡', wheelbarrow: '🛒',
};

export default function Home() {
  const router = useRouter();
  const [identity, setIdentity] = useState(null);
  const [showIdentityModal, setShowIdentityModal] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = localStorage.getItem('poordown_identity');
    if (stored) {
      try {
        setIdentity(JSON.parse(stored));
      } catch {
        setShowIdentityModal(true);
      }
    } else {
      setShowIdentityModal(true);
    }
  }, []);

  const handleIdentityComplete = (newIdentity) => {
    setIdentity(newIdentity);
    setShowIdentityModal(false);
  };

  return (
    <>
      <Head>
        <title>PoorDown - Online Board Games</title>
        <meta name="description" content="Play Monopoly, Ludo and more with friends online. Free, no account needed." />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <IdentityModal isOpen={showIdentityModal} onComplete={handleIdentityComplete} />

      <div
        style={{
          minHeight: '100vh',
          backgroundColor: '#F8F4E8',
          padding: '60px 20px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{ textAlign: 'center', marginBottom: '16px' }}
        >
          <h1
            style={{
              fontFamily: 'Nunito, sans-serif',
              fontSize: '64px',
              fontWeight: '800',
              color: '#2B2D42',
              margin: '0 0 12px 0',
              letterSpacing: '-2px',
            }}
          >
            Poor<span style={{ color: '#E63946' }}>Down</span>
          </h1>
          <p
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '18px',
              color: '#8D99AE',
              margin: 0,
            }}
          >
            Pick a game and play with friends — no account needed.
          </p>
        </motion.div>

        {/* Identity chip */}
        {identity && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25, duration: 0.4 }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              marginTop: '16px',
              backgroundColor: 'white',
              borderRadius: '100px',
              padding: '6px 14px 6px 10px',
              boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
            }}
          >
            {identity.token && (
              <span style={{ fontSize: '16px', lineHeight: 1 }}>
                {TOKEN_ICONS[identity.token] ?? '🎩'}
              </span>
            )}
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#8D99AE' }}>
              Playing as
            </span>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: '600', color: '#2B2D42' }}>
              {identity.name}
            </span>
            <button
              onClick={() => setShowIdentityModal(true)}
              title="Change name"
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '2px 4px',
                fontSize: '13px',
                color: '#8D99AE',
                lineHeight: 1,
                display: 'flex',
                alignItems: 'center',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#E63946')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#8D99AE')}
            >
              ✏️
            </button>
          </motion.div>
        )}

        {/* Game cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '24px',
            maxWidth: '820px',
            width: '100%',
            marginTop: '56px',
          }}
        >
          {GAMES.map((game, i) => (
            <motion.div
              key={game.id}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.1, duration: 0.45 }}
              onClick={() => game.available && router.push(`/${game.id}`)}
              whileHover={game.available ? { y: -4, boxShadow: '0 16px 48px rgba(0,0,0,0.13)' } : {}}
              whileTap={game.available ? { scale: 0.98 } : {}}
              style={{
                backgroundColor: 'white',
                borderRadius: '20px',
                padding: '36px 28px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
                cursor: game.available ? 'pointer' : 'default',
                opacity: game.available ? 1 : 0.6,
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {!game.available && (
                <div
                  style={{
                    position: 'absolute',
                    top: '16px',
                    right: '16px',
                    backgroundColor: '#8D99AE',
                    color: 'white',
                    fontSize: '10px',
                    fontWeight: '700',
                    fontFamily: 'Inter, sans-serif',
                    padding: '3px 10px',
                    borderRadius: '20px',
                    letterSpacing: '0.5px',
                    textTransform: 'uppercase',
                  }}
                >
                  Coming Soon
                </div>
              )}

              <div
                style={{
                  width: '52px',
                  height: '52px',
                  backgroundColor: game.color + '18',
                  borderRadius: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '26px',
                  marginBottom: '18px',
                }}
              >
                {game.icon}
              </div>

              <h2
                style={{
                  fontFamily: 'Nunito, sans-serif',
                  fontSize: '22px',
                  fontWeight: '700',
                  color: '#2B2D42',
                  margin: '0 0 8px 0',
                }}
              >
                {game.name}
              </h2>
              <p
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '14px',
                  color: '#8D99AE',
                  margin: '0 0 20px 0',
                  lineHeight: '1.6',
                }}
              >
                {game.description}
              </p>

              {game.available && (
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '9px 18px',
                    backgroundColor: game.color,
                    color: 'white',
                    borderRadius: '10px',
                    fontSize: '13px',
                    fontWeight: '600',
                    fontFamily: 'Inter, sans-serif',
                  }}
                >
                  Play Now →
                </div>
              )}
            </motion.div>
          ))}
        </div>

        <footer
          style={{
            marginTop: '80px',
            fontFamily: 'Inter, sans-serif',
            fontSize: '12px',
            color: '#8D99AE',
            textAlign: 'center',
          }}
        >
          Open Source • Built with Next.js • No servers, no accounts
        </footer>
      </div>
    </>
  );
}
