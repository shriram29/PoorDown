import { motion, AnimatePresence } from 'framer-motion';
import { BOARD_SPACES, GROUP_COLORS } from '../../../../lib/games/monopoly/board';
import { getPropertyState, getPlayerById } from '../../../../lib/games/monopoly/state';

const MONO = 'JetBrains Mono, monospace';
const SANS = 'Inter, sans-serif';
const HEADING = 'Nunito, sans-serif';

function HouseIcons({ count }) {
  if (!count || count === 0) return null;
  const isHotel = count === 5;
  return (
    <span style={{ fontSize: '14px', letterSpacing: '2px' }}>
      {isHotel ? '🏨' : '🏠'.repeat(count)}
    </span>
  );
}

function OwnerBadge({ owner }) {
  if (!owner) return null;
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '4px 10px',
        borderRadius: '20px',
        backgroundColor: owner.color || '#8D99AE',
        color: 'white',
        fontFamily: SANS,
        fontSize: '12px',
        fontWeight: '600',
        marginTop: '6px',
      }}
    >
      {owner.name}
    </div>
  );
}

function RentRow({ label, value, shaded, bold }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        padding: '5px 8px',
        backgroundColor: shaded ? '#F5F2EA' : 'transparent',
        fontFamily: MONO,
        fontSize: '12px',
        fontWeight: bold ? '700' : '400',
      }}
    >
      <span style={{ color: '#2B2D42' }}>{label}</span>
      <span style={{ color: '#E63946' }}>${value}</span>
    </div>
  );
}

function PropertyCard({ space, propState, owner }) {
  const groupColor = GROUP_COLORS[space.group] || '#8D99AE';
  const mortgage = Math.floor(space.price / 2);
  const houses = propState?.houses || 0;

  return (
    <div>
      <div
        style={{
          height: '80px',
          backgroundColor: groupColor,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 12px',
        }}
      >
        {propState?.mortgaged && (
          <span
            style={{
              fontFamily: HEADING,
              fontWeight: '800',
              fontSize: '13px',
              backgroundColor: 'rgba(0,0,0,0.5)',
              color: 'white',
              padding: '2px 10px',
              borderRadius: '4px',
              letterSpacing: '2px',
              marginBottom: '4px',
            }}
          >
            MORTGAGED
          </span>
        )}
        {houses > 0 && <HouseIcons count={houses} />}
      </div>

      <div style={{ padding: '16px 16px 0' }}>
        <div
          style={{
            fontFamily: HEADING,
            fontSize: '10px',
            fontWeight: '700',
            letterSpacing: '2px',
            color: '#8D99AE',
            textTransform: 'uppercase',
            marginBottom: '4px',
          }}
        >
          Title Deed
        </div>
        <div
          style={{
            fontFamily: HEADING,
            fontSize: '20px',
            fontWeight: '800',
            color: '#2B2D42',
            lineHeight: '1.2',
            marginBottom: '4px',
          }}
        >
          {space.name}
        </div>

        {owner ? (
          <OwnerBadge owner={owner} />
        ) : (
          <div style={{ fontFamily: SANS, fontSize: '12px', color: '#8D99AE', marginTop: '2px' }}>
            Unowned
          </div>
        )}
      </div>

      <div style={{ margin: '14px 0 0', borderTop: '1px solid #E8E4D8' }}>
        <RentRow label="Rent" value={space.rent[0]} shaded={false} />
        <RentRow label="With 1 House" value={space.rent[1]} shaded />
        <RentRow label="With 2 Houses" value={space.rent[2]} shaded={false} />
        <RentRow label="With 3 Houses" value={space.rent[3]} shaded />
        <RentRow label="With 4 Houses" value={space.rent[4]} shaded={false} />
        <RentRow label="With HOTEL" value={space.rent[5]} shaded bold />
      </div>

      <div
        style={{
          margin: '0',
          padding: '10px 16px',
          borderTop: '1px solid #E8E4D8',
          fontFamily: MONO,
          fontSize: '11px',
          color: '#8D99AE',
          lineHeight: '1.8',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Mortgage Value</span>
          <span>${mortgage}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Houses cost</span>
          <span>${space.housePrice} each</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Hotels cost</span>
          <span>${space.housePrice} + 4 houses</span>
        </div>
      </div>

      <div
        style={{
          padding: '12px 16px',
          borderTop: '2px solid #2B2D42',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#F5F2EA',
        }}
      >
        <span style={{ fontFamily: HEADING, fontWeight: '700', fontSize: '14px', color: '#2B2D42' }}>
          Price
        </span>
        <span style={{ fontFamily: MONO, fontWeight: '700', fontSize: '18px', color: '#2B2D42' }}>
          ${space.price}
        </span>
      </div>
    </div>
  );
}

function RailroadCard({ space, owner }) {
  return (
    <div>
      <div
        style={{
          backgroundColor: '#2B2D42',
          height: '80px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '40px',
        }}
      >
        🚂
      </div>

      <div style={{ padding: '16px 16px 0' }}>
        <div
          style={{
            fontFamily: HEADING,
            fontSize: '10px',
            fontWeight: '700',
            letterSpacing: '2px',
            color: '#8D99AE',
            textTransform: 'uppercase',
            marginBottom: '4px',
          }}
        >
          Railroad
        </div>
        <div
          style={{
            fontFamily: HEADING,
            fontSize: '20px',
            fontWeight: '800',
            color: '#2B2D42',
            lineHeight: '1.2',
            marginBottom: '4px',
          }}
        >
          {space.name}
        </div>
        {owner ? <OwnerBadge owner={owner} /> : (
          <div style={{ fontFamily: SANS, fontSize: '12px', color: '#8D99AE', marginTop: '2px' }}>Unowned</div>
        )}
      </div>

      <div style={{ margin: '14px 0 0', borderTop: '1px solid #E8E4D8' }}>
        <RentRow label="1 Railroad owned" value={25} shaded={false} />
        <RentRow label="2 Railroads owned" value={50} shaded />
        <RentRow label="3 Railroads owned" value={100} shaded={false} />
        <RentRow label="4 Railroads owned" value={200} shaded bold />
      </div>

      <div
        style={{
          padding: '12px 16px',
          borderTop: '2px solid #2B2D42',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#F5F2EA',
        }}
      >
        <span style={{ fontFamily: HEADING, fontWeight: '700', fontSize: '14px', color: '#2B2D42' }}>Price</span>
        <span style={{ fontFamily: MONO, fontWeight: '700', fontSize: '18px', color: '#2B2D42' }}>$200</span>
      </div>
    </div>
  );
}

function UtilityCard({ space, owner }) {
  const emoji = space.name === 'Electric Company' ? '⚡' : '💧';
  return (
    <div>
      <div
        style={{
          backgroundColor: '#4A90D9',
          height: '80px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '40px',
        }}
      >
        {emoji}
      </div>

      <div style={{ padding: '16px 16px 0' }}>
        <div
          style={{
            fontFamily: HEADING,
            fontSize: '10px',
            fontWeight: '700',
            letterSpacing: '2px',
            color: '#8D99AE',
            textTransform: 'uppercase',
            marginBottom: '4px',
          }}
        >
          Utility
        </div>
        <div
          style={{
            fontFamily: HEADING,
            fontSize: '20px',
            fontWeight: '800',
            color: '#2B2D42',
            lineHeight: '1.2',
            marginBottom: '4px',
          }}
        >
          {space.name}
        </div>
        {owner ? <OwnerBadge owner={owner} /> : (
          <div style={{ fontFamily: SANS, fontSize: '12px', color: '#8D99AE', marginTop: '2px' }}>Unowned</div>
        )}
      </div>

      <div style={{ margin: '14px 0 0', borderTop: '1px solid #E8E4D8' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '5px 8px',
            fontFamily: MONO,
            fontSize: '12px',
          }}
        >
          <span style={{ color: '#2B2D42' }}>If 1 utility owned</span>
          <span style={{ color: '#E63946' }}>4× dice roll</span>
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '5px 8px',
            backgroundColor: '#F5F2EA',
            fontFamily: MONO,
            fontSize: '12px',
            fontWeight: '700',
          }}
        >
          <span style={{ color: '#2B2D42' }}>If both owned</span>
          <span style={{ color: '#E63946' }}>10× dice roll</span>
        </div>
      </div>

      <div
        style={{
          padding: '12px 16px',
          borderTop: '2px solid #2B2D42',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: '#F5F2EA',
        }}
      >
        <span style={{ fontFamily: HEADING, fontWeight: '700', fontSize: '14px', color: '#2B2D42' }}>Price</span>
        <span style={{ fontFamily: MONO, fontWeight: '700', fontSize: '18px', color: '#2B2D42' }}>$150</span>
      </div>
    </div>
  );
}

function SimpleCard({ bg, icon, title, titleColor, body }) {
  return (
    <div>
      <div
        style={{
          backgroundColor: bg,
          height: '80px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '40px',
        }}
      >
        {icon}
      </div>
      <div style={{ padding: '24px 20px' }}>
        <div
          style={{
            fontFamily: HEADING,
            fontSize: '24px',
            fontWeight: '800',
            color: titleColor || '#2B2D42',
            marginBottom: '12px',
            textAlign: 'center',
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontFamily: SANS,
            fontSize: '14px',
            color: '#2B2D42',
            textAlign: 'center',
            lineHeight: '1.6',
          }}
        >
          {body}
        </div>
      </div>
    </div>
  );
}

function TaxCard({ space }) {
  return (
    <div>
      <div
        style={{
          backgroundColor: '#E63946',
          height: '80px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '40px',
        }}
      >
        💸
      </div>
      <div style={{ padding: '20px' }}>
        <div
          style={{
            fontFamily: HEADING,
            fontSize: '22px',
            fontWeight: '800',
            color: '#2B2D42',
            textAlign: 'center',
            marginBottom: '16px',
          }}
        >
          {space.name}
        </div>
        <div
          style={{
            textAlign: 'center',
            fontFamily: MONO,
            fontSize: '36px',
            fontWeight: '700',
            color: '#E63946',
            marginBottom: '12px',
          }}
        >
          ${space.amount}
        </div>
        <div
          style={{
            fontFamily: SANS,
            fontSize: '13px',
            color: '#8D99AE',
            textAlign: 'center',
          }}
        >
          Pay this amount when you land here
        </div>
      </div>
    </div>
  );
}

function ChanceCard() {
  return (
    <div>
      <div
        style={{
          backgroundColor: '#F4A261',
          height: '80px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '40px',
        }}
      >
        ❓
      </div>
      <div style={{ padding: '24px 20px' }}>
        <div
          style={{
            fontFamily: HEADING,
            fontSize: '26px',
            fontWeight: '800',
            color: '#F4A261',
            textAlign: 'center',
            marginBottom: '16px',
          }}
        >
          Chance
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            marginBottom: '16px',
          }}
        >
          <div
            style={{
              width: '60px',
              height: '80px',
              backgroundColor: '#F4A261',
              borderRadius: '6px',
              border: '3px solid #2B2D42',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '28px',
              boxShadow: '3px 3px 0 #2B2D42',
            }}
          >
            ?
          </div>
        </div>
        <div
          style={{
            fontFamily: SANS,
            fontSize: '14px',
            color: '#2B2D42',
            textAlign: 'center',
            lineHeight: '1.6',
          }}
        >
          Draw a card from the Chance deck!
        </div>
      </div>
    </div>
  );
}

function CommunityChestCard() {
  return (
    <div>
      <div
        style={{
          backgroundColor: '#87CEEB',
          height: '80px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '40px',
        }}
      >
        🏦
      </div>
      <div style={{ padding: '24px 20px' }}>
        <div
          style={{
            fontFamily: HEADING,
            fontSize: '22px',
            fontWeight: '800',
            color: '#1D3557',
            textAlign: 'center',
            marginBottom: '16px',
          }}
        >
          Community Chest
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            marginBottom: '16px',
          }}
        >
          <div
            style={{
              width: '60px',
              height: '80px',
              backgroundColor: '#87CEEB',
              borderRadius: '6px',
              border: '3px solid #2B2D42',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '28px',
              boxShadow: '3px 3px 0 #2B2D42',
            }}
          >
            🏦
          </div>
        </div>
        <div
          style={{
            fontFamily: SANS,
            fontSize: '14px',
            color: '#2B2D42',
            textAlign: 'center',
            lineHeight: '1.6',
          }}
        >
          Draw a card from the Community Chest deck!
        </div>
      </div>
    </div>
  );
}

function renderContent(space, propState, owner) {
  switch (space.type) {
    case 'property':
      return <PropertyCard space={space} propState={propState} owner={owner} />;
    case 'railroad':
      return <RailroadCard space={space} owner={owner} />;
    case 'utility':
      return <UtilityCard space={space} owner={owner} />;
    case 'tax':
      return <TaxCard space={space} />;
    case 'chance':
      return <ChanceCard />;
    case 'communityChest':
      return <CommunityChestCard />;
    case 'go':
      return (
        <SimpleCard
          bg="#228B22"
          icon="➡️"
          title="GO"
          titleColor="#228B22"
          body="Collect $200 salary as you pass"
        />
      );
    case 'jail':
      return (
        <SimpleCard
          bg="#8D99AE"
          icon="🏛️"
          title="Just Visiting / Jail"
          body="Nothing happens when you land here (unless sent to jail)"
        />
      );
    case 'goToJail':
      return (
        <SimpleCard
          bg="#E63946"
          icon="👮"
          title="Go To Jail!"
          titleColor="#E63946"
          body="Go directly to Jail. Do not pass Go. Do not collect $200."
        />
      );
    case 'freeParking':
      return (
        <SimpleCard
          bg="#FFD700"
          icon="🅿️"
          title="Free Parking"
          body="Nothing happens. Take a rest!"
        />
      );
    default:
      return (
        <SimpleCard
          bg="#8D99AE"
          icon="🎲"
          title={space.name}
          body={space.description || ''}
        />
      );
  }
}

export default function SpaceDetailModal({ isOpen, onClose, spaceId, ydoc, myPlayerId }) {
  if (spaceId == null) return null;
  const space = BOARD_SPACES[spaceId];
  if (!space) return null;

  const propState = ydoc ? getPropertyState(ydoc, spaceId) : null;
  const owner = propState?.owner && ydoc ? getPlayerById(ydoc, propState.owner) : null;

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
            backgroundColor: 'rgba(43, 45, 66, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 300,
            padding: '20px',
          }}
        >
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: 'white',
              borderRadius: '12px',
              border: '2px solid #2B2D42',
              width: '300px',
              overflow: 'hidden',
              position: 'relative',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            <button
              onClick={onClose}
              style={{
                position: 'absolute',
                top: '8px',
                right: '8px',
                background: 'rgba(0,0,0,0.2)',
                border: 'none',
                borderRadius: '50%',
                width: '28px',
                height: '28px',
                cursor: 'pointer',
                color: 'white',
                fontSize: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 1,
              }}
            >
              ×
            </button>

            {renderContent(space, propState, owner)}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
