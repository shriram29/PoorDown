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
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div
        style={{
          minHeight: '100vh',
          backgroundColor: '#F8F4E8',
          padding: '40px 20px',
        }}
      >
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
              marginBottom: '24px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            ← All Games
          </button>

          <motion.h1
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            style={{
              fontFamily: 'Playfair Display, serif',
              fontSize: '56px',
              fontWeight: '800',
              color: '#2B2D42',
              margin: '0 0 12px 0',
              letterSpacing: '-1.5px',
            }}
          >
            Poor<span style={{ color: '#E63946' }}>Down</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '18px',
              color: '#8D99AE',
              margin: 0,
            }}
          >
            Monopoly — buy, trade, and bankrupt your friends.
          </motion.p>
        </div>

        {activeRoom && (
          <div
            style={{
              maxWidth: '900px',
              margin: '0 auto 28px',
              backgroundColor: 'white',
              borderRadius: '16px',
              border: '2px solid #2D6A4F',
              padding: '16px 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              boxShadow: '0 4px 20px rgba(45,106,79,0.1)',
            }}
          >
            <div>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', fontWeight: '700', color: '#2D6A4F', letterSpacing: '1px', textTransform: 'uppercase', margin: '0 0 3px 0' }}>
                Active Game
              </p>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#2B2D42', margin: 0 }}>
                Room{' '}
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontWeight: '700', letterSpacing: '2px' }}>
                  {activeRoom.roomCode}
                </span>
                {activeRoom.isHost && (
                  <span style={{ color: '#8D99AE', fontSize: '12px', marginLeft: '6px' }}>· Host</span>
                )}
              </p>
            </div>
            <button
              onClick={() => router.push(`/monopoly/room/${activeRoom.roomCode}${activeRoom.isHost ? '?host=true' : ''}`)}
              style={{
                padding: '8px 18px',
                backgroundColor: '#2D6A4F',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                fontFamily: 'Inter, sans-serif',
                fontSize: '13px',
                fontWeight: '700',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
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
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.45 }}
            style={{
              backgroundColor: 'white',
              borderRadius: '20px',
              padding: '32px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
            }}
          >
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <span style={{ fontSize: '40px' }}>🎮</span>
              <h2
                style={{
                  fontFamily: 'Playfair Display, serif',
                  fontSize: '24px',
                  fontWeight: '700',
                  color: '#2B2D42',
                  margin: '14px 0 6px 0',
                }}
              >
                Create a Room
              </h2>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#8D99AE', margin: 0 }}>
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
              backgroundColor: 'white',
              borderRadius: '20px',
              padding: '32px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
            }}
          >
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <span style={{ fontSize: '40px' }}>🚀</span>
              <h2
                style={{
                  fontFamily: 'Playfair Display, serif',
                  fontSize: '24px',
                  fontWeight: '700',
                  color: '#2B2D42',
                  margin: '14px 0 6px 0',
                }}
              >
                Join a Room
              </h2>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#8D99AE', margin: 0 }}>
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