export default function GameHeader({
  onLeave, icon, name, roundLabel, code, copied, onCopy,
  peers, panelDark, panelBorder, text, textDim, gameColor, gold, surface,
}) {
  return (
    <div style={{
      position: 'relative', display: 'flex', alignItems: 'center',
      height: 48, paddingLeft: 16, paddingRight: 16,
      borderBottom: `1px solid ${panelBorder}`,
      flexShrink: 0, backgroundColor: panelDark,
    }}>
      <button
        onClick={onLeave}
        style={{
          background: 'none', border: 'none', color: textDim, cursor: 'pointer',
          fontFamily: 'Inter, sans-serif', fontSize: 13, padding: 0,
          display: 'flex', alignItems: 'center', gap: 4, zIndex: 1,
        }}
        onMouseEnter={e => (e.currentTarget.style.color = text)}
        onMouseLeave={e => (e.currentTarget.style.color = textDim)}
      >
        ← Leave
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
        marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10, zIndex: 1,
      }}>
        <span style={{
          fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: textDim, letterSpacing: '1px',
        }}>
          {code}
        </span>
        <button
          onClick={onCopy}
          style={{
            padding: '4px 10px',
            border: `1px solid ${copied ? gold : panelBorder}`,
            borderRadius: 6, backgroundColor: 'transparent',
            fontFamily: 'Inter, sans-serif', fontSize: 11,
            color: copied ? gold : textDim, cursor: 'pointer',
          }}
        >
          {copied ? 'Copied!' : 'Copy link'}
        </button>
        <span style={{
          fontFamily: 'Inter, sans-serif', fontSize: 11, color: `${textDim}66`,
        }}>
          {peers === 0 ? '—' : `${peers} other${peers === 1 ? '' : 's'}`}
        </span>
      </div>
    </div>
  );
}
