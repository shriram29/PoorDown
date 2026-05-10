import { motion, AnimatePresence } from 'framer-motion';
import { getPlayerById, getPropertyState, canBuildHouse, ownsColorSet } from '../../../../lib/games/monopoly/state';
import { BOARD_SPACES, GROUP_COLORS } from '../../../../lib/games/monopoly/board';

function HouseIcons({ count }) {
  if (count === 0) return null;
  if (count === 5) {
    return (
      <div
        style={{
          display: 'inline-block',
          width: '16px',
          height: '14px',
          backgroundColor: '#8B4513',
          borderRadius: '3px',
          marginLeft: '4px',
          verticalAlign: 'middle',
          title: 'Hotel',
        }}
      />
    );
  }
  return (
    <span style={{ marginLeft: '4px' }}>
      {Array.from({ length: count }).map((_, i) => (
        <span
          key={i}
          style={{
            display: 'inline-block',
            width: '10px',
            height: '10px',
            backgroundColor: '#F4A261',
            borderRadius: '2px',
            marginRight: '2px',
            verticalAlign: 'middle',
          }}
        />
      ))}
    </span>
  );
}

function ActionButton({ onClick, disabled, color, children }) {
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      whileHover={disabled ? {} : { scale: 1.05 }}
      whileTap={disabled ? {} : { scale: 0.97 }}
      style={{
        padding: '5px 8px',
        backgroundColor: disabled ? '#D0CCC0' : color,
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        fontSize: '11px',
        fontWeight: '600',
        fontFamily: 'Inter, sans-serif',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        transition: 'background-color 0.15s',
      }}
    >
      {children}
    </motion.button>
  );
}

function PropertyCard({ space, propState, player, ydoc, onBuildHouse, onSellHouse, onMortgage, onUnmortgage }) {
  const groupColor = GROUP_COLORS[space.group] || '#8D99AE';
  const { houses = 0, mortgaged = false } = propState;

  const currentRent = space.rent ? space.rent[houses] : null;
  const mortgageValue = space.price ? Math.floor(space.price / 2) : null;
  const unmortgageCost = space.price ? Math.floor(space.price / 2 * 1.1) : null;

  const canBuild = space.type === 'property' && !mortgaged && canBuildHouse(ydoc, player.uuid, space.id);
  const couldBuildIfAfford = space.type === 'property' && !mortgaged && ownsColorSet(ydoc, player.uuid, space.group) && houses < 5;
  const showBuildButton = couldBuildIfAfford;
  const canSell = space.type === 'property' && houses > 0;
  const canMortgage = !mortgaged && houses === 0;
  const canUnmortgage = mortgaged && player.cash >= unmortgageCost;
  const showUnmortgage = mortgaged;

  return (
    <div
      style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        border: '1px solid #E8E8E8',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{ height: '8px', backgroundColor: groupColor }} />
      <div style={{ padding: '12px', flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <span
            style={{
              fontFamily: 'Inter, sans-serif',
              fontWeight: '600',
              fontSize: '12px',
              color: '#2B2D42',
              lineHeight: '1.3',
              flex: 1,
            }}
          >
            {space.name}
          </span>
          {mortgaged && (
            <span
              style={{
                marginLeft: '6px',
                backgroundColor: '#E63946',
                color: 'white',
                fontSize: '9px',
                fontFamily: 'Inter, sans-serif',
                fontWeight: '700',
                padding: '2px 5px',
                borderRadius: '4px',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              MORTGAGED
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', minHeight: '14px' }}>
          {houses > 0 && (
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#8D99AE' }}>
              {houses === 5 ? 'Hotel' : `${houses} house${houses > 1 ? 's' : ''}`}
            </span>
          )}
          <HouseIcons count={houses} />
        </div>

        {currentRent !== null && !mortgaged && (
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: '#2D6A4F' }}>
            Rent: ${currentRent}
          </div>
        )}

        {mortgageValue !== null && (
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '10px', color: '#8D99AE' }}>
            {mortgaged
              ? `Unmortgage: $${unmortgageCost}`
              : `Mortgage: $${mortgageValue}`}
          </div>
        )}

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
          {showBuildButton && (
            <ActionButton onClick={() => onBuildHouse(space.id)} disabled={!canBuild} color="#2D6A4F">
              Build
            </ActionButton>
          )}
          {canSell && (
            <ActionButton onClick={() => onSellHouse(space.id)} disabled={false} color="#8D99AE">
              Sell
            </ActionButton>
          )}
          {canMortgage && (
            <ActionButton onClick={() => onMortgage(space.id)} disabled={false} color="#E63946">
              Mortgage
            </ActionButton>
          )}
          {showUnmortgage && (
            <ActionButton onClick={() => onUnmortgage(space.id)} disabled={!canUnmortgage} color="#1D3557">
              Unmortgage
            </ActionButton>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PropertyManagementModal({
  isOpen,
  onClose,
  playerUuid,
  ydoc,
  boardSpaces,
  groupColors,
  onBuildHouse,
  onSellHouse,
  onMortgage,
  onUnmortgage,
}) {
  if (!isOpen) return null;

  const player = getPlayerById(ydoc, playerUuid);
  const ownedIds = player?.properties ?? [];

  const ownedSpaces = ownedIds
    .map(id => BOARD_SPACES[id])
    .filter(Boolean);

  const grouped = {};
  for (const space of ownedSpaces) {
    const key = space.group || space.type;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(space);
  }

  const groupOrder = ['brown', 'lightBlue', 'pink', 'orange', 'red', 'yellow', 'green', 'darkBlue', 'railroad', 'utility'];
  const sortedGroups = Object.keys(grouped).sort((a, b) => {
    const ai = groupOrder.indexOf(a);
    const bi = groupOrder.indexOf(b);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });

  const groupLabel = {
    brown: 'Brown',
    lightBlue: 'Light Blue',
    pink: 'Pink',
    orange: 'Orange',
    red: 'Red',
    yellow: 'Yellow',
    green: 'Green',
    darkBlue: 'Dark Blue',
    railroad: 'Railroads',
    utility: 'Utilities',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(43, 45, 66, 0.85)',
            backdropFilter: 'blur(4px)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 24 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: 'white',
              borderRadius: '16px',
              padding: '24px',
              width: '100%',
              maxWidth: '700px',
              maxHeight: '85vh',
              overflowY: 'auto',
              boxShadow: '0 24px 64px rgba(0,0,0,0.35)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px',
                paddingBottom: '12px',
                borderBottom: '2px solid #E8E8E8',
              }}
            >
              <h2
                style={{
                  margin: 0,
                  fontFamily: 'Nunito, sans-serif',
                  fontSize: '22px',
                  fontWeight: '700',
                  color: '#2B2D42',
                }}
              >
                My Properties
              </h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '13px', color: '#2D6A4F', fontWeight: '600' }}>
                  ${player?.cash?.toLocaleString() ?? 0}
                </span>
                <button
                  onClick={onClose}
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    border: 'none',
                    backgroundColor: '#E8E8E8',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '16px',
                    color: '#2B2D42',
                  }}
                >
                  ✕
                </button>
              </div>
            </div>

            {ownedSpaces.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '40px 0',
                  fontFamily: 'Inter, sans-serif',
                  color: '#8D99AE',
                  fontSize: '15px',
                }}
              >
                You don't own any properties yet.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {sortedGroups.map(group => {
                  const color = GROUP_COLORS[group] || '#8D99AE';
                  return (
                    <div key={group}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          marginBottom: '10px',
                        }}
                      >
                        <div
                          style={{
                            width: '12px',
                            height: '12px',
                            borderRadius: '3px',
                            backgroundColor: color,
                            flexShrink: 0,
                          }}
                        />
                        <span
                          style={{
                            fontFamily: 'Inter, sans-serif',
                            fontSize: '13px',
                            fontWeight: '600',
                            color: '#2B2D42',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                          }}
                        >
                          {groupLabel[group] || group}
                        </span>
                      </div>
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                          gap: '10px',
                        }}
                      >
                        {grouped[group].map(space => (
                          <PropertyCard
                            key={space.id}
                            space={space}
                            propState={getPropertyState(ydoc, space.id)}
                            player={player}
                            ydoc={ydoc}
                            onBuildHouse={onBuildHouse}
                            onSellHouse={onSellHouse}
                            onMortgage={onMortgage}
                            onUnmortgage={onUnmortgage}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
