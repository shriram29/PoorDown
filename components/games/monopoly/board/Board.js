import { motion } from 'framer-motion';
import { BOARD_SPACES, GROUP_COLORS } from '../../../../lib/games/monopoly/board';

const CELL_BG = '#18152a';
const CELL_STROKE = '#231e3f';
const TEXT_MAIN = '#d0d0ec';
const TEXT_DIM = '#6a6480';
const STRIP_SIZE = 18;
const LOG_COLORS = { success: '#22c55e', warning: '#f59e0b', error: '#ef4444', info: '#9b8fd4' };

export default function Board({ players = [], currentPlayerIndex = -1, boardState = {}, onPropertyClick, gameLogs = [], highlightSpaceId = null }) {
  const WIDTH = 1000;
  const HEIGHT = 1000;
  const CORNER_SIZE = 120;
  const TRACK_WIDTH = 110;
  const SPACE_WIDTH = 88;

  const getSpacePosition = (id) => {
    if (id >= 1 && id <= 9) {
      return { x: WIDTH - CORNER_SIZE - id * SPACE_WIDTH, y: HEIGHT - TRACK_WIDTH, width: SPACE_WIDTH, height: TRACK_WIDTH, rotation: 0 };
    }
    if (id >= 11 && id <= 19) {
      return { x: 0, y: HEIGHT - CORNER_SIZE - (id - 10) * SPACE_WIDTH, width: TRACK_WIDTH, height: SPACE_WIDTH, rotation: -90 };
    }
    if (id >= 21 && id <= 29) {
      return { x: CORNER_SIZE + (id - 21) * SPACE_WIDTH, y: 0, width: SPACE_WIDTH, height: TRACK_WIDTH, rotation: 180 };
    }
    if (id >= 31 && id <= 39) {
      return { x: WIDTH - TRACK_WIDTH, y: CORNER_SIZE + (id - 31) * SPACE_WIDTH, width: TRACK_WIDTH, height: SPACE_WIDTH, rotation: 90 };
    }
    return { x: 0, y: 0, width: 0, height: 0, rotation: 0 };
  };

  const getCornerPosition = (id) => {
    if (id === 0)  return { x: WIDTH - CORNER_SIZE, y: HEIGHT - CORNER_SIZE, width: CORNER_SIZE, height: CORNER_SIZE };
    if (id === 10) return { x: 0,                   y: HEIGHT - CORNER_SIZE, width: CORNER_SIZE, height: CORNER_SIZE };
    if (id === 20) return { x: 0,                   y: 0,                   width: CORNER_SIZE, height: CORNER_SIZE };
    if (id === 30) return { x: WIDTH - CORNER_SIZE, y: 0,                   width: CORNER_SIZE, height: CORNER_SIZE };
    return { x: 0, y: 0, width: 0, height: 0 };
  };

  const getTokenCenter = (id) => {
    if (id === 0)  return { cx: WIDTH - CORNER_SIZE / 2, cy: HEIGHT - CORNER_SIZE / 2 };
    if (id === 10) return { cx: CORNER_SIZE / 2,         cy: HEIGHT - CORNER_SIZE / 2 };
    if (id === 20) return { cx: CORNER_SIZE / 2,         cy: CORNER_SIZE / 2 };
    if (id === 30) return { cx: WIDTH - CORNER_SIZE / 2, cy: CORNER_SIZE / 2 };
    const pos = getSpacePosition(id);
    return { cx: pos.x + pos.width / 2, cy: pos.y + pos.height / 2 };
  };

  const getStrip = (id, pos) => {
    if (id >= 1  && id <= 9)  return { x: 0,               y: 0,               w: pos.width,  h: STRIP_SIZE };
    if (id >= 11 && id <= 19) return { x: pos.width - STRIP_SIZE, y: 0,         w: STRIP_SIZE, h: pos.height };
    if (id >= 21 && id <= 29) return { x: 0,               y: pos.height - STRIP_SIZE, w: pos.width, h: STRIP_SIZE };
    if (id >= 31 && id <= 39) return { x: 0,               y: 0,               w: STRIP_SIZE, h: pos.height };
    return null;
  };

  const renderHouseIndicators = (strip, houses) => {
    const isHoriz = strip.w >= strip.h;
    if (houses === 5) {
      return (
        <rect
          x={strip.x + strip.w / 2 - 8}
          y={strip.y + strip.h / 2 - 7}
          width={16} height={14}
          fill="#ef4444" rx="2"
        />
      );
    }
    return Array.from({ length: houses }).map((_, i) => {
      let hx, hy;
      if (isHoriz) {
        const step = strip.w / (houses + 1);
        hx = strip.x + step * (i + 1);
        hy = strip.y + strip.h / 2;
      } else {
        const step = strip.h / (houses + 1);
        hx = strip.x + strip.w / 2;
        hy = strip.y + step * (i + 1);
      }
      return <circle key={i} cx={hx} cy={hy} r={4} fill="#22c55e" stroke="#16172a" strokeWidth="1" />;
    });
  };

  const renderPropertySpace = (space) => {
    const pos = getSpacePosition(space.id);
    const groupColor = GROUP_COLORS[space.group] || '#6a6d9a';
    const cx = pos.width / 2;
    const cy = pos.height / 2;
    const nameStr = space.shortName || space.name;
    const strip = getStrip(space.id, pos);
    const hasIcon = BOARD_SPACES[space.id]?.type === 'railroad' || BOARD_SPACES[space.id]?.type === 'utility';

    const propState = boardState[space.id];
    const ownerPlayer = propState?.owner ? players.find(p => p.uuid === propState.owner) : null;
    const houses = propState?.houses || 0;
    const mortgaged = propState?.mortgaged || false;
    const isHighlighted = space.id === highlightSpaceId;

    return (
      <g
        key={space.id}
        transform={`translate(${pos.x}, ${pos.y})`}
        onClick={() => onPropertyClick && onPropertyClick(space.id)}
        style={{ cursor: onPropertyClick ? 'pointer' : 'default' }}
      >
        <rect width={pos.width} height={pos.height} fill={CELL_BG} stroke={CELL_STROKE} strokeWidth="1" />

        {/* Color strip */}
        {strip && <rect x={strip.x} y={strip.y} width={strip.w} height={strip.h} fill={groupColor} />}

        {/* House / hotel dots on the strip */}
        {strip && houses > 0 && !mortgaged && renderHouseIndicators(strip, houses)}

        {/* Mortgaged overlay on strip */}
        {strip && mortgaged && (
          <rect x={strip.x} y={strip.y} width={strip.w} height={strip.h} fill="rgba(0,0,0,0.55)" />
        )}

        {/* Purchase highlight — pulsing golden glow when this space is purchasable */}
        {isHighlighted && (
          <motion.rect
            x="2" y="2"
            width={pos.width - 4} height={pos.height - 4}
            fill="rgba(250, 204, 21, 0.10)"
            stroke="#facc15"
            strokeWidth="3"
            rx="2"
            animate={{ opacity: [0.55, 1, 0.55], strokeWidth: [2.5, 4.5, 2.5] }}
            transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}

        {/* Owner border — drawn inside the cell edge */}
        {ownerPlayer && (
          <rect
            x="2" y="2"
            width={pos.width - 4} height={pos.height - 4}
            fill="none"
            stroke={ownerPlayer.color}
            strokeWidth="3"
            opacity="0.9"
            rx="1"
          />
        )}

        <g transform={`rotate(${pos.rotation}, ${cx}, ${cy})`}>
          {space.type === 'railroad' && (
            <text x={cx} y={cy - 20} textAnchor="middle" dominantBaseline="middle" fontSize="18" fill={TEXT_MAIN}>
              🚂
            </text>
          )}
          {space.type === 'utility' && (
            <text x={cx} y={cy - 20} textAnchor="middle" dominantBaseline="middle" fontSize="17" fill={TEXT_MAIN}>
              ⚡
            </text>
          )}
          <text
            x={cx} y={cy + (hasIcon ? 6 : -7)}
            textAnchor="middle" dominantBaseline="middle"
            fontSize="13" fill={TEXT_MAIN} fontFamily="Inter, sans-serif" fontWeight="600"
          >
            {nameStr}
          </text>
          {space.price && (
            <text
              x={cx} y={cy + (hasIcon ? 22 : 10)}
              textAnchor="middle" dominantBaseline="middle"
              fontSize="11" fill={TEXT_DIM} fontFamily="Inter, sans-serif"
            >
              ${space.price}
            </text>
          )}
        </g>
      </g>
    );
  };

  const renderCorner = (id) => {
    const pos = getCornerPosition(id);
    const cornerStyles = {
      0:  { bg: '#16422e', accent: '#22c55e', text: 'GO',    sub: 'Collect $200' },
      10: { bg: '#1c2a4a', accent: '#6366f1', text: 'JAIL',  sub: 'Just Visiting' },
      20: { bg: '#1a3040', accent: '#06b6d4', text: 'FREE',  sub: 'PARKING' },
      30: { bg: '#3d1818', accent: '#ef4444', text: 'GO TO', sub: 'JAIL' },
    };
    const style = cornerStyles[id] || { bg: '#252648', accent: '#6a6d9a', text: '', sub: '' };

    return (
      <g key={`corner-${id}`} transform={`translate(${pos.x}, ${pos.y})`}>
        <rect width={pos.width} height={pos.height} fill={style.bg} stroke={CELL_STROKE} strokeWidth="1" />
        <text x={pos.width / 2} y={pos.height / 2 - 12} textAnchor="middle"
          fontSize="22" fill={style.accent} fontFamily="Inter, sans-serif" fontWeight="800">
          {style.text.split(' ').map((line, i) => (
            <tspan key={i} x={pos.width / 2} dy={i === 0 ? 0 : 22}>{line}</tspan>
          ))}
        </text>
        <text x={pos.width / 2} y={pos.height - 14} textAnchor="middle"
          fontSize="12" fill={TEXT_DIM} fontFamily="Inter, sans-serif">
          {style.sub}
        </text>
      </g>
    );
  };

  const renderSpecialSpace = (space) => {
    const pos = getSpacePosition(space.id);
    const cx = pos.width / 2;
    const cy = pos.height / 2;

    let accent = '#6a6d9a';
    let icon = '?';
    if (space.type === 'chance')        { accent = '#ef4444'; icon = '?'; }
    if (space.type === 'communityChest') { accent = '#818cf8'; icon = 'CC'; }
    if (space.type === 'tax')            { accent = '#f59e0b'; icon = '$'; }

    return (
      <g key={space.id} transform={`translate(${pos.x}, ${pos.y})`}>
        <rect width={pos.width} height={pos.height} fill="#1a1630" stroke={CELL_STROKE} strokeWidth="1" />
        <g transform={`rotate(${pos.rotation}, ${cx}, ${cy})`}>
          <text x={cx} y={cy - 12} textAnchor="middle" dominantBaseline="middle"
            fontSize="24" fill={accent} fontFamily="Inter, sans-serif" fontWeight="800">
            {icon}
          </text>
          <text x={cx} y={cy + 16} textAnchor="middle" dominantBaseline="middle"
            fontSize="10" fill={TEXT_DIM} fontFamily="Inter, sans-serif">
            {space.shortName || space.name}
          </text>
          {space.amount && (
            <text x={cx} y={cy + 29} textAnchor="middle" dominantBaseline="middle"
              fontSize="11" fill={accent} fontFamily="Inter, sans-serif">
              -${space.amount}
            </text>
          )}
        </g>
      </g>
    );
  };

  const renderPlayers = () => {
    // Group players by their actual board position for spreading overlapping tokens
    const positionGroups = {};
    players.forEach(player => {
      const pos = player.position;
      if (!positionGroups[pos]) positionGroups[pos] = [];
      positionGroups[pos].push(player);
    });

    return players.map((player, idx) => {
      const pos = player.position;
      const group = positionGroups[pos] || [];
      const posIndex = group.findIndex(p => p.uuid === player.uuid);
      const groupSize = group.length;

      const { cx: baseCx, cy: baseCy } = getTokenCenter(pos);

      let cx, cy;
      if (groupSize === 1) {
        cx = baseCx;
        cy = baseCy;
      } else {
        const angle = (posIndex / groupSize) * Math.PI * 2 - Math.PI / 2;
        cx = baseCx + Math.cos(angle) * 14;
        cy = baseCy + Math.sin(angle) * 14;
      }

      const isActive = idx === currentPlayerIndex;

      return (
        <motion.g
          key={player.uuid}
          initial={{ x: cx, y: cy }}
          animate={{ x: cx, y: cy }}
          transition={{ type: 'spring', stiffness: 120, damping: 18 }}
        >
          {isActive && (
            <motion.circle
              r="16"
              fill="none"
              stroke={player.color}
              strokeWidth="2.5"
              animate={{ opacity: [0.4, 0.9, 0.4] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
            />
          )}
          <circle r="11" fill={player.color} stroke="#16172a" strokeWidth="2" />
          <text y="4" textAnchor="middle" fontSize="10" fill="white" fontWeight="bold" fontFamily="Inter, sans-serif">
            {player.name ? player.name.charAt(0).toUpperCase() : '?'}
          </text>
        </motion.g>
      );
    });
  };

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      style={{ width: '100%', height: '100%', borderRadius: '6px' }}
    >
      <rect x="0" y="0" width={WIDTH} height={HEIGHT} fill="#0d0b17" rx="4" />

      <rect x={CORNER_SIZE} y={HEIGHT - TRACK_WIDTH} width={WIDTH - 2 * CORNER_SIZE} height={TRACK_WIDTH} fill="#130f22" />
      <rect x={WIDTH - TRACK_WIDTH} y={CORNER_SIZE} width={TRACK_WIDTH} height={HEIGHT - 2 * CORNER_SIZE} fill="#130f22" />
      <rect x={CORNER_SIZE} y="0" width={WIDTH - 2 * CORNER_SIZE} height={TRACK_WIDTH} fill="#130f22" />
      <rect x="0" y={CORNER_SIZE} width={TRACK_WIDTH} height={HEIGHT - 2 * CORNER_SIZE} fill="#130f22" />

      {BOARD_SPACES.filter(s => s.type === 'chance' || s.type === 'communityChest' || s.type === 'tax').map(renderSpecialSpace)}
      {BOARD_SPACES.filter(s => s.type === 'property' || s.type === 'railroad' || s.type === 'utility').map(renderPropertySpace)}
      {[0, 10, 20, 30].map(renderCorner)}

      <rect x={CORNER_SIZE} y={CORNER_SIZE} width={WIDTH - 2 * CORNER_SIZE} height={HEIGHT - 2 * CORNER_SIZE} fill="#110e1e" rx="4" />
      <foreignObject x={CORNER_SIZE + 8} y={CORNER_SIZE + 8} width={WIDTH - 2 * CORNER_SIZE - 16} height={HEIGHT - 2 * CORNER_SIZE - 16}>
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column', fontFamily: 'Inter, sans-serif', boxSizing: 'border-box', padding: '18px 20px' }}>
          <div style={{ fontSize: '11px', color: '#4a4468', fontWeight: '700', letterSpacing: '0.12em', marginBottom: '12px' }}>GAME LOG</div>
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px', scrollbarWidth: 'none' }}>
            {gameLogs.length === 0
              ? <span style={{ color: '#2e2950', fontSize: '13px' }}>Waiting for game to start…</span>
              : gameLogs.map(log => (
                <div key={log.id} style={{ fontSize: '13px', color: LOG_COLORS[log.type] ?? '#d0d0ec', lineHeight: '1.45', wordBreak: 'break-word' }}>
                  {log.msg}
                </div>
              ))
            }
          </div>
          <div style={{ borderTop: '1px solid #231e3f', paddingTop: '10px', marginTop: '10px', textAlign: 'center' }}>
            <span style={{ fontSize: '20px', fontWeight: '800', color: '#e2e2f0', letterSpacing: '-0.01em' }}>
              Poor<span style={{ color: '#ef4444' }}>Down</span>
            </span>
          </div>
        </div>
      </foreignObject>

      {renderPlayers()}
    </svg>
  );
}
