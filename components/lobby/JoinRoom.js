import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';

export default function JoinRoom({ defaultName = '' }) {
  const router = useRouter();
  const [name, setName] = useState(defaultName);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setName(defaultName);
  }, [defaultName]);

  const handleJoin = async (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || code.length !== 6) return;

    setLoading(true);
    setError('');

    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('poordown_identity');
      if (stored) {
        try {
          const identity = JSON.parse(stored);
          if (identity.name !== trimmed) {
            localStorage.setItem('poordown_identity', JSON.stringify({ ...identity, name: trimmed }));
          }
        } catch {
          // identity was malformed; leave it alone
        }
      }
    }

    const roomCode = code.toUpperCase().trim();
    localStorage.setItem('poordown_active_room', JSON.stringify({
      gameId: 'monopoly', gameName: 'Monopoly', roomCode, isHost: false,
    }));
    router.push(`/monopoly/room/${roomCode}`);
  };

  const active = !!name.trim() && code.length === 6 && !loading;

  const inputStyle = {
    width: '100%',
    padding: '12px 16px',
    borderRadius: '12px',
    border: '2px solid rgba(139,128,252,0.2)',
    fontSize: '16px',
    fontFamily: 'Inter, sans-serif',
    backgroundColor: '#16162a',
    color: '#ffffff',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s',
  };

  return (
    <form onSubmit={handleJoin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div>
        <label
          style={{
            display: 'block',
            marginBottom: '8px',
            fontFamily: 'Inter, sans-serif',
            fontWeight: '600',
            fontSize: '14px',
            color: '#8c80fc',
          }}
        >
          Your Name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter your name"
          maxLength={20}
          style={inputStyle}
          onFocus={(e) => (e.target.style.borderColor = '#03deca')}
          onBlur={(e) => (e.target.style.borderColor = 'rgba(139,128,252,0.2)')}
        />
      </div>

      <div>
        <label
          style={{
            display: 'block',
            marginBottom: '8px',
            fontFamily: 'Inter, sans-serif',
            fontWeight: '600',
            fontSize: '14px',
            color: '#8c80fc',
          }}
        >
          Room Code
        </label>
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
          placeholder="Enter 6-char code"
          maxLength={6}
          style={{
            ...inputStyle,
            fontSize: '20px',
            fontFamily: 'JetBrains Mono, monospace',
            textAlign: 'center',
            letterSpacing: '4px',
          }}
          onFocus={(e) => (e.target.style.borderColor = '#03deca')}
          onBlur={(e) => (e.target.style.borderColor = 'rgba(139,128,252,0.2)')}
        />
      </div>

      {error && (
        <p style={{ color: '#ff4d56', fontFamily: 'Inter, sans-serif', fontSize: '14px', margin: 0 }}>
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={!active}
        style={{
          padding: '14px 24px',
          backgroundColor: active ? '#03deca' : 'rgba(139,128,252,0.15)',
          color: active ? '#0d0d1a' : 'rgba(139,128,252,0.4)',
          border: 'none',
          borderRadius: '12px',
          fontSize: '16px',
          fontWeight: '700',
          fontFamily: 'Inter, sans-serif',
          cursor: active ? 'pointer' : 'not-allowed',
          transition: 'background-color 0.2s',
          boxShadow: active ? '0 4px 16px rgba(3,222,202,0.35)' : 'none',
        }}
        onMouseEnter={(e) => {
          if (active) e.target.style.backgroundColor = '#02c4b4';
        }}
        onMouseLeave={(e) => {
          e.target.style.backgroundColor = active ? '#03deca' : 'rgba(139,128,252,0.15)';
        }}
      >
        {loading ? 'Joining...' : '🚀 Join Room'}
      </button>
    </form>
  );
}
