// Create Room component
import { useState } from 'react';
import { useRouter } from 'next/router';
import { nanoid } from 'nanoid';

export default function CreateRoom() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    setLoading(true);
    
    // Generate room code
    const roomCode = nanoid(6).toUpperCase();
    
    // Store player name in localStorage
    localStorage.setItem('richdown_playerName', name.trim());
    localStorage.setItem('richdown_isHost', 'true');
    
    // Navigate to room
    router.push(`/room/${roomCode}?name=${encodeURIComponent(name.trim())}&host=true`);
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
            transition: 'border-color 0.2s',
          }}
          onFocus={(e) => e.target.style.borderColor = '#2D6A4F'}
          onBlur={(e) => e.target.style.borderColor = '#E8E4D8'}
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