import { useState, useEffect } from 'react';
import Head from 'next/head';
import { motion } from 'framer-motion';
import CreateRoom from '../components/lobby/CreateRoom';
import JoinRoom from '../components/lobby/JoinRoom';
import IdentityModal from '../components/ui/IdentityModal';
import HowToPlayModal from '../components/ui/HowToPlayModal';

export default function Home() {
  const [identity, setIdentity] = useState(null);
  const [showIdentityModal, setShowIdentityModal] = useState(false);
  const [showHowToPlay, setShowHowToPlay] = useState(false);

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
        <title>PoorDown - Online Monopoly Clone</title>
        <meta name="description" content="The board game you know, anywhere you are. Play multiplayer Monopoly online with friends." />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <IdentityModal isOpen={showIdentityModal} onComplete={handleIdentityComplete} />
      <HowToPlayModal isOpen={showHowToPlay} onClose={() => setShowHowToPlay(false)} />

      <div
        style={{
          minHeight: '100vh',
          backgroundColor: '#F8F4E8',
          padding: '40px 20px',
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            style={{
              fontFamily: 'Playfair Display, serif',
              fontSize: '64px',
              fontWeight: '800',
              color: '#2B2D42',
              margin: '0 0 16px 0',
              letterSpacing: '-2px',
            }}
          >
            Poor<span style={{ color: '#E63946' }}>Down</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '20px',
              color: '#8D99AE',
              margin: 0,
            }}
          >
            The board game you know, anywhere you are.
          </motion.p>

          {identity && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.4 }}
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
                  {(['hat','car','dog','iron','ship','boot','thimble','wheelbarrow'].includes(identity.token)
                    ? { hat: '🎩', car: '🚗', dog: '🐶', iron: '🧲', ship: '🚢', boot: '👟', thimble: '🪡', wheelbarrow: '🛒' }[identity.token]
                    : '🎩')}
                </span>
              )}
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#8D99AE' }}>Playing as</span>
              <span
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#2B2D42',
                }}
              >
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
                  transition: 'color 0.2s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#E63946')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#8D99AE')}
              >
                ✏️
              </button>
            </motion.div>
          )}
        </div>

        {/* Main content */}
        <div
          style={{
            maxWidth: '900px',
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '40px',
          }}
        >
          {/* Create Room */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            style={{
              backgroundColor: 'white',
              borderRadius: '24px',
              padding: '32px',
              boxShadow: '0 8px 40px rgba(0,0,0,0.08)',
            }}
          >
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <span style={{ fontSize: '48px' }}>🎮</span>
              <h2
                style={{
                  fontFamily: 'Playfair Display, serif',
                  fontSize: '28px',
                  fontWeight: '700',
                  color: '#2B2D42',
                  margin: '16px 0 8px 0',
                }}
              >
                Create a Room
              </h2>
              <p
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '14px',
                  color: '#8D99AE',
                  margin: 0,
                }}
              >
                Start a new game and invite your friends
              </p>
            </div>
            <CreateRoom defaultName={identity?.name ?? ''} />
          </motion.div>

          {/* Join Room */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            style={{
              backgroundColor: 'white',
              borderRadius: '24px',
              padding: '32px',
              boxShadow: '0 8px 40px rgba(0,0,0,0.08)',
            }}
          >
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <span style={{ fontSize: '48px' }}>🚀</span>
              <h2
                style={{
                  fontFamily: 'Playfair Display, serif',
                  fontSize: '28px',
                  fontWeight: '700',
                  color: '#2B2D42',
                  margin: '16px 0 8px 0',
                }}
              >
                Join a Room
              </h2>
              <p
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '14px',
                  color: '#8D99AE',
                  margin: 0,
                }}
              >
                Enter a room code to join an existing game
              </p>
            </div>
            <JoinRoom defaultName={identity?.name ?? ''} />
          </motion.div>
        </div>

        {/* How to Play */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          style={{
            maxWidth: '600px',
            margin: '60px auto 0',
            backgroundColor: 'white',
            borderRadius: '20px',
            padding: '24px 32px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
          }}
        >
          <h3
            style={{
              fontFamily: 'Playfair Display, serif',
              fontSize: '22px',
              fontWeight: '700',
              color: '#2B2D42',
              margin: '0 0 16px 0',
              textAlign: 'center',
            }}
          >
            📖 How to Play
          </h3>
          <p
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '14px',
              color: '#8D99AE',
              margin: '0 0 20px 0',
              textAlign: 'center',
              lineHeight: '1.6',
            }}
          >
            Roll dice, buy properties, build houses, and bankrupt your friends. Classic Monopoly rules.
          </p>
          <div style={{ textAlign: 'center' }}>
            <button
              onClick={() => setShowHowToPlay(true)}
              style={{
                padding: '12px 28px',
                backgroundColor: '#1D3557',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                fontSize: '15px',
                fontWeight: '600',
                fontFamily: 'Inter, sans-serif',
                cursor: 'pointer',
                transition: 'background-color 0.2s, transform 0.1s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#162840')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#1D3557')}
              onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.97)')}
              onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            >
              Read Full Rules
            </button>
          </div>
        </motion.div>

        {/* Footer */}
        <footer
          style={{
            textAlign: 'center',
            marginTop: '60px',
            fontFamily: 'Inter, sans-serif',
            fontSize: '12px',
            color: '#8D99AE',
          }}
        >
          <p style={{ margin: '0 0 8px 0' }}>
            Open Source Monopoly Clone • Built with Next.js
          </p>
          <p style={{ margin: 0 }}>
            MIT License •{' '}
            <a href="https://github.com" style={{ color: '#1D3557' }}>
              View on GitHub
            </a>
          </p>
        </footer>
      </div>
    </>
  );
}
