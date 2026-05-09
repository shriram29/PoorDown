import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { BOARD_SPACES, GROUP_COLORS } from '../../lib/game/board';

export default function Board({ players = [], currentPlayerIndex = -1, onPropertyClick }) {
  // Board dimensions
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
    // Spaces 1-9: bottom row, right to left (space 1 is adjacent to GO at bottom-right)
    if (id >= 1 && id <= 9) {
      const x = WIDTH - CORNER_SIZE - id * SPACE_WIDTH;
      const y = HEIGHT - TRACK_WIDTH;
      return { x, y, width: SPACE_WIDTH, height: TRACK_WIDTH, rotation: 0 };
    }
    // Spaces 11-19: left column, bottom to top (space 11 is adjacent to Jail at bottom-left)
    if (id >= 11 && id <= 19) {
      const y = HEIGHT - CORNER_SIZE - (id - 10) * SPACE_WIDTH;
      const x = 0;
      return { x, y, width: TRACK_WIDTH, height: SPACE_WIDTH, rotation: -90 };
    }
    // Spaces 21-29: top row, left to right (space 21 is adjacent to Free Parking at top-left)
    if (id >= 21 && id <= 29) {
      const x = CORNER_SIZE + (id - 21) * SPACE_WIDTH;
      const y = 0;
      return { x, y, width: SPACE_WIDTH, height: TRACK_WIDTH, rotation: 180 };
    }
    // Spaces 31-39: right column, top to bottom (space 31 is adjacent to Go To Jail at top-right)
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

  const renderPropertySpace = (space) => {
    const pos = getSpacePosition(space.id);
    const groupColor = GROUP_COLORS[space.group] || '#8D99AE';
    
    const cx = pos.width / 2;
    const cy = pos.height / 2;
    const nameStr = space.name.length > 12 ? space.name.substring(0, 11) : space.name;

    return (
      <g
        key={space.id}
        transform={`translate(${pos.x}, ${pos.y})`}
        onClick={() => onPropertyClick && onPropertyClick(space.id)}
        style={{ cursor: onPropertyClick ? 'pointer' : 'default' }}
      >
        <rect
          width={pos.width}
          height={pos.height}
          fill={groupColor}
          stroke="#2B2D42"
          strokeWidth="2"
          className="property-space"
        />
        <g transform={`rotate(${pos.rotation}, ${cx}, ${cy})`}>
          <text
            x={cx}
            y={cy}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="8"
            fill="white"
            fontFamily="Inter, sans-serif"
            fontWeight="600"
          >
            {nameStr}
          </text>
          {space.price && (
            <text
              x={cx}
              y={cy + 12}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="7"
              fill="white"
              fontFamily="JetBrains Mono, monospace"
              opacity="0.9"
            >
              ${space.price}
            </text>
          )}
          {isRailroad(space.id) && (
            <text
              x={cx}
              y={cy - 12}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="14"
              fill="white"
            >
              🚂
            </text>
          )}
          {isUtility(space.id) && (
            <text
              x={cx}
              y={cy - 12}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="12"
              fill="white"
            >
              ⚡
            </text>
          )}
        </g>
      </g>
    );
  };

  const renderCorner = (id) => {
    const pos = getCornerPosition(id);
    const space = BOARD_SPACES[id];
    
    const cornerStyles = {
      0: { bg: '#2D6A4F', text: 'GO', subtext: 'Collect $200' }, // GO - green
      10: { bg: '#E76F51', text: 'JAIL', subtext: 'Just Visiting' }, // Jail - orange
      20: { bg: '#2D6A4F', text: 'FREE', subtext: 'PARKING' }, // Free Parking - green
      30: { bg: '#E76F51', text: 'GO TO', subtext: 'JAIL' }, // Go To Jail - orange
    };
    
    const style = cornerStyles[id] || { bg: '#8D99AE', text: space.name };
    
    return (
      <g key={`corner-${id}`} transform={`translate(${pos.x}, ${pos.y})`}>
        <rect
          width={pos.width}
          height={pos.height}
          fill={style.bg}
          stroke="#2B2D42"
          strokeWidth="2"
        />
        <text
          x={pos.width / 2}
          y={pos.height / 2 - (id === 0 || id === 30 ? 8 : 0)}
          textAnchor="middle"
          fontSize={id === 10 || id === 20 ? 18 : 22}
          fill="white"
          fontFamily="Playfair Display, serif"
          fontWeight="800"
        >
          {style.text.split(' ').map((line, i) => (
            <tspan key={i} x={pos.width / 2} dy={i === 0 ? 0 : 14}>
              {line}
            </tspan>
          ))}
        </text>
        <text
          x={pos.width / 2}
          y={pos.height - 15}
          textAnchor="middle"
          fontSize="9"
          fill="white"
          fontFamily="Inter, sans-serif"
          opacity="0.9"
        >
          {style.subtext}
        </text>
      </g>
    );
  };

  const renderSpecialSpace = (space) => {
    const pos = getSpacePosition(space.id);
    const isChance = space.type === 'chance';
    const isCommunity = space.type === 'communityChest';
    const isTax = space.type === 'tax';
    
    let bgColor = '#F8F4E8';
    let icon = '';
    
    if (isChance) {
      bgColor = '#E63946';
      icon = '?';
    } else if (isCommunity) {
      bgColor = '#1D3557';
      icon = 'C';
    } else if (isTax) {
      bgColor = '#F4A261';
      icon = '$';
    }
    
    const cx = pos.width / 2;
    const cy = pos.height / 2;

    return (
      <g key={space.id} transform={`translate(${pos.x}, ${pos.y})`}>
        <rect
          width={pos.width}
          height={pos.height}
          fill={bgColor}
          stroke="#2B2D42"
          strokeWidth="2"
        />
        <g transform={`rotate(${pos.rotation}, ${cx}, ${cy})`}>
          <text
            x={cx}
            y={cy - 8}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="20"
            fill="white"
            fontFamily="Playfair Display, serif"
            fontWeight="800"
          >
            {icon}
          </text>
          <text
            x={cx}
            y={cy + 14}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="6"
            fill="white"
            fontFamily="Inter, sans-serif"
            opacity="0.9"
          >
            {space.name.length > 12 ? space.name.substring(0, 10) : space.name}
          </text>
          {space.amount && (
            <text
              x={cx}
              y={cy + 24}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="7"
              fill="white"
              fontFamily="JetBrains Mono, monospace"
            >
              -${space.amount}
            </text>
          )}
        </g>
      </g>
    );
  };

  const renderPlayers = () => {
    const positionGroups = {};
    players.forEach((player, idx) => {
      const displayPos = displayPositions[player.uuid] ?? player.position;
      if (!positionGroups[displayPos]) positionGroups[displayPos] = [];
      positionGroups[displayPos].push({ ...player, index: idx });
    });

    const tokens = [];

    players.forEach((player, idx) => {
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

      tokens.push(
        <motion.g
          key={player.uuid}
          animate={{ x: cx, y: cy }}
          transition={{ type: 'spring', stiffness: 200, damping: 25 }}
        >
          {isActive && (
            <circle
              r="16"
              fill="none"
              stroke={player.color}
              strokeWidth="3"
              opacity="0.8"
            />
          )}
          <circle
            r="10"
            fill={player.color}
            stroke="#2B2D42"
            strokeWidth="2"
          />
          <text
            y="4"
            textAnchor="middle"
            fontSize="10"
            fill="white"
            fontWeight="bold"
            fontFamily="Inter, sans-serif"
          >
            {player.name ? player.name.charAt(0).toUpperCase() : '?'}
          </text>
        </motion.g>
      );
    });

    return tokens;
  };

  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      style={{
        width: '100%',
        maxWidth: '800px',
        height: 'auto',
        borderRadius: '8px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
      }}
    >
      {/* Board background */}
      <rect
        x="0"
        y="0"
        width={WIDTH}
        height={HEIGHT}
        fill="#2B2D42"
        rx="4"
      />
      
      {/* Track background */}
      <rect
        x={CORNER_SIZE}
        y={HEIGHT - TRACK_WIDTH}
        width={WIDTH - 2 * CORNER_SIZE}
        height={TRACK_WIDTH}
        fill="#F8F4E8"
      />
      <rect
        x={WIDTH - TRACK_WIDTH}
        y={CORNER_SIZE}
        width={TRACK_WIDTH}
        height={HEIGHT - 2 * CORNER_SIZE}
        fill="#F8F4E8"
      />
      <rect
        x={CORNER_SIZE}
        y="0"
        width={WIDTH - 2 * CORNER_SIZE}
        height={TRACK_WIDTH}
        fill="#F8F4E8"
      />
      <rect
        x="0"
        y={CORNER_SIZE}
        width={TRACK_WIDTH}
        height={HEIGHT - 2 * CORNER_SIZE}
        fill="#F8F4E8"
      />
      
      {/* Render special spaces first (under properties) */}
      {BOARD_SPACES.filter(s => s.type === 'chance' || s.type === 'communityChest' || s.type === 'tax').map(renderSpecialSpace)}
      
      {/* Render property spaces */}
      {BOARD_SPACES.filter(s => s.type === 'property' || s.type === 'railroad' || s.type === 'utility').map(renderPropertySpace)}
      
      {/* Render corners */}
      {[0, 10, 20, 30].map(renderCorner)}
      
      {/* Center area */}
      <rect
        x={CORNER_SIZE}
        y={CORNER_SIZE}
        width={WIDTH - 2 * CORNER_SIZE}
        height={HEIGHT - 2 * CORNER_SIZE}
        fill="#2D6A4F"
        rx="4"
      />
      
      {/* Center dice area */}
      <g transform={`translate(${WIDTH / 2}, ${HEIGHT / 2})`}>
        <rect
          x="-80"
          y="-60"
          width="160"
          height="120"
          fill="#F8F4E8"
          rx="8"
          stroke="#2B2D42"
          strokeWidth="2"
        />
        <text
          y="-25"
          textAnchor="middle"
          fontSize="14"
          fill="#2B2D42"
          fontFamily="Playfair Display, serif"
          fontWeight="700"
        >
          PoorDown
        </text>
        <text
          y="-5"
          textAnchor="middle"
          fontSize="24"
          fill="#E63946"
          fontFamily="Playfair Display, serif"
          fontWeight="800"
        >
          🎲
        </text>
        <text
          y="25"
          textAnchor="middle"
          fontSize="10"
          fill="#8D99AE"
          fontFamily="Inter, sans-serif"
        >
          Monopoly Clone
        </text>
      </g>
      
      {/* Render player tokens */}
      {renderPlayers()}
    </svg>
  );
}