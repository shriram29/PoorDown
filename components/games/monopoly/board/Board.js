// Monopoly Board SVG Component
// Renders a full Monopoly board with all 40 spaces
import { BOARD_SPACES, GROUP_COLORS } from '../../../../lib/games/monopoly/board';

export default function Board({ players = [], currentPlayerIndex = -1, onPropertyClick }) {
  // Board dimensions
  const WIDTH = 1000;
  const HEIGHT = 1000;
  const CORNER_SIZE = 120;
  const TRACK_WIDTH = 110;
  const SPACE_WIDTH = 88;
  const SPACE_HEIGHT = TRACK_WIDTH;

  // Calculate positions for all 40 spaces
  // Going clockwise: bottom (0-9), right (10-19), top (20-29), left (30-39)

  const getSpacePosition = (id) => {
    const cornerSize = CORNER_SIZE;
    const trackWidth = TRACK_WIDTH;
    const spaceWidth = SPACE_WIDTH;

    // Bottom row (0): left to right, y = HEIGHT - cornerSize to HEIGHT
    if (id >= 0 && id <= 9) {
      const x = cornerSize + (id - 1) * spaceWidth;
      const y = HEIGHT - trackWidth;
      return { x, y, width: spaceWidth, height: trackWidth, rotation: 0 };
    }
    // Right column (10): bottom to top, x = WIDTH - trackWidth to WIDTH
    if (id >= 10 && id <= 19) {
      const y = HEIGHT - cornerSize - (id - 10) * spaceWidth;
      const x = WIDTH - trackWidth;
      return { x, y, width: trackWidth, height: spaceWidth, rotation: 90 };
    }
    // Top row (20): right to left, y = 0 to trackWidth
    if (id >= 20 && id <= 29) {
      const x = WIDTH - cornerSize - (id - 20 + 1) * spaceWidth;
      const y = 0;
      return { x, y, width: spaceWidth, height: trackWidth, rotation: 0 };
    }
    // Left column (30): top to bottom, x = 0 to trackWidth
    if (id >= 30 && id <= 39) {
      const y = cornerSize + (id - 30) * spaceWidth;
      const x = 0;
      return { x, y, width: trackWidth, height: spaceWidth, rotation: 90 };
    }
    return { x: 0, y: 0, width: 0, height: 0, rotation: 0 };
  };

  const getCornerPosition = (id) => {
    if (id === 0) return { x: 0, y: HEIGHT - CORNER_SIZE, width: CORNER_SIZE, height: CORNER_SIZE, corner: 'bl' };
    if (id === 10) return { x: 0, y: HEIGHT - CORNER_SIZE, width: CORNER_SIZE, height: CORNER_SIZE, corner: 'tl' };
    if (id === 20) return { x: 0, y: 0, width: CORNER_SIZE, height: CORNER_SIZE, corner: 'tr' };
    if (id === 30) return { x: WIDTH - CORNER_SIZE, y: 0, width: CORNER_SIZE, height: CORNER_SIZE, corner: 'br' };
    return { x: 0, y: 0, width: 0, height: 0 };
  };

  const isCorner = (id) => [0, 10, 20, 30].includes(id);
  const isRailroad = (id) => BOARD_SPACES[id]?.type === 'railroad';
  const isUtility = (id) => BOARD_SPACES[id]?.type === 'utility';

  const renderPropertySpace = (space) => {
    const pos = getSpacePosition(space.id);
    const groupColor = GROUP_COLORS[space.group] || '#8D99AE';

    return (
      <g
        key={space.id}
        transform={`translate(${pos.x}, ${pos.y})`}
        onClick={() => onPropertyClick && onPropertyClick(space.id)}
        style={{ cursor: onPropertyClick ? 'pointer' : 'default' }}
      >
        {/* Property background */}
        <rect
          width={pos.width}
          height={pos.height}
          fill={groupColor}
          stroke="#2B2D42"
          strokeWidth="2"
          className="property-space"
        />

        {/* Property name - rotated based on position */}
        {space.id < 10 && (
          <text
            x={pos.width / 2}
            y={pos.height / 2 + 5}
            textAnchor="middle"
            fontSize="9"
            fill="white"
            fontFamily="Inter, sans-serif"
            fontWeight="600"
            style={{ textShadow: '1px 1px 1px rgba(0,0,0,0.5)' }}
          >
            {space.name.length > 12 ? space.name.substring(0, 11) : space.name}
          </text>
        )}
        {space.id >= 10 && space.id < 20 && (
          <text
            x={pos.width / 2}
            y={pos.height / 2}
            textAnchor="middle"
            fontSize="8"
            fill="white"
            fontFamily="Inter, sans-serif"
            fontWeight="600"
            transform={`rotate(90, ${pos.width / 2}, ${pos.height / 2})`}
          >
            {space.name.length > 12 ? space.name.substring(0, 11) : space.name}
          </text>
        )}
        {space.id >= 20 && space.id < 30 && (
          <text
            x={pos.width / 2}
            y={pos.height / 2 - 5}
            textAnchor="middle"
            fontSize="9"
            fill="white"
            fontFamily="Inter, sans-serif"
            fontWeight="600"
          >
            {space.name.length > 12 ? space.name.substring(0, 11) : space.name}
          </text>
        )}
        {space.id >= 30 && (
          <text
            x={pos.width / 2}
            y={pos.height / 2}
            textAnchor="middle"
            fontSize="8"
            fill="white"
            fontFamily="Inter, sans-serif"
            fontWeight="600"
            transform={`rotate(90, ${pos.width / 2}, ${pos.height / 2})`}
          >
            {space.name.length > 12 ? space.name.substring(0, 11) : space.name}
          </text>
        )}

        {/* Price tag */}
        {space.price && (
          <text
            x={pos.width / 2}
            y={space.id < 10 ? pos.height / 2 + 18 : space.id >= 30 ? pos.height - 8 : pos.height / 2 + 20}
            textAnchor="middle"
            fontSize="7"
            fill="white"
            fontFamily="JetBrains Mono, monospace"
            opacity="0.9"
          >
            ${space.price}
          </text>
        )}

        {/* Railroad icon */}
        {isRailroad(space.id) && (
          <text
            x={pos.width / 2}
            y={space.id >= 10 && space.id < 20 ? 12 : space.id >= 30 ? pos.height - 10 : 12}
            textAnchor="middle"
            fontSize="14"
            fill="white"
          >
            🚂
          </text>
        )}

        {/* Utility icon */}
        {isUtility(space.id) && (
          <text
            x={pos.width / 2}
            y={space.id >= 10 && space.id < 20 ? 12 : space.id >= 30 ? pos.height - 10 : 12}
            textAnchor="middle"
            fontSize="12"
            fill="white"
          >
            ⚡
          </text>
        )}
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
    let textColor = '#2B2D42';

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

    return (
      <g key={space.id} transform={`translate(${pos.x}, ${pos.y})`}>
        <rect
          width={pos.width}
          height={pos.height}
          fill={bgColor}
          stroke="#2B2D42"
          strokeWidth="2"
        />
        <text
          x={pos.width / 2}
          y={pos.height / 2}
          textAnchor="middle"
          fontSize="20"
          fill={isChance || isTax ? 'white' : 'white'}
          fontFamily="Playfair Display, serif"
          fontWeight="800"
        >
          {icon}
        </text>
        <text
          x={pos.width / 2}
          y={space.id < 10 ? pos.height - 10 : space.id >= 30 ? 10 : pos.height - 5}
          textAnchor="middle"
          fontSize="6"
          fill="white"
          fontFamily="Inter, sans-serif"
          opacity="0.9"
        >
          {space.name.length > 12 ? space.name.substring(0, 10) : space.name}
        </text>
        {space.amount && (
          <text
            x={pos.width / 2}
            y={space.id < 10 ? pos.height - 22 : space.id >= 30 ? pos.height - 20 : pos.height - 20}
            textAnchor="middle"
            fontSize="7"
            fill="white"
            fontFamily="JetBrains Mono, monospace"
          >
            -${space.amount}
          </text>
        )}
      </g>
    );
  };

  // Render players on the board
  const renderPlayers = () => {
    // Group players by position
    const positionGroups = {};
    players.forEach((player, idx) => {
      if (!positionGroups[player.position]) {
        positionGroups[player.position] = [];
      }
      positionGroups[player.position].push({ ...player, index: idx });
    });

    const tokens = [];

    Object.entries(positionGroups).forEach(([pos, playersAtPos]) => {
      const position = parseInt(pos);
      const space = BOARD_SPACES[position];
      const isProp = space.type === 'property' || space.type === 'railroad' || space.type === 'utility';

      // Calculate token position
      let tokenX, tokenY;
      const spacePos = isProp ? getSpacePosition(position) : getCornerPosition(position);

      // Offset tokens based on how many are on this space
      const offsetAngle = (playersAtPos.length > 1) ? Math.PI / 4 : 0;
      const radius = 12;

      playersAtPos.forEach((player, i) => {
        if (playersAtPos.length === 1) {
          tokenX = spacePos.x + spacePos.width / 2;
          tokenY = spacePos.y + spacePos.height / 2;
        } else {
          const angle = (i / playersAtPos.length) * Math.PI * 2 - Math.PI / 2;
          tokenX = spacePos.x + spacePos.width / 2 + Math.cos(angle) * radius;
          tokenY = spacePos.y + spacePos.height / 2 + Math.sin(angle) * radius;
        }

        const isActive = idx === currentPlayerIndex;

        tokens.push(
          <g key={`token-${player.id}`} transform={`translate(${tokenX}, ${tokenY})`}>
            {isActive && (
              <circle
                r="16"
                fill="none"
                stroke={player.color}
                strokeWidth="3"
                opacity="0.8"
                className="player-token active"
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
              {player.name.charAt(0).toUpperCase()}
            </text>
          </g>
        );
      });
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
