import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { nanoid } from 'nanoid';
import { BOARD_SPACES, GROUP_COLORS } from '../../lib/game/board';

function PropertyTag({ spaceId }) {
  const space = BOARD_SPACES[spaceId];
  if (!space) return null;
  const color = GROUP_COLORS[space.group] || '#8D99AE';
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 8px',
        borderRadius: '12px',
        backgroundColor: color,
        color: '#fff',
        fontSize: '11px',
        fontFamily: 'Inter, sans-serif',
        fontWeight: '600',
        marginRight: '4px',
        marginBottom: '4px',
        textShadow: '0 1px 2px rgba(0,0,0,0.3)',
      }}
    >
      {space.name}
    </span>
  );
}

function PropCheckbox({ spaceId, checked, onChange }) {
  const space = BOARD_SPACES[spaceId];
  if (!space) return null;
  const color = GROUP_COLORS[space.group] || '#8D99AE';
  return (
    <label
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '6px 10px',
        borderRadius: '8px',
        cursor: 'pointer',
        backgroundColor: checked ? 'rgba(45,106,79,0.08)' : 'transparent',
        border: `1px solid ${checked ? '#2D6A4F' : '#E8E4D8'}`,
        marginBottom: '4px',
        transition: 'background-color 0.15s, border-color 0.15s',
      }}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(spaceId, e.target.checked)}
        style={{ accentColor: '#2D6A4F', width: '14px', height: '14px' }}
      />
      <span
        style={{
          width: '10px',
          height: '10px',
          borderRadius: '50%',
          backgroundColor: color,
          flexShrink: 0,
        }}
      />
      <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#2B2D42' }}>
        {space.name}
      </span>
    </label>
  );
}

function SectionHeading({ children }) {
  return (
    <h3
      style={{
        margin: '0 0 10px 0',
        fontFamily: 'Playfair Display, serif',
        fontSize: '16px',
        fontWeight: '700',
        color: '#2B2D42',
      }}
    >
      {children}
    </h3>
  );
}

function CashInput({ value, onChange, label }) {
  return (
    <div style={{ marginBottom: '12px' }}>
      <label
        style={{
          display: 'block',
          fontFamily: 'Inter, sans-serif',
          fontSize: '12px',
          color: '#8D99AE',
          marginBottom: '4px',
        }}
      >
        {label}
      </label>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span
          style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '18px',
            color: '#F4A261',
            fontWeight: '700',
          }}
        >
          $
        </span>
        <input
          type="number"
          min={0}
          value={value}
          onChange={(e) => onChange(Math.max(0, parseInt(e.target.value) || 0))}
          style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '18px',
            color: '#F4A261',
            fontWeight: '700',
            width: '120px',
            border: '2px solid #E8E4D8',
            borderRadius: '8px',
            padding: '4px 8px',
            outline: 'none',
            backgroundColor: '#F8F4E8',
          }}
        />
      </div>
    </div>
  );
}

function PropSection({ title, playerProperties, selected, onToggle }) {
  if (playerProperties.length === 0) {
    return (
      <div style={{ marginBottom: '16px' }}>
        <SectionHeading>{title}</SectionHeading>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#8D99AE', margin: 0 }}>
          No properties available
        </p>
      </div>
    );
  }
  return (
    <div style={{ marginBottom: '16px' }}>
      <SectionHeading>{title}</SectionHeading>
      <div>
        {playerProperties.map((pid) => (
          <PropCheckbox
            key={pid}
            spaceId={pid}
            checked={selected.includes(pid)}
            onChange={onToggle}
          />
        ))}
      </div>
    </div>
  );
}

function ProposeView({ myPlayer, allPlayers, onPropose, onClose }) {
  const tradeable = allPlayers.filter((p) => p.uuid !== myPlayer.uuid && !p.isEliminated);
  const [targetUuid, setTargetUuid] = useState(tradeable[0]?.uuid ?? '');
  const [fromCash, setFromCash] = useState(0);
  const [toCash, setToCash] = useState(0);
  const [fromProps, setFromProps] = useState([]);
  const [toProps, setToProps] = useState([]);

  const targetPlayer = tradeable.find((p) => p.uuid === targetUuid) || null;

  const myTradeable = (myPlayer.properties || []).filter((pid) => {
    const space = BOARD_SPACES[pid];
    return space && (space.type === 'property' || space.type === 'railroad' || space.type === 'utility');
  });

  const theirTradeable = (targetPlayer?.properties || []).filter((pid) => {
    const space = BOARD_SPACES[pid];
    return space && (space.type === 'property' || space.type === 'railroad' || space.type === 'utility');
  });

  function toggleProp(list, setList) {
    return (pid, checked) => {
      setList((prev) => (checked ? [...prev, pid] : prev.filter((x) => x !== pid)));
    };
  }

  function handlePropose() {
    if (!targetPlayer) return;
    const offer = {
      id: nanoid(),
      fromUuid: myPlayer.uuid,
      toUuid: targetPlayer.uuid,
      fromCash,
      toCash,
      fromProperties: fromProps,
      toProperties: toProps,
      status: 'pending',
    };
    onPropose(offer);
  }

  const canPropose =
    targetPlayer &&
    (fromCash > 0 || toCash > 0 || fromProps.length > 0 || toProps.length > 0);

  return (
    <>
      <div style={{ marginBottom: '16px' }}>
        <SectionHeading>Trade with</SectionHeading>
        <select
          value={targetUuid}
          onChange={(e) => {
            setTargetUuid(e.target.value);
            setFromProps([]);
            setToProps([]);
          }}
          style={{
            width: '100%',
            padding: '8px 12px',
            borderRadius: '8px',
            border: '2px solid #E8E4D8',
            fontFamily: 'Inter, sans-serif',
            fontSize: '14px',
            color: '#2B2D42',
            backgroundColor: '#F8F4E8',
            cursor: 'pointer',
          }}
        >
          {tradeable.map((p) => (
            <option key={p.uuid} value={p.uuid}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '16px',
          marginBottom: '20px',
        }}
      >
        <div
          style={{
            backgroundColor: '#F0F4FF',
            borderRadius: '12px',
            padding: '14px',
            border: '1px solid #D0CCC0',
          }}
        >
          <SectionHeading>My offer</SectionHeading>
          <CashInput value={fromCash} onChange={setFromCash} label="Cash I give ($)" />
          <PropSection
            title="My properties"
            playerProperties={myTradeable}
            selected={fromProps}
            onToggle={toggleProp(fromProps, setFromProps)}
          />
        </div>

        <div
          style={{
            backgroundColor: '#FFF4F0',
            borderRadius: '12px',
            padding: '14px',
            border: '1px solid #D0CCC0',
          }}
        >
          <SectionHeading>I want</SectionHeading>
          <CashInput value={toCash} onChange={setToCash} label="Cash I want ($)" />
          <PropSection
            title="Their properties"
            playerProperties={theirTradeable}
            selected={toProps}
            onToggle={toggleProp(toProps, setToProps)}
          />
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
        <motion.button
          onClick={onClose}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.98 }}
          style={{
            padding: '10px 24px',
            backgroundColor: '#E8E4D8',
            color: '#2B2D42',
            border: 'none',
            borderRadius: '10px',
            fontSize: '14px',
            fontWeight: '600',
            fontFamily: 'Inter, sans-serif',
            cursor: 'pointer',
          }}
        >
          Cancel
        </motion.button>
        <motion.button
          onClick={handlePropose}
          disabled={!canPropose}
          whileHover={canPropose ? { scale: 1.03 } : {}}
          whileTap={canPropose ? { scale: 0.98 } : {}}
          style={{
            padding: '10px 24px',
            backgroundColor: canPropose ? '#2D6A4F' : '#A8C5B5',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            fontSize: '14px',
            fontWeight: '600',
            fontFamily: 'Inter, sans-serif',
            cursor: canPropose ? 'pointer' : 'not-allowed',
          }}
        >
          Propose Trade
        </motion.button>
      </div>
    </>
  );
}

function ReviewView({ tradeOffer, otherPlayer, onAccept, onReject }) {
  if (!tradeOffer || !otherPlayer) return null;

  return (
    <>
      <p
        style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: '14px',
          color: '#2B2D42',
          margin: '0 0 16px 0',
        }}
      >
        <strong>{otherPlayer.name}</strong> wants to trade with you.
      </p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '16px',
          marginBottom: '20px',
        }}
      >
        <div
          style={{
            backgroundColor: '#F0F4FF',
            borderRadius: '12px',
            padding: '14px',
            border: '1px solid #D0CCC0',
          }}
        >
          <SectionHeading>They offer</SectionHeading>
          <div
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '20px',
              color: '#F4A261',
              fontWeight: '700',
              marginBottom: '10px',
            }}
          >
            ${tradeOffer.fromCash.toLocaleString()}
          </div>
          <div>
            {tradeOffer.fromProperties.length > 0 ? (
              tradeOffer.fromProperties.map((pid) => <PropertyTag key={pid} spaceId={pid} />)
            ) : (
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#8D99AE' }}>
                No properties
              </span>
            )}
          </div>
        </div>

        <div
          style={{
            backgroundColor: '#FFF4F0',
            borderRadius: '12px',
            padding: '14px',
            border: '1px solid #D0CCC0',
          }}
        >
          <SectionHeading>They want</SectionHeading>
          <div
            style={{
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: '20px',
              color: '#F4A261',
              fontWeight: '700',
              marginBottom: '10px',
            }}
          >
            ${tradeOffer.toCash.toLocaleString()}
          </div>
          <div>
            {tradeOffer.toProperties.length > 0 ? (
              tradeOffer.toProperties.map((pid) => <PropertyTag key={pid} spaceId={pid} />)
            ) : (
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#8D99AE' }}>
                No properties
              </span>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
        <motion.button
          onClick={() => onReject(tradeOffer.id)}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.98 }}
          style={{
            padding: '10px 24px',
            backgroundColor: '#E63946',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            fontSize: '14px',
            fontWeight: '600',
            fontFamily: 'Inter, sans-serif',
            cursor: 'pointer',
          }}
        >
          Reject
        </motion.button>
        <motion.button
          onClick={() => onAccept(tradeOffer.id)}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.98 }}
          style={{
            padding: '10px 24px',
            backgroundColor: '#2D6A4F',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            fontSize: '14px',
            fontWeight: '600',
            fontFamily: 'Inter, sans-serif',
            cursor: 'pointer',
          }}
        >
          Accept
        </motion.button>
      </div>
    </>
  );
}

export default function TradeModal({
  isOpen,
  onClose,
  mode,
  myPlayer,
  otherPlayer,
  ydoc,
  onPropose,
  onAccept,
  onReject,
  tradeOffer,
  allPlayers,
  boardSpaces,
}) {
  const title = mode === 'propose' ? 'Propose Trade' : 'Incoming Trade Offer';

  return (
    <AnimatePresence>
      {isOpen && (
        <>
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
            }}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              backgroundColor: '#F8F4E8',
              borderRadius: '16px',
              padding: '24px',
              width: '90vw',
              maxWidth: '560px',
              maxHeight: '85vh',
              overflow: 'auto',
              zIndex: 101,
              boxShadow: '0 20px 60px rgba(0,0,0,0.35)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px',
                paddingBottom: '12px',
                borderBottom: '2px solid #E8E4D8',
              }}
            >
              <h2
                style={{
                  margin: 0,
                  fontFamily: 'Playfair Display, serif',
                  fontSize: '22px',
                  fontWeight: '700',
                  color: '#2B2D42',
                }}
              >
                {title}
              </h2>
              <button
                onClick={onClose}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  border: 'none',
                  backgroundColor: '#E8E4D8',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '18px',
                  color: '#2B2D42',
                }}
              >
                ✕
              </button>
            </div>

            {mode === 'propose' ? (
              <ProposeView
                myPlayer={myPlayer}
                allPlayers={allPlayers || []}
                onPropose={onPropose}
                onClose={onClose}
              />
            ) : (
              <ReviewView
                tradeOffer={tradeOffer}
                otherPlayer={otherPlayer}
                onAccept={onAccept}
                onReject={onReject}
              />
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
