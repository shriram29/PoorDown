export default function RulesButton({
  open, onToggle, onClose, sections,
  gameColor, panel, panelBorder, textDim, text,
}) {
  return (
    <>
      <button
        onClick={onToggle}
        style={{
          position: 'fixed', bottom: 20, right: 20, zIndex: 301,
          width: 40, height: 40, borderRadius: '50%',
          backgroundColor: open ? gameColor : panel,
          border: `2px solid ${open ? gameColor : panelBorder}`,
          color: open ? '#fff' : textDim,
          fontFamily: 'Inter, sans-serif', fontSize: 16, fontWeight: '700',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
          transition: 'background-color 0.2s, border-color 0.2s',
        }}
      >
        ?
      </button>

      <div style={{
        position: 'fixed', bottom: 68, right: 20, zIndex: 300,
        width: 340, maxHeight: open ? '70vh' : 0,
        overflow: 'hidden',
        transition: 'max-height 0.4s cubic-bezier(0.4,0,0.2,1), opacity 0.3s',
        opacity: open ? 1 : 0,
        pointerEvents: open ? 'auto' : 'none',
      }}>
        <div style={{
          backgroundColor: panel,
          border: `1px solid ${gameColor}55`,
          borderRadius: '16px 16px 4px 16px',
          boxShadow: '0 -8px 40px rgba(0,0,0,0.7)',
          maxHeight: '70vh', overflowY: 'auto', scrollbarWidth: 'thin',
        }}>
          <div style={{
            position: 'sticky', top: 0, backgroundColor: panel,
            padding: '16px 18px 12px',
            borderBottom: `1px solid ${panelBorder}`,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            zIndex: 1,
          }}>
            <span style={{
              fontFamily: 'Nunito, sans-serif', fontWeight: '800', fontSize: 16, color: text,
            }}>
              How to Play
            </span>
            <button
              onClick={onClose}
              style={{
                background: 'none', border: 'none', color: textDim,
                cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: '0 2px',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = text)}
              onMouseLeave={e => (e.currentTarget.style.color = textDim)}
            >
              ×
            </button>
          </div>

          <div style={{ padding: '14px 18px 20px' }}>
            {sections.map((sec, i) => (
              <div key={i} style={{ marginBottom: 14 }}>
                <p style={{
                  fontFamily: 'Inter, sans-serif', fontWeight: '700', fontSize: 12,
                  color: gameColor, margin: '0 0 4px 0', letterSpacing: '0.3px',
                }}>
                  {sec.title}
                </p>
                <p style={{
                  fontFamily: 'Inter, sans-serif', fontSize: 12, color: textDim,
                  margin: 0, lineHeight: 1.65,
                }}>
                  {sec.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
