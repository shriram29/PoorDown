import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const DEFAULTS = {
  startingCash: 1500,
  auctionEnabled: true,
  freeParkingJackpot: 0,
  jailFine: 50,
};

function SegmentedGroup({ options, value, onChange, mono = false, disabled = false }) {
  return (
    <div
      style={{
        display: 'inline-flex',
        backgroundColor: '#F0F0F0',
        borderRadius: '999px',
        padding: '3px',
        gap: '2px',
      }}
    >
      {options.map((opt) => {
        const selected = opt.value === value;
        return (
          <button
            key={opt.value}
            onClick={() => !disabled && onChange(opt.value)}
            style={{
              padding: '6px 14px',
              borderRadius: '999px',
              border: 'none',
              cursor: disabled ? 'default' : 'pointer',
              backgroundColor: selected ? '#2D6A4F' : 'transparent',
              color: selected ? '#fff' : '#8D99AE',
              fontFamily: mono ? 'JetBrains Mono, monospace' : 'Inter, sans-serif',
              fontSize: '14px',
              fontWeight: selected ? '600' : '400',
              transition: 'background-color 0.15s, color 0.15s',
              outline: 'none',
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

function ToggleSwitch({ value, onChange, disabled = false }) {
  return (
    <div
      onClick={() => !disabled && onChange(!value)}
      style={{
        width: '48px',
        height: '26px',
        borderRadius: '999px',
        backgroundColor: value ? '#2D6A4F' : '#D0D0D0',
        cursor: disabled ? 'default' : 'pointer',
        position: 'relative',
        transition: 'background-color 0.2s',
        flexShrink: 0,
      }}
    >
      <motion.div
        animate={{ x: value ? 24 : 2 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        style={{
          position: 'absolute',
          top: '3px',
          width: '20px',
          height: '20px',
          borderRadius: '50%',
          backgroundColor: '#fff',
          boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
        }}
      />
    </div>
  );
}

function SettingRow({ label, children }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        paddingBottom: '20px',
        marginBottom: '20px',
        borderBottom: '1px solid #EBEBEB',
      }}
    >
      <span
        style={{
          fontFamily: 'Inter, sans-serif',
          fontSize: '14px',
          color: '#8D99AE',
          textTransform: 'uppercase',
          letterSpacing: '1px',
          flexShrink: 0,
        }}
      >
        {label}
      </span>
      {children}
    </div>
  );
}

export default function GameConfigModal({ isOpen, onClose, onSave, isHost, currentConfig }) {
  const [config, setConfig] = useState({ ...DEFAULTS, ...currentConfig });

  useEffect(() => {
    if (isOpen) {
      setConfig({ ...DEFAULTS, ...currentConfig });
    }
  }, [isOpen, currentConfig]);

  function set(key, val) {
    setConfig((prev) => ({ ...prev, [key]: val }));
  }

  function handleSave() {
    onSave(config);
    onClose();
  }

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
              backgroundColor: '#fff',
              borderRadius: '16px',
              padding: '32px',
              width: '100%',
              maxWidth: '480px',
              maxHeight: '90vh',
              overflowY: 'auto',
              zIndex: 101,
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '28px',
                paddingBottom: '16px',
                borderBottom: '2px solid #EBEBEB',
              }}
            >
              <h2
                style={{
                  margin: 0,
                  fontFamily: 'Nunito, sans-serif',
                  fontSize: '24px',
                  fontWeight: '700',
                  color: '#2B2D42',
                }}
              >
                Game Settings
              </h2>
              <button
                onClick={onClose}
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  border: 'none',
                  backgroundColor: '#F0F0F0',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '16px',
                  color: '#2B2D42',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#E0E0E0')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#F0F0F0')}
              >
                ✕
              </button>
            </div>

            <SettingRow label="Starting Cash">
              <SegmentedGroup
                options={[
                  { label: '$1000', value: 1000 },
                  { label: '$1500', value: 1500 },
                  { label: '$2000', value: 2000 },
                  { label: '$3000', value: 3000 },
                ]}
                value={config.startingCash}
                onChange={(v) => set('startingCash', v)}
                mono
                disabled={!isHost}
              />
            </SettingRow>

            <SettingRow label="Auction on decline">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    fontSize: '16px',
                    color: '#2B2D42',
                  }}
                >
                  {config.auctionEnabled ? 'On' : 'Off'}
                </span>
                <ToggleSwitch
                  value={config.auctionEnabled}
                  onChange={(v) => set('auctionEnabled', v)}
                  disabled={!isHost}
                />
              </div>
            </SettingRow>

            <SettingRow label="Free Parking jackpot">
              <SegmentedGroup
                options={[
                  { label: 'Off', value: 0 },
                  { label: '$100', value: 100 },
                  { label: '$500', value: 500 },
                ]}
                value={config.freeParkingJackpot}
                onChange={(v) => set('freeParkingJackpot', v)}
                mono
                disabled={!isHost}
              />
            </SettingRow>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '16px',
                marginBottom: '28px',
              }}
            >
              <span
                style={{
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '14px',
                  color: '#8D99AE',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  flexShrink: 0,
                }}
              >
                Jail fine
              </span>
              <SegmentedGroup
                options={[
                  { label: '$50', value: 50 },
                  { label: '$100', value: 100 },
                ]}
                value={config.jailFine}
                onChange={(v) => set('jailFine', v)}
                mono
                disabled={!isHost}
              />
            </div>

            {isHost ? (
              <motion.button
                onClick={handleSave}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                style={{
                  width: '100%',
                  padding: '14px',
                  backgroundColor: '#2D6A4F',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '16px',
                  fontWeight: '600',
                  fontFamily: 'Inter, sans-serif',
                  cursor: 'pointer',
                }}
              >
                Save Settings
              </motion.button>
            ) : (
              <p
                style={{
                  margin: 0,
                  textAlign: 'center',
                  fontFamily: 'Inter, sans-serif',
                  fontSize: '13px',
                  color: '#8D99AE',
                }}
              >
                Only the host can change game settings.
              </p>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
