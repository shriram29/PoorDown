import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import { generateRoomCode, sanitizeRoomInput } from '../../lib/roomCode';

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
    const roomCode = generateRoomCode();
    localStorage.setItem('poordown_active_room', JSON.stringify({
      gameId: 'codenames', gameName: 'Codenames', roomCode, isHost: true,
    }));
    router.push(`/codenames/room/${roomCode}?host=true`);
  };

  const handleJoin = (e) => {
    e.preventDefault();
    if (joinCode.length !== 4) return;
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
    borderBottom: active ? '3px solid #f143ae' : '3px solid transparent',
    backgroundColor: 'transparent',
    fontFamily: 'Inter, sans-serif',
    fontWeight: active ? '700' : '500',
    fontSize: '15px',
    color: active ? '#ffffff' : '#8c80fc',
    cursor: 'pointer',
    transition: 'color 0.15s, border-color 0.15s',
  });

  return (
    <>
      <Head>
        <title>Codenames — PoorDown</title>
        <meta name="description" content="Play Codenames online with friends. No account needed." />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="icon" type="image/png" href="/favicon.png" />
      </Head>

      <div style={{ minHeight: '100vh', backgroundColor: '#0d0d1a', padding: '40px 20px', position: 'relative', overflow: 'hidden' }}>
        {/* Ambient glows */}
        <div style={{ position: 'absolute', top: '-80px', right: '-80px', width: '360px', height: '360px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(241,67,174,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-60px', left: '-60px', width: '320px', height: '320px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,128,252,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />

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
            <img src="/assets/diamond.svg" alt="" aria-hidden="true" style={{ width: 48, filter: 'drop-shadow(0 0 12px rgba(241,67,174,0.6))' }} />
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
              Code<span style={{ color: '#f143ae' }}>names</span>
            </motion.h1>
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: '16px',
              color: '#8c80fc',
              margin: 0,
            }}
          >
            Two teams. 25 words. One wrong guess and it&apos;s over.
          </motion.p>
        </div>

        {activeRoom && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              maxWidth: '440px',
              margin: '0 auto 20px',
              backgroundColor: '#1e1e38',
              borderRadius: '16px',
              border: '1px solid rgba(241,67,174,0.4)',
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              boxShadow: '0 4px 20px rgba(241,67,174,0.12)',
              position: 'relative',
              zIndex: 1,
            }}
          >
            <div>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', fontWeight: '700', color: '#f143ae', letterSpacing: '1px', textTransform: 'uppercase', margin: '0 0 3px 0' }}>
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
              onClick={() => router.push(`/codenames/room/${activeRoom.roomCode}${activeRoom.isHost ? '?host=true' : ''}`)}
              style={{
                padding: '8px 18px',
                backgroundColor: '#f143ae',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                fontFamily: 'Inter, sans-serif',
                fontSize: '13px',
                fontWeight: '700',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                boxShadow: '0 4px 12px rgba(241,67,174,0.4)',
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
            backgroundColor: '#1e1e38',
            borderRadius: '20px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            border: '1px solid rgba(139,128,252,0.15)',
            overflow: 'hidden',
            position: 'relative',
            zIndex: 1,
          }}
        >
          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid rgba(139,128,252,0.15)' }}>
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
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: '#8c80fc', margin: 0, lineHeight: 1.6 }}>
                  Create a new room and share the code with your friends. You&apos;ll pick teams together before the game starts.
                </p>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    padding: '14px 24px',
                    backgroundColor: '#f143ae',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '16px',
                    fontWeight: '600',
                    fontFamily: 'Inter, sans-serif',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s',
                    boxShadow: '0 4px 16px rgba(241,67,174,0.4)',
                  }}
                  onMouseEnter={e => (e.target.style.backgroundColor = '#d8359a')}
                  onMouseLeave={e => (e.target.style.backgroundColor = '#f143ae')}
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
                      color: '#8c80fc',
                      fontSize: '14px',
                    }}
                  >
                    Room Code
                  </label>
                  <input
                    type="text"
                    value={joinCode}
                    onChange={e => setJoinCode(sanitizeRoomInput(e.target.value))}
                    placeholder="XXXX"
                    maxLength={4}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '12px',
                      border: '2px solid rgba(139,128,252,0.2)',
                      fontSize: '22px',
                      fontFamily: 'JetBrains Mono, monospace',
                      textAlign: 'center',
                      letterSpacing: '6px',
                      backgroundColor: '#16162a',
                      color: '#ffffff',
                      outline: 'none',
                      boxSizing: 'border-box',
                      transition: 'border-color 0.2s',
                    }}
                    onFocus={e => (e.target.style.borderColor = '#f143ae')}
                    onBlur={e => (e.target.style.borderColor = 'rgba(139,128,252,0.2)')}
                  />
                </div>
                <button
                  type="submit"
                  disabled={joinCode.length !== 4 || loading}
                  style={{
                    padding: '14px 24px',
                    backgroundColor: joinCode.length === 4 ? '#f143ae' : 'rgba(139,128,252,0.15)',
                    color: joinCode.length === 4 ? 'white' : 'rgba(139,128,252,0.4)',
                    border: 'none',
                    borderRadius: '12px',
                    fontSize: '16px',
                    fontWeight: '600',
                    fontFamily: 'Inter, sans-serif',
                    cursor: joinCode.length === 4 ? 'pointer' : 'not-allowed',
                    transition: 'background-color 0.2s',
                    boxShadow: joinCode.length === 4 ? '0 4px 16px rgba(241,67,174,0.4)' : 'none',
                  }}
                  onMouseEnter={e => { if (joinCode.length === 4) e.target.style.backgroundColor = '#d8359a'; }}
                  onMouseLeave={e => { e.target.style.backgroundColor = joinCode.length === 4 ? '#f143ae' : 'rgba(139,128,252,0.15)'; }}
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
