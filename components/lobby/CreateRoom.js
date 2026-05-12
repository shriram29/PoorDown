import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { generateRoomCode } from '../../lib/roomCode';

export default function CreateRoom({ defaultName = '' }) {
  const router = useRouter();
  const [name, setName] = useState(defaultName);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setName(defaultName);
  }, [defaultName]);

  const handleCreate = async (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;

    setLoading(true);

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

    const roomCode = generateRoomCode();
    localStorage.setItem('poordown_active_room', JSON.stringify({
      gameId: 'monopoly', gameName: 'Monopoly', roomCode, isHost: true,
    }));
    router.push(`/monopoly/room/${roomCode}?host=true`);
  };

  const active = !!name.trim() && !loading;

  return (
    <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
          style={{
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
          }}
          onFocus={(e) => (e.target.style.borderColor = '#4a4aff')}
          onBlur={(e) => (e.target.style.borderColor = 'rgba(139,128,252,0.2)')}
        />
      </div>

      <button
        type="submit"
        disabled={!active}
        style={{
          padding: '14px 24px',
          backgroundColor: active ? '#4a4aff' : 'rgba(139,128,252,0.15)',
          color: active ? 'white' : 'rgba(139,128,252,0.4)',
          border: 'none',
          borderRadius: '12px',
          fontSize: '16px',
          fontWeight: '600',
          fontFamily: 'Inter, sans-serif',
          cursor: active ? 'pointer' : 'not-allowed',
          transition: 'background-color 0.2s',
          boxShadow: active ? '0 4px 16px rgba(74,74,255,0.4)' : 'none',
        }}
        onMouseEnter={(e) => {
          if (active) e.target.style.backgroundColor = '#3a3aef';
        }}
        onMouseLeave={(e) => {
          e.target.style.backgroundColor = active ? '#4a4aff' : 'rgba(139,128,252,0.15)';
        }}
      >
        {loading ? 'Creating...' : '🎮 Create Room'}
      </button>
    </form>
  );
}
