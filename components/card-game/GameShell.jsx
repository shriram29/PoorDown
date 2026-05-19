export default function GameShell({
  bg,
  header,
  sidebar,
  tableArea,
  actionBar,
  overlay,
  rulesButton,
  cssAnimations,
}) {
  return (
    <div style={{
      height: '100vh', backgroundColor: bg,
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      {header}

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {sidebar}

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {tableArea}
          {actionBar}
        </div>
      </div>

      {overlay}
      {rulesButton}
      {cssAnimations && <style>{cssAnimations}</style>}
    </div>
  );
}
