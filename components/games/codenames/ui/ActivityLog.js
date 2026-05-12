import { useEffect, useRef } from 'react';

export default function ActivityLog({ entries }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [entries.length]);

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      padding: '10px 14px 12px',
    }}>
      <p style={{
        fontFamily: 'Inter, sans-serif',
        fontSize: '9px',
        fontWeight: '700',
        letterSpacing: '1px',
        textTransform: 'uppercase',
        color: '#484F58',
        margin: '0 0 8px',
        flexShrink: 0,
      }}>
        Game log
      </p>
      <div style={{
        flex: 1,
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
      }}>
        {entries.length === 0 && (
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#484F58', fontStyle: 'italic', margin: 0 }}>
            No events yet
          </p>
        )}
        {entries.map((entry) => (
          <p key={entry.id} style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: '11px',
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
