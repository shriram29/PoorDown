import { useState, useEffect } from 'react';

function useIsMobile() {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const check = () => setMobile(window.innerWidth < 640);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return mobile;
}

export default function GameHeader({
  onLeave, icon, name, roundLabel, code, copied, onCopy,
  peers, panelDark, panelBorder, text, textDim, gameColor, gold, surface,
}) {
  const isMobile = useIsMobile();

  return (
    <div style={{
      position: 'relative', display: 'flex', alignItems: 'center',
      height: 48, paddingLeft: 16, paddingRight: 12,
      borderBottom: `1px solid ${panelBorder}`,
      flexShrink: 0, backgroundColor: panelDark,
    }}>
      <button
        onClick={onLeave}
        style={{
          background: 'none', border: 'none', color: textDim, cursor: 'pointer',
          fontFamily: 'Inter, sans-serif', fontSize: 13, padding: 0,
          display: 'flex', alignItems: 'center', gap: 4, zIndex: 1, flexShrink: 0,
        }}
        onMouseEnter={e => (e.currentTarget.style.color = text)}
        onMouseLeave={e => (e.currentTarget.style.color = textDim)}
      >
        ← {isMobile ? '' : 'Leave'}
      </button>

      <div style={{
        position: 'absolute', left: '50%', transform: 'translateX(-50%)',
        display: 'flex', alignItems: 'center', gap: 6,
      }}>
        {icon}
        <span style={{
          fontFamily: 'Nunito, sans-serif', fontWeight: '800', fontSize: 16, color: text,
        }}>
          {name}
        </span>
        {roundLabel && (
          <span style={{
            fontFamily: 'Inter, sans-serif', fontSize: 11, color: textDim,
            backgroundColor: surface, padding: '2px 8px', borderRadius: 5,
            border: `1px solid ${panelBorder}`,
          }}>
            {roundLabel}
          </span>
        )}
      </div>

      <div style={{
        marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8, zIndex: 1,
      }}>
        {!isMobile && (
          <span style={{
            fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: textDim, letterSpacing: '1px',
          }}>
            {code}
          </span>
        )}
        <button
          onClick={onCopy}
          style={{
            padding: isMobile ? '5px 8px' : '4px 10px',
            border: `1px solid ${copied ? gold : panelBorder}`,
            borderRadius: 6, backgroundColor: 'transparent',
            fontFamily: 'Inter, sans-serif', fontSize: 11,
            color: copied ? gold : textDim, cursor: 'pointer',
          }}
        >
          {copied ? '✓' : isMobile ? '🔗' : 'Copy link'}
        </button>
        {!isMobile && (
          <span style={{
            fontFamily: 'Inter, sans-serif', fontSize: 11, color: `${textDim}66`,
          }}>
            {peers === 0 ? '—' : `${peers} other${peers === 1 ? '' : 's'}`}
          </span>
        )}
      </div>
    </div>
  );
}
