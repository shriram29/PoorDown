import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import CreateRoom from '../../components/lobby/CreateRoom';
import JoinRoom from '../../components/lobby/JoinRoom';

export default function MonopolyLobby() {
  const router = useRouter();
  const [identityName, setIdentityName] = useState('');
  const [activeRoom, setActiveRoom] = useState(null);

  useEffect(() => {
    try {
      const identity = localStorage.getItem('poordown_identity');
      if (identity) setIdentityName(JSON.parse(identity).name || '');
      const room = localStorage.getItem('poordown_active_room');
      if (room) {
        const parsed = JSON.parse(room);
        if (parsed.gameId === 'monopoly') setActiveRoom(parsed);
      }
    } catch {
      // ignore
    }
  }, []);

  return (
    <>
      <Head>
        <title>Monopoly - PoorDown</title>
        <meta name="description" content="Play Monopoly online with friends. Create or join a room." />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="icon" type="image/png" href="/favicon.png" />
      </Head>

      <div
        style={{
          minHeight: '100vh',
          backgroundColor: '#0d0d1a',
          padding: '40px 20px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Ambient glows */}
        <div style={{ position: 'absolute', top: '-100px', left: '-80px', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(74,74,255,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-60px', right: '-60px', width: '320px', height: '320px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(3,222,202,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />

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
              marginBottom: '24px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#ffffff')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#8c80fc')}
          >
            ← All Games
          </button>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', marginBottom: '12px' }}>
            <img src="/assets/coin.svg" alt="" aria-hidden="true" style={{ width: 48, filter: 'drop-shadow(0 0 12px rgba(74,74,255,0.6))' }} />
            <motion.h1
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              style={{
                fontFamily: 'Nunito, sans-serif',
                fontSize: '56px',
                fontWeight: '800',
                color: '#ffffff',
                margin: 0,
                letterSpacing: '-1.5px',
              }}
            >
              Mono<span style={{ color: '#4a4aff' }}>poly</span>
            </motion.h1>
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '18px',
              color: '#8c80fc',
              margin: 0,
            }}
          >
            Buy, trade, and bankrupt your friends.
          </motion.p>
        </div>

        {activeRoom && (
          <div
            style={{
              maxWidth: '900px',
              margin: '0 auto 28px',
              backgroundColor: '#1e1e38',
              borderRadius: '16px',
              border: '1px solid rgba(74,74,255,0.4)',
              padding: '16px 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              boxShadow: '0 4px 20px rgba(74,74,255,0.15)',
              position: 'relative',
              zIndex: 1,
            }}
          >
            <div>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', fontWeight: '700', color: '#4a4aff', letterSpacing: '1px', textTransform: 'uppercase', margin: '0 0 3px 0' }}>
                Active Game
              </p>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#ffffff', margin: 0 }}>
                Room{' '}
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: '700', letterSpacing: '2px' }}>
                  {activeRoom.roomCode}
                </span>
                {activeRoom.isHost && (
                  <span style={{ color: '#8c80fc', fontSize: '12px', marginLeft: '6px' }}>· Host</span>
                )}
              </p>
            </div>
            <button
              onClick={() => router.push(`/monopoly/room/${activeRoom.roomCode}${activeRoom.isHost ? '?host=true' : ''}`)}
              style={{
                padding: '8px 18px',
                backgroundColor: '#4a4aff',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                fontFamily: 'Inter, sans-serif',
                fontSize: '13px',
                fontWeight: '700',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                boxShadow: '0 4px 12px rgba(74,74,255,0.4)',
              }}
            >
              Resume →
            </button>
          </div>
        )}

        <div
          style={{
            maxWidth: '900px',
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '32px',
            position: 'relative',
            zIndex: 1,
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.45 }}
            style={{
              backgroundColor: '#1e1e38',
              borderRadius: '20px',
              padding: '32px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
              border: '1px solid rgba(139,128,252,0.15)',
            }}
          >
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <img src="/assets/arcade.svg" alt="" aria-hidden="true" style={{ width: 48, marginBottom: '12px' }} />
              <h2
                style={{
                  fontFamily: 'Nunito, sans-serif',
                  fontSize: '24px',
                  fontWeight: '700',
                  color: '#ffffff',
                  margin: '0 0 6px 0',
                }}
              >
                Create a Room
              </h2>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#8c80fc', margin: 0 }}>
                Start a new game and invite friends
              </p>
            </div>
            <CreateRoom defaultName={identityName} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.45 }}
            style={{
              backgroundColor: '#1e1e38',
              borderRadius: '20px',
              padding: '32px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
              border: '1px solid rgba(139,128,252,0.15)',
            }}
          >
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <img src="/assets/vr.svg" alt="" aria-hidden="true" style={{ width: 48, marginBottom: '12px' }} />
              <h2
                style={{
                  fontFamily: 'Nunito, sans-serif',
                  fontSize: '24px',
                  fontWeight: '700',
                  color: '#ffffff',
                  margin: '0 0 6px 0',
                }}
              >
                Join a Room
              </h2>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#8c80fc', margin: 0 }}>
                Enter a room code to join
              </p>
            </div>
            <JoinRoom defaultName={identityName} />
          </motion.div>
        </div>
      </div>
    </>
  );
}
