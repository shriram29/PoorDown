import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import { nanoid } from 'nanoid';

export default function CodenamesLobby() {
  const router = useRouter();
  const [tab, setTab] = useState('create');
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeRoom, setActiveRoom] = useState(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('poordown_active_room');
      if (stored) {
        const room = JSON.parse(stored);
        if (room.gameId === 'codenames') setActiveRoom(room);
      }
    } catch {}
  }, []);

  const handleCreate = (e) => {
    e.preventDefault();
    setLoading(true);
    const roomCode = nanoid(6).toUpperCase();
    localStorage.setItem('poordown_active_room', JSON.stringify({
      gameId: 'codenames', gameName: 'Codenames', roomCode, isHost: true,
    }));
    router.push(`/codenames/room/${roomCode}?host=true`);
  };

  const handleJoin = (e) => {
    e.preventDefault();
    if (joinCode.length !== 6) return;
    setLoading(true);
    const roomCode = joinCode.toUpperCase();
    localStorage.setItem('poordown_active_room', JSON.stringify({
      gameId: 'codenames', gameName: 'Codenames', roomCode, isHost: false,
    }));
    router.push(`/codenames/room/${roomCode}`);
  };

  const tabStyle = (active) => ({
    flex: 1,
    padding: '12px',
    border: 'none',
    borderBottom: active ? '3px solid #2B2D42' : '3px solid transparent',
    backgroundColor: 'transparent',
    fontFamily: 'Inter, sans-serif',
    fontWeight: active ? '700' : '500',
    fontSize: '15px',
    color: active ? '#2B2D42' : '#8D99AE',
    cursor: 'pointer',
    transition: 'color 0.15s, border-color 0.15s',
  });

  return (
    <>
      <Head>
        <title>Codenames — PoorDown</title>
        <meta name="description" content="Play Codenames online with friends. No account needed." />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div style={{ minHeight: '100vh', backgroundColor: '#F8F4E8', padding: '40px 20px' }}>
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
              fontFamily: 'Nunito, sans-serif',
              fontSize: '56px',
              fontWeight: '800',
              color: '#2B2D42',
              margin: '0 0 12px 0',
              letterSpacing: '-1.5px',
            }}
          >
            Code<span style={{ color: '#DC2626' }}>names</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '16px',
              color: '#8D99AE',
              margin: 0,
            }}
          >
            Two teams. 25 words. One wrong guess and it's over.
          </motion.p>
        </div>

        {activeRoom && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              maxWidth: '440px',
              margin: '0 auto 20px',
              backgroundColor: 'white',
              borderRadius: '16px',
              border: '2px solid #7C3AED',
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              boxShadow: '0 4px 20px rgba(124,58,237,0.1)',
            }}
          >
            <div>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', fontWeight: '700', color: '#7C3AED', letterSpacing: '1px', textTransform: 'uppercase', margin: '0 0 3px 0' }}>
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
              onClick={() => router.push(`/codenames/room/${activeRoom.roomCode}${activeRoom.isHost ? '?host=true' : ''}`)}
              style={{
                padding: '8px 18px',
                backgroundColor: '#7C3AED',
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
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.45 }}
          style={{
            maxWidth: '440px',
            margin: '0 auto',
            backgroundColor: 'white',
            borderRadius: '20px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
            overflow: 'hidden',
          }}
        >
          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid #E8E4D8' }}>
            <button style={tabStyle(tab === 'create')} onClick={() => setTab('create')}>
              Create Room
            </button>
            <button style={tabStyle(tab === 'join')} onClick={() => setTab('join')}>
              Join Room
            </button>
          </div>

          <div style={{ padding: '28px 28px 32px' }}>
            {tab === 'create' ? (
              <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#8D99AE', margin: 0, lineHeight: 1.6 }}>
                  Create a new room and share the code with your friends. You'll pick teams together before the game starts.
                </p>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    padding: '14px 24px',
                    backgroundColor: '#2B2D42',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '16px',
                    fontWeight: '600',
                    fontFamily: 'Inter, sans-serif',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s',
                  }}
                  onMouseEnter={e => (e.target.style.backgroundColor = '#1a1c2e')}
                  onMouseLeave={e => (e.target.style.backgroundColor = '#2B2D42')}
                >
                  {loading ? 'Creating...' : 'Create Room →'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleJoin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label
                    style={{
                      display: 'block',
                      marginBottom: '8px',
                      fontFamily: 'Inter, sans-serif',
                      fontWeight: '600',
                      color: '#2B2D42',
                      fontSize: '14px',
                    }}
                  >
                    Room Code
                  </label>
                  <input
                    type="text"
                    value={joinCode}
                    onChange={e => setJoinCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                    placeholder="XXXXXX"
                    maxLength={6}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '12px',
                      border: '2px solid #E8E4D8',
                      fontSize: '22px',
                      fontFamily: 'JetBrains Mono, monospace',
                      textAlign: 'center',
                      letterSpacing: '6px',
                      backgroundColor: 'white',
                      outline: 'none',
                      boxSizing: 'border-box',
                      transition: 'border-color 0.2s',
                    }}
                    onFocus={e => (e.target.style.borderColor = '#2B2D42')}
                    onBlur={e => (e.target.style.borderColor = '#E8E4D8')}
                  />
                </div>
                <button
                  type="submit"
                  disabled={joinCode.length !== 6 || loading}
                  style={{
                    padding: '14px 24px',
                    backgroundColor: joinCode.length === 6 ? '#2B2D42' : '#8D99AE',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '16px',
                    fontWeight: '600',
                    fontFamily: 'Inter, sans-serif',
                    cursor: joinCode.length === 6 ? 'pointer' : 'not-allowed',
                    transition: 'background-color 0.2s',
                  }}
                  onMouseEnter={e => { if (joinCode.length === 6) e.target.style.backgroundColor = '#1a1c2e'; }}
                  onMouseLeave={e => { e.target.style.backgroundColor = joinCode.length === 6 ? '#2B2D42' : '#8D99AE'; }}
                >
                  {loading ? 'Joining...' : 'Join Room →'}
                </button>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </>
  );
}
