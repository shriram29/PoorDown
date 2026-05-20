import { useState, useEffect } from 'react';

function getSeatConfigs(count) {
  if (count === 1) {
    return [
      { top: '2%', left: '50%', transform: 'translateX(-50%)', fanRotation: 0, layout: 'col' },
    ];
  }
  if (count === 2) {
    return [
      { top: '5%', left: '22%', fanRotation: 30, layout: 'col' },
      { top: '5%', right: '22%', fanRotation: -30, layout: 'col' },
    ];
  }
  if (count === 3) {
    return [
      { top: '35%', left: '0.5%', transform: 'translateY(-50%)', fanRotation: -90, layout: 'row' },
      { top: '2%', left: '50%', transform: 'translateX(-50%)', fanRotation: 0, layout: 'col' },
      { top: '35%', right: '0.5%', transform: 'translateY(-50%)', fanRotation: 90, layout: 'row-reverse' },
    ];
  }
  return [
    { top: '35%', left: '0.5%', transform: 'translateY(-50%)', fanRotation: -90, layout: 'row' },
    { top: '4%', left: '26%', fanRotation: 20, layout: 'col' },
    { top: '4%', right: '26%', fanRotation: -20, layout: 'col' },
    { top: '35%', right: '0.5%', transform: 'translateY(-50%)', fanRotation: 90, layout: 'row-reverse' },
  ];
}

function useWindowSize() {
  const [size, setSize] = useState({ w: 1280, h: 800 });
  useEffect(() => {
    const update = () => setSize({ w: window.innerWidth, h: window.innerHeight });
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);
  return size;
}

export default function CardTable({
  opponents,
  center,
  myHand,
  actionBar,
  header,
  overlay,
  rulesButton,
  cssAnimations,
  renderOpponent,
  bg,
  tableColor,
  tableRim,
}) {
  const { w } = useWindowSize();
  const isMobile = w < 640;
  const isTablet = w < 1024;

  // Hand area height as % of the play area
  const handPct = isMobile ? 26 : isTablet ? 30 : 32;

  // Oval table bounds
  const ovalTop    = isMobile ? '1%'  : '4%';
  const ovalLeft   = isMobile ? '2%'  : isTablet ? '6%' : '8%';
  const ovalRight  = isMobile ? '2%'  : isTablet ? '6%' : '8%';
  const ovalBottom = `${handPct + 2}%`;

  // Size config passed to every renderOpponent call
  const sizeConfig = {
    isMobile,
    isTablet,
    fanCardW: isMobile ? 42 : isTablet ? 48 : 56,
    fanCardH: isMobile ? 62 : isTablet ? 72 : 84,
    avatarSize: isMobile ? 46 : isTablet ? 52 : 62,
    opponentScale: isMobile ? 0.72 : isTablet ? 0.78 : 0.88,
    opponentBaseW: isMobile ? 260 : isTablet ? 290 : 320,
  };

  const seatConfigs = getSeatConfigs(opponents.length);

  return (
    <div style={{
      height: '100vh', backgroundColor: bg,
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {header}

      {/* Main play area */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>

        {/* Oval felt table */}
        <div style={{
          position: 'absolute',
          top: ovalTop, left: ovalLeft, right: ovalRight, bottom: ovalBottom,
          borderRadius: '50%',
          background: `radial-gradient(ellipse at 50% 45%, ${tableColor}ff 0%, ${tableColor}cc 60%, ${tableColor}88 100%)`,
          boxShadow: `0 0 0 12px ${tableRim}, 0 0 0 20px ${tableRim}66, 0 12px 60px rgba(0,0,0,0.9), inset 0 0 100px rgba(0,0,0,0.25)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1,
        }}>
          {center}
        </div>

        {/* Opponent seats */}
        {opponents.map((opponent, seatIdx) => {
          const config = seatConfigs[seatIdx] || seatConfigs[seatConfigs.length - 1];
          const { fanRotation, layout, ...positionStyle } = config;
          return (
            <div key={opponent.uuid} style={{
              position: 'absolute',
              zIndex: 2,
              ...positionStyle,
            }}>
              {renderOpponent(opponent, seatIdx, { fanRotation, layout, ...config, ...sizeConfig })}
            </div>
          );
        })}

        {/* My hand area */}
        <div style={{
          position: 'absolute',
          bottom: 0, left: 0, right: 0, height: `${handPct}%`,
          zIndex: 3,
        }}>
          {myHand}
        </div>
      </div>

      {actionBar}

      {overlay}
      {rulesButton}
      {cssAnimations && <style>{cssAnimations}</style>}
    </div>
  );
}
