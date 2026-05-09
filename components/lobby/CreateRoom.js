import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { nanoid } from 'nanoid';

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

    const roomCode = nanoid(6).toUpperCase();
    router.push(`/room/${roomCode}?host=true`);
  };

  return (
    <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div>
        <label
          style={{
            display: 'block',
            marginBottom: '8px',
            fontFamily: 'Inter, sans-serif',
            fontWeight: '600',
            color: '#2B2D42',
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
            border: '2px solid #E8E4D8',
            fontSize: '16px',
            fontFamily: 'Inter, sans-serif',
            backgroundColor: 'white',
            outline: 'none',
            boxSizing: 'border-box',
            transition: 'border-color 0.2s',
          }}
          onFocus={(e) => (e.target.style.borderColor = '#2D6A4F')}
          onBlur={(e) => (e.target.style.borderColor = '#E8E4D8')}
        />
      </div>

      <button
        type="submit"
        disabled={!name.trim() || loading}
        style={{
          padding: '14px 24px',
          backgroundColor: name.trim() ? '#2D6A4F' : '#8D99AE',
          color: 'white',
          border: 'none',
          borderRadius: '12px',
          fontSize: '16px',
          fontWeight: '600',
          fontFamily: 'Inter, sans-serif',
          cursor: name.trim() ? 'pointer' : 'not-allowed',
          transition: 'background-color 0.2s',
        }}
        onMouseEnter={(e) => {
          if (name.trim()) e.target.style.backgroundColor = '#245A42';
        }}
        onMouseLeave={(e) => {
          e.target.style.backgroundColor = name.trim() ? '#2D6A4F' : '#8D99AE';
        }}
      >
        {loading ? 'Creating...' : '🎮 Create Room'}
      </button>
    </form>
  );
}
