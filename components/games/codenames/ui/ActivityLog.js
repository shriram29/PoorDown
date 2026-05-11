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
      backgroundColor: '#161B22',
      border: '1px solid #21262D',
      borderRadius: '10px',
      padding: '10px 14px',
      maxHeight: '108px',
      overflowY: 'auto',
    }}>
      <p style={{
        fontFamily: 'Inter, sans-serif',
        fontSize: '9px',
        fontWeight: '700',
        letterSpacing: '1px',
        textTransform: 'uppercase',
        color: '#484F58',
        margin: '0 0 6px',
      }}>
        Game log
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
        {entries.map((entry) => (
          <p key={entry.id} style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '12px',
            color: '#8B949E',
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
