import { useEffect, useRef } from 'react';

export default function ActivityLog({ entries }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [entries.length]);

  if (!entries.length) return null;

  return (
    <div style={{
      maxWidth: '700px',
      width: '100%',
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '10px 14px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
      maxHeight: '110px',
      overflowY: 'auto',
    }}>
      <p style={{
        fontFamily: 'Inter, sans-serif',
        fontSize: '9px',
        fontWeight: '700',
        letterSpacing: '1px',
        textTransform: 'uppercase',
        color: '#C8C4B8',
        margin: '0 0 6px',
      }}>
        Game log
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
        {entries.map((entry) => (
          <p key={entry.id} style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '12px',
            color: '#2B2D42',
            margin: 0,
            lineHeight: 1.5,
          }}>
            {entry.msg}
          </p>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
