import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { BOARD_SPACES, GROUP_COLORS } from '../../../../lib/games/monopoly/board';

const CELL_BG = '#1e2140';
const CELL_STROKE = '#2a2d50';
const TEXT_MAIN = '#d0d0ec';
const TEXT_DIM = '#5a5d7a';
const STRIP_SIZE = 18;

export default function Board({ players = [], currentPlayerIndex = -1, onPropertyClick }) {
  const WIDTH = 1000;
  const HEIGHT = 1000;
  const CORNER_SIZE = 120;
  const TRACK_WIDTH = 110;
  const SPACE_WIDTH = 88;

  const [displayPositions, setDisplayPositions] = useState(
    () => Object.fromEntries(players.map(p => [p.uuid, p.position]))
  );
  const animatingRef = useRef({});

  useEffect(() => {
    players.forEach((player) => {
      const key = player.uuid;
      const current = displayPositions[key] ?? player.position;
      const target = player.position;

      if (current === target || animatingRef.current[key]) return;

      animatingRef.current[key] = true;
      let step = current;

      const animate = () => {
        if (step === target) {
          animatingRef.current[key] = false;
          return;
        }
        step = (step + 1) % 40;
        setDisplayPositions(prev => ({ ...prev, [key]: step }));
        setTimeout(animate, 180);
      };

      setTimeout(animate, 50);
    });
  }, [players]);

  const getSpacePosition = (id) => {
    if (id >= 1 && id <= 9) {
      const x = WIDTH - CORNER_SIZE - id * SPACE_WIDTH;
      const y = HEIGHT - TRACK_WIDTH;
      return { x, y, width: SPACE_WIDTH, height: TRACK_WIDTH, rotation: 0 };
    }
    if (id >= 11 && id <= 19) {
      const y = HEIGHT - CORNER_SIZE - (id - 10) * SPACE_WIDTH;
      const x = 0;
      return { x, y, width: TRACK_WIDTH, height: SPACE_WIDTH, rotation: -90 };
    }
    if (id >= 21 && id <= 29) {
      const x = CORNER_SIZE + (id - 21) * SPACE_WIDTH;
      const y = 0;
      return { x, y, width: SPACE_WIDTH, height: TRACK_WIDTH, rotation: 180 };
    }
    if (id >= 31 && id <= 39) {
      const y = CORNER_SIZE + (id - 31) * SPACE_WIDTH;
      const x = WIDTH - TRACK_WIDTH;
      return { x, y, width: TRACK_WIDTH, height: SPACE_WIDTH, rotation: 90 };
    }
    return { x: 0, y: 0, width: 0, height: 0, rotation: 0 };
  };

  const getCornerPosition = (id) => {
    if (id === 0)  return { x: WIDTH - CORNER_SIZE, y: HEIGHT - CORNER_SIZE, width: CORNER_SIZE, height: CORNER_SIZE, corner: 'br' };
    if (id === 10) return { x: 0, y: HEIGHT - CORNER_SIZE, width: CORNER_SIZE, height: CORNER_SIZE, corner: 'bl' };
    if (id === 20) return { x: 0, y: 0, width: CORNER_SIZE, height: CORNER_SIZE, corner: 'tl' };
    if (id === 30) return { x: WIDTH - CORNER_SIZE, y: 0, width: CORNER_SIZE, height: CORNER_SIZE, corner: 'tr' };
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

  const isCorner = (id) => [0, 10, 20, 30].includes(id);
  const isRailroad = (id) => BOARD_SPACES[id]?.type === 'railroad';
  const isUtility = (id) => BOARD_SPACES[id]?.type === 'utility';

  const getStrip = (id, pos) => {
    if (id >= 1 && id <= 9)   return { x: 0, y: 0, w: pos.width, h: STRIP_SIZE };
    if (id >= 11 && id <= 19) return { x: pos.width - STRIP_SIZE, y: 0, w: STRIP_SIZE, h: pos.height };
    if (id >= 21 && id <= 29) return { x: 0, y: pos.height - STRIP_SIZE, w: pos.width, h: STRIP_SIZE };
    if (id >= 31 && id <= 39) return { x: 0, y: 0, w: STRIP_SIZE, h: pos.height };
    return null;
  };

  const renderPropertySpace = (space) => {
    const pos = getSpacePosition(space.id);
    const groupColor = GROUP_COLORS[space.group] || '#6a6d9a';
    const cx = pos.width / 2;
    const cy = pos.height / 2;
    const nameStr = space.name.length > 11 ? space.name.substring(0, 10) + '…' : space.name;
    const strip = getStrip(space.id, pos);

    return (
      <g
        key={space.id}
        transform={`translate(${pos.x}, ${pos.y})`}
        onClick={() => onPropertyClick && onPropertyClick(space.id)}
        style={{ cursor: onPropertyClick ? 'pointer' : 'default' }}
      >
        <rect width={pos.width} height={pos.height} fill={CELL_BG} stroke={CELL_STROKE} strokeWidth="1" />
        {strip && <rect x={strip.x} y={strip.y} width={strip.w} height={strip.h} fill={groupColor} />}
        <g transform={`rotate(${pos.rotation}, ${cx}, ${cy})`}>
          {isRailroad(space.id) && (
            <text x={cx} y={cy - 14} textAnchor="middle" dominantBaseline="middle" fontSize="12" fill={TEXT_MAIN}>
              🚂
            </text>
          )}
          {isUtility(space.id) && (
            <text x={cx} y={cy - 14} textAnchor="middle" dominantBaseline="middle" fontSize="11" fill={TEXT_MAIN}>
              ⚡
            </text>
          )}
          <text x={cx} y={cy + (isRailroad(space.id) || isUtility(space.id) ? 2 : -4)}
            textAnchor="middle" dominantBaseline="middle"
            fontSize="7.5" fill={TEXT_MAIN} fontFamily="Inter, sans-serif" fontWeight="600">
            {nameStr}
          </text>
          {space.price && (
            <text x={cx} y={cy + (isRailroad(space.id) || isUtility(space.id) ? 14 : 8)}
              textAnchor="middle" dominantBaseline="middle"
              fontSize="7" fill={TEXT_DIM} fontFamily="Inter, sans-serif">
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
      0:  { bg: '#16422e', accent: '#22c55e', text: 'GO',     sub: 'Collect $200' },
      10: { bg: '#1c2a4a', accent: '#6366f1', text: 'JAIL',   sub: 'Just Visiting' },
      20: { bg: '#1a3040', accent: '#06b6d4', text: 'FREE',   sub: 'PARKING' },
      30: { bg: '#3d1818', accent: '#ef4444', text: 'GO TO',  sub: 'JAIL' },
    };
    const style = cornerStyles[id] || { bg: '#252648', accent: '#6a6d9a', text: '', sub: '' };

    return (
      <g key={`corner-${id}`} transform={`translate(${pos.x}, ${pos.y})`}>
        <rect width={pos.width} height={pos.height} fill={style.bg} stroke={CELL_STROKE} strokeWidth="1" />
        <text
          x={pos.width / 2}
          y={pos.height / 2 - 8}
          textAnchor="middle"
          fontSize="18"
          fill={style.accent}
          fontFamily="Inter, sans-serif"
          fontWeight="800"
        >
          {style.text.split(' ').map((line, i) => (
            <tspan key={i} x={pos.width / 2} dy={i === 0 ? 0 : 18}>{line}</tspan>
          ))}
        </text>
        <text x={pos.width / 2} y={pos.height - 16} textAnchor="middle"
          fontSize="8" fill={TEXT_DIM} fontFamily="Inter, sans-serif">
          {style.sub}
        </text>
      </g>
    );
  };

  const renderSpecialSpace = (space) => {
    const pos = getSpacePosition(space.id);
    const isChance = space.type === 'chance';
    const isCommunity = space.type === 'communityChest';
    const isTax = space.type === 'tax';

    let accent = '#6a6d9a';
    let icon = '?';
    if (isChance)    { accent = '#ef4444'; icon = '?'; }
    if (isCommunity) { accent = '#818cf8'; icon = 'CC'; }
    if (isTax)       { accent = '#f59e0b'; icon = '$'; }

    const cx = pos.width / 2;
    const cy = pos.height / 2;

    return (
      <g key={space.id} transform={`translate(${pos.x}, ${pos.y})`}>
        <rect width={pos.width} height={pos.height} fill="#252648" stroke={CELL_STROKE} strokeWidth="1" />
        <g transform={`rotate(${pos.rotation}, ${cx}, ${cy})`}>
          <text x={cx} y={cy - 8} textAnchor="middle" dominantBaseline="middle"
            fontSize="18" fill={accent} fontFamily="Inter, sans-serif" fontWeight="800">
            {icon}
          </text>
          <text x={cx} y={cy + 12} textAnchor="middle" dominantBaseline="middle"
            fontSize="6" fill={TEXT_DIM} fontFamily="Inter, sans-serif">
            {space.name.length > 10 ? space.name.substring(0, 9) : space.name}
          </text>
          {space.amount && (
            <text x={cx} y={cy + 22} textAnchor="middle" dominantBaseline="middle"
              fontSize="7" fill={accent} fontFamily="Inter, sans-serif">
              -${space.amount}
            </text>
          )}
        </g>
      </g>
    );
  };

  const renderPlayers = () => {
    const positionGroups = {};
    players.forEach((player) => {
      const displayPos = displayPositions[player.uuid] ?? player.position;
      if (!positionGroups[displayPos]) positionGroups[displayPos] = [];
      positionGroups[displayPos].push(player);
    });

    return players.map((player, idx) => {
      const displayPos = displayPositions[player.uuid] ?? player.position;
      const groupAtPos = positionGroups[displayPos] || [];
      const posIndex = groupAtPos.findIndex(p => p.uuid === player.uuid);
      const groupSize = groupAtPos.length;

      const { cx: baseCx, cy: baseCy } = getTokenCenter(displayPos);

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
          animate={{ x: cx, y: cy }}
          transition={{ type: 'spring', stiffness: 200, damping: 25 }}
        >
          {isActive && (
            <circle r="16" fill="none" stroke={player.color} strokeWidth="2.5" opacity="0.7" />
          )}
          <circle r="10" fill={player.color} stroke="#16172a" strokeWidth="2" />
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
      <rect x="0" y="0" width={WIDTH} height={HEIGHT} fill="#16172a" rx="4" />

      <rect x={CORNER_SIZE} y={HEIGHT - TRACK_WIDTH} width={WIDTH - 2 * CORNER_SIZE} height={TRACK_WIDTH} fill="#1e2038" />
      <rect x={WIDTH - TRACK_WIDTH} y={CORNER_SIZE} width={TRACK_WIDTH} height={HEIGHT - 2 * CORNER_SIZE} fill="#1e2038" />
      <rect x={CORNER_SIZE} y="0" width={WIDTH - 2 * CORNER_SIZE} height={TRACK_WIDTH} fill="#1e2038" />
      <rect x="0" y={CORNER_SIZE} width={TRACK_WIDTH} height={HEIGHT - 2 * CORNER_SIZE} fill="#1e2038" />

      {BOARD_SPACES.filter(s => s.type === 'chance' || s.type === 'communityChest' || s.type === 'tax').map(renderSpecialSpace)}
      {BOARD_SPACES.filter(s => s.type === 'property' || s.type === 'railroad' || s.type === 'utility').map(renderPropertySpace)}
      {[0, 10, 20, 30].map(renderCorner)}

      <rect x={CORNER_SIZE} y={CORNER_SIZE} width={WIDTH - 2 * CORNER_SIZE} height={HEIGHT - 2 * CORNER_SIZE} fill="#1a1c35" rx="4" />
      <text x={WIDTH / 2} y={HEIGHT / 2 - 18} textAnchor="middle"
        fontSize="32" fill="#e2e2f0" fontFamily="Inter, sans-serif" fontWeight="800">
        Poor<tspan fill="#ef4444">Down</tspan>
      </text>
      <text x={WIDTH / 2} y={HEIGHT / 2 + 14} textAnchor="middle"
        fontSize="13" fill="#3a3d5c" fontFamily="Inter, sans-serif">
        MONOPOLY CLONE
      </text>

      {renderPlayers()}
    </svg>
  );
}
